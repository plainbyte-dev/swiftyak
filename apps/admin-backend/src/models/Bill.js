import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema(
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
    unit: {
      type: String,
      trim: true,
      default: '',
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// A PAN bill: tax invoice issued by a PAN-registered (non-VAT) business.
// Bills are never deleted — they are cancelled, so the numbering stays gap-free.
const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    billDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    seller: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      pan: { type: String, default: '' },
      shortName: { type: String, default: '' },
    },
    customer: {
      name: { type: String, required: [true, 'Customer name is required'], trim: true },
      pan: {
        type: String,
        trim: true,
        default: '',
        match: [/^(\d{9})?$/, 'Customer PAN must be 9 digits'],
      },
      address: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    items: {
      type: [billItemSchema],
      validate: [(v) => v.length > 0, 'A bill needs at least one item'],
    },
    subtotal: { type: Number, required: true }, // "Delivery charges" — sum of item amounts
    codCharge: { type: Number, default: 0, min: 0 },
    otherCharges: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true }, // net amount payable
    paymentMode: {
      type: String,
      enum: ['cash', 'bank', 'wallet', 'credit'],
      default: 'cash',
    },
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

billSchema.index({ billDate: -1 });
billSchema.index({ 'customer.name': 1 });

export default mongoose.model('Bill', billSchema);
