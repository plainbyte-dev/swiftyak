import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import PaymentVoucher from '../models/PaymentVoucher.js';
import Company from '../models/Company.js';
import Bill from '../models/Bill.js';
import Counter from '../models/Counter.js';
import BillSettings from '../models/BillSettings.js';

const round2 = (n) => Math.round(n * 100) / 100;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    List payment vouchers — search, company, date range, status filter, paginate
// @route   GET /api/vouchers?search=&company=&status=&from=&to=&page=&perPage=
// @access  Private
export const getVouchers = asyncHandler(async (req, res) => {
  const { search = '', company, status = 'all', from, to, page = 1, perPage = 10 } = req.query;

  const filter = {};
  if (status !== 'all') filter.status = status;
  if (company && mongoose.isValidObjectId(company)) filter.company = new mongoose.Types.ObjectId(company);

  if (from || to) {
    filter.voucherDate = {};
    if (from) filter.voucherDate.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.voucherDate.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [
      { 'payee.name': rx },
      { 'payee.pan': rx },
      { supplierBillNo: rx },
      { paymentRef: rx },
      { 'items.awb': rx },
    ];
    const asNumber = Number(search.replace(/^#/, ''));
    if (Number.isInteger(asNumber) && asNumber > 0) {
      filter.$or.push({ voucherNumber: asNumber }, { againstBillNo: asNumber });
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  // Allow large pages so the whole register can be exported to Excel in one go.
  const perPageNum = Math.min(5000, Math.max(1, parseInt(perPage, 10) || 10));

  const [total, vouchers, totals] = await Promise.all([
    PaymentVoucher.countDocuments(filter),
    PaymentVoucher.find(filter)
      .sort({ voucherNumber: -1 })
      .skip((pageNum - 1) * perPageNum)
      .limit(perPageNum),
    PaymentVoucher.aggregate([
      { $match: { ...filter, status: 'issued' } },
      { $group: { _id: null, amount: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: vouchers,
    summary: {
      issuedCount: totals[0]?.count ?? 0,
      issuedAmount: round2(totals[0]?.amount ?? 0),
    },
    pagination: {
      total,
      page: pageNum,
      perPage: perPageNum,
      totalPages: Math.max(1, Math.ceil(total / perPageNum)),
    },
  });
});

// @desc    Get a single payment voucher
// @route   GET /api/vouchers/:id
// @access  Private
export const getVoucher = asyncHandler(async (req, res) => {
  const voucher = await PaymentVoucher.findById(req.params.id).populate('createdBy', 'name');
  if (!voucher) {
    res.status(404);
    throw new Error('Payment voucher not found');
  }
  res.json({ success: true, data: voucher });
});

// @desc    Issue a payment voucher to a partner company. Totals are recalculated here.
// @route   POST /api/vouchers
// @access  Private (admin, dispatcher)
export const createVoucher = asyncHandler(async (req, res) => {
  const {
    company: companyId, payee = {}, items, otherCharges = 0, discount = 0, voucherDate,
    paymentMode, paymentRef, supplierBillNo, againstBillNo, remarks,
  } = req.body;

  if (!companyId || !mongoose.isValidObjectId(companyId)) {
    res.status(400);
    throw new Error('Choose the partner company that was paid');
  }
  const company = await Company.findById(companyId);
  if (!company) {
    res.status(400);
    throw new Error('Partner company not found');
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Add at least one item to the voucher');
  }

  const cleanItems = items.map((item, i) => {
    const quantity = Number(item.quantity);
    const rate = Number(item.rate);
    if (!item.description?.trim()) {
      res.status(400);
      throw new Error(`Item ${i + 1}: description is required`);
    }
    if (!(quantity > 0) || !(rate >= 0)) {
      res.status(400);
      throw new Error(`Item ${i + 1}: quantity must be > 0 and rate must be ≥ 0`);
    }
    return {
      awb: item.awb?.trim() || '',
      from: item.from?.trim() || '',
      to: item.to?.trim() || '',
      description: item.description.trim(),
      quantity,
      unit: item.unit?.trim() || '',
      rate: round2(rate),
      amount: round2(quantity * rate),
    };
  });

  const subtotal = round2(cleanItems.reduce((sum, item) => sum + item.amount, 0));
  const otherNum = round2(Number(otherCharges) || 0);
  if (otherNum < 0) {
    res.status(400);
    throw new Error('Other charges cannot be negative');
  }
  const gross = round2(subtotal + otherNum);
  const discountNum = round2(Number(discount) || 0);
  if (discountNum < 0 || discountNum > gross) {
    res.status(400);
    throw new Error('Discount must be between 0 and the total');
  }

  let againstNum = null;
  if (againstBillNo !== undefined && againstBillNo !== null && againstBillNo !== '') {
    againstNum = Number(againstBillNo);
    if (!Number.isInteger(againstNum) || !(await Bill.exists({ billNumber: againstNum }))) {
      res.status(400);
      throw new Error(`Customer bill no. ${againstBillNo} doesn't exist`);
    }
  }

  const settings = await BillSettings.get();

  const voucher = new PaymentVoucher({
    voucherNumber: 0, // placeholder until validation passes
    voucherDate: voucherDate ? new Date(voucherDate) : new Date(),
    company: company._id,
    payee: {
      name: company.name,
      pan: payee.pan?.trim() || '',
      address: payee.address?.trim() ?? company.address ?? '',
      phone: payee.phone?.trim() ?? company.phone ?? '',
    },
    seller: {
      name: settings.businessName,
      shortName: settings.shortName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      pan: settings.pan,
    },
    items: cleanItems,
    subtotal,
    otherCharges: otherNum,
    discount: discountNum,
    total: round2(gross - discountNum),
    paymentMode,
    paymentRef: paymentRef?.trim() || '',
    supplierBillNo: supplierBillNo?.trim() || '',
    againstBillNo: againstNum,
    remarks: remarks?.trim() || '',
    createdBy: req.user._id,
  });

  // Validate everything first so a rejected voucher never consumes a number.
  await voucher.validate();
  voucher.voucherNumber = await Counter.next('voucherNumber');
  await voucher.save();

  res.status(201).json({ success: true, data: voucher });
});

// @desc    Cancel a payment voucher (never deleted, to keep numbering auditable)
// @route   PATCH /api/vouchers/:id/cancel
// @access  Private (admin)
export const cancelVoucher = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason?.trim()) {
    res.status(400);
    throw new Error('A reason is required to cancel a voucher');
  }

  const voucher = await PaymentVoucher.findById(req.params.id);
  if (!voucher) {
    res.status(404);
    throw new Error('Payment voucher not found');
  }
  if (voucher.status === 'cancelled') {
    res.status(400);
    throw new Error('This voucher is already cancelled');
  }

  voucher.status = 'cancelled';
  voucher.cancelReason = reason.trim();
  voucher.cancelledAt = new Date();
  await voucher.save();

  res.json({ success: true, data: voucher });
});
