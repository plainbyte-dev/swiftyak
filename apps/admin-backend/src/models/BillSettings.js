import mongoose from 'mongoose';

// Singleton document holding the letterhead, stamp and signature printed on PAN bills.
// Images are stored as data URLs so the signature is never exposed on a public URL.
const billSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'default' },
    businessName: { type: String, trim: true, default: 'Swift Yak Private Limited' },
    // Short form used on the stamp and in "For … / Authorised Signatory".
    shortName: { type: String, trim: true, default: 'Swift Yak Pvt. Ltd.' },
    address: { type: String, trim: true, default: 'Balaju, Kathmandu, Nepal' },
    phone: { type: String, trim: true, default: '+977 9867887967' },
    email: { type: String, trim: true, default: 'info@swiftyak.com.np' },
    website: { type: String, trim: true, default: 'swiftyak.com.np' },
    pan: { type: String, trim: true, default: '623669109' },
    signatoryName: { type: String, trim: true, default: '' },
    signatoryTitle: { type: String, trim: true, default: 'Authorised Signatory' },
    footerNote: { type: String, trim: true, default: 'Thank you for shipping with Swift Yak' },
    // Small print bottom-left, e.g. printing-press details for pre-printed bill books.
    printerNote: { type: String, trim: true, default: '' },
    logo: { type: String, default: '' },
    stamp: { type: String, default: '' },
    signature: { type: String, default: '' },
  },
  { timestamps: true }
);

billSettingsSchema.statics.get = async function get() {
  return (await this.findById('default')) || this.create({ _id: 'default' });
};

export default mongoose.model('BillSettings', billSettingsSchema);
