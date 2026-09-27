import asyncHandler from 'express-async-handler';
import Bill from '../models/Bill.js';
import Counter from '../models/Counter.js';
import BillSettings from '../models/BillSettings.js';

const SETTINGS_TEXT_FIELDS = [
  'businessName', 'shortName', 'address', 'phone', 'email', 'website', 'pan',
  'signatoryName', 'signatoryTitle', 'footerNote', 'printerNote',
];
const SETTINGS_IMAGE_FIELDS = ['logo', 'stamp', 'signature'];

const round2 = (n) => Math.round(n * 100) / 100;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    List bills — search, date range, status filter, paginate
// @route   GET /api/bills?search=&status=&from=&to=&page=&perPage=
// @access  Private
export const getBills = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', from, to, page = 1, perPage = 10 } = req.query;

  const filter = {};
  if (status !== 'all') filter.status = status;

  if (from || to) {
    filter.billDate = {};
    if (from) filter.billDate.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.billDate.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ 'customer.name': rx }, { 'customer.pan': rx }, { 'customer.phone': rx }];
    const asNumber = Number(search.replace(/^#/, ''));
    if (Number.isInteger(asNumber) && asNumber > 0) filter.$or.push({ billNumber: asNumber });
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  // Allow large pages so the whole register can be exported to Excel in one go.
  const perPageNum = Math.min(5000, Math.max(1, parseInt(perPage, 10) || 10));

  const [total, bills, totals] = await Promise.all([
    Bill.countDocuments(filter),
    Bill.find(filter)
      .sort({ billNumber: -1 })
      .skip((pageNum - 1) * perPageNum)
      .limit(perPageNum),
    Bill.aggregate([
      { $match: { ...filter, status: 'issued' } },
      { $group: { _id: null, amount: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: bills,
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

// @desc    Get a single bill
// @route   GET /api/bills/:id
// @access  Private
export const getBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate('createdBy', 'name');
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }
  res.json({ success: true, data: bill });
});

// @desc    Issue a new bill. Amounts are recalculated here — the client's totals are not trusted.
// @route   POST /api/bills
// @access  Private (admin, dispatcher)
export const createBill = asyncHandler(async (req, res) => {
  const { customer, items, codCharge = 0, otherCharges = 0, discount = 0, billDate, paymentMode, remarks } = req.body;

  if (!customer?.name?.trim()) {
    res.status(400);
    throw new Error('Customer name is required');
  }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Add at least one item to the bill');
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
  const codNum = round2(Number(codCharge) || 0);
  const otherNum = round2(Number(otherCharges) || 0);
  if (codNum < 0 || otherNum < 0) {
    res.status(400);
    throw new Error('Charges cannot be negative');
  }
  const gross = round2(subtotal + codNum + otherNum);
  const discountNum = round2(Number(discount) || 0);
  if (discountNum < 0 || discountNum > gross) {
    res.status(400);
    throw new Error('Discount must be between 0 and the total');
  }

  const settings = await BillSettings.get();

  const bill = new Bill({
    billNumber: 0, // placeholder until validation passes
    // Snapshot the seller details so old bills keep the details they were issued with.
    seller: {
      name: settings.businessName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      pan: settings.pan,
      shortName: settings.shortName,
    },
    billDate: billDate ? new Date(billDate) : new Date(),
    customer: {
      name: customer.name.trim(),
      pan: customer.pan?.trim() || '',
      address: customer.address?.trim() || '',
      phone: customer.phone?.trim() || '',
    },
    items: cleanItems,
    subtotal,
    codCharge: codNum,
    otherCharges: otherNum,
    discount: discountNum,
    total: round2(gross - discountNum),
    paymentMode,
    remarks: remarks?.trim() || '',
    createdBy: req.user._id,
  });

  // Validate everything first so a rejected bill never consumes a bill number.
  await bill.validate();
  bill.billNumber = await Counter.next('billNumber');
  await bill.save();

  res.status(201).json({ success: true, data: bill });
});

// @desc    Cancel a bill (bills are never deleted, to keep the numbering auditable)
// @route   PATCH /api/bills/:id/cancel
// @access  Private (admin)
export const cancelBill = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason?.trim()) {
    res.status(400);
    throw new Error('A reason is required to cancel a bill');
  }

  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }
  if (bill.status === 'cancelled') {
    res.status(400);
    throw new Error('This bill is already cancelled');
  }

  bill.status = 'cancelled';
  bill.cancelReason = reason.trim();
  bill.cancelledAt = new Date();
  await bill.save();

  res.json({ success: true, data: bill });
});

// ─── Bill format (letterhead, stamp, signature) ─────────────────────────────

// @desc    Get the bill format settings
// @route   GET /api/bills/settings
// @access  Private
export const getBillSettings = asyncHandler(async (req, res) => {
  const settings = await BillSettings.get();
  res.json({ success: true, data: settings });
});

// @desc    Update the bill format text fields
// @route   PATCH /api/bills/settings
// @access  Private (admin)
export const updateBillSettings = asyncHandler(async (req, res) => {
  const settings = await BillSettings.get();

  for (const field of SETTINGS_TEXT_FIELDS) {
    if (req.body[field] !== undefined) settings[field] = String(req.body[field]);
  }
  if (!settings.businessName.trim()) {
    res.status(400);
    throw new Error('Business name is required');
  }

  await settings.save();
  res.json({ success: true, data: settings });
});

// @desc    Upload (or remove) the logo, stamp or signature image
// @route   PUT /api/bills/settings/:kind      (multipart, field "image")
// @route   DELETE /api/bills/settings/:kind
// @access  Private (admin)
export const setBillSettingsImage = asyncHandler(async (req, res) => {
  const { kind } = req.params;
  if (!SETTINGS_IMAGE_FIELDS.includes(kind)) {
    res.status(404);
    throw new Error(`Unknown image type "${kind}"`);
  }

  const settings = await BillSettings.get();

  if (req.method === 'DELETE') {
    settings[kind] = '';
  } else {
    if (!req.file) {
      res.status(400);
      throw new Error('No image uploaded');
    }
    settings[kind] = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  await settings.save();
  res.json({ success: true, data: settings });
});
