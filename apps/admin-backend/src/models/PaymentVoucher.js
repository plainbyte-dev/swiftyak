import mongoose from 'mongoose';

const voucherItemSchema = new mongoose.Schema(
  {
    awb: { type: String, trim: true, default: '' }, // consignment / airway bill number
    from: { type: String, trim: true, default: '' },
    to: { type: String, trim: true, default: '' },
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than 0'],
    },
    unit: { type: String, trim: true, default: '' },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

// A payment voucher: records money Swift Yak paid a partner courier company for
// delivering consignments — the expense side of a customer bill. Like bills,
// vouchers are cancelled rather than deleted so the numbering stays gap-free.
const paymentVoucherSchema = new mongoose.Schema(
  {
    voucherNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    voucherDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    // Payee details as they were when the voucher was issued.
    payee: {
      name: { type: String, required: [true, 'Payee name is required'], trim: true },
      pan: {
        type: String,
        trim: true,
        default: '',
        match: [/^(\d{9})?$/, 'Payee PAN must be 9 digits'],
      },
      address: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    seller: {
      name: { type: String, default: '' },
      shortName: { type: String, default: '' },
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      pan: { type: String, default: '' },
    },
    items: {
      type: [voucherItemSchema],
      validate: [(v) => v.length > 0, 'A voucher needs at least one item'],
    },
    subtotal: { type: Number, required: true }, // service charges — sum of item amounts
    otherCharges: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true }, // net amount paid
    paymentMode: {
      type: String,
      enum: ['cash', 'bank', 'wallet', 'credit'],
      default: 'bank',
    },
    paymentRef: { type: String, trim: true, default: '' }, // cheque / transaction number
    supplierBillNo: { type: String, trim: true, default: '' }, // the courier company's own bill number
    againstBillNo: { type: Number, default: null }, // our customer bill this cost relates to
    remarks: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['issued', 'cancelled'],
      default: 'issued',
    },
    cancelReason: { type: String, trim: true, default: '' },
    cancelledAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

paymentVoucherSchema.index({ voucherDate: -1 });
paymentVoucherSchema.index({ company: 1, voucherNumber: -1 });

export default mongoose.model('PaymentVoucher', paymentVoucherSchema);
