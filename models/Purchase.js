import mongoose from 'mongoose';

const PurchaseItemSchema = new mongoose.Schema(
  {
    // Optional link to a catalogue product. Leave empty for raw material / packaging / other items.
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    variantId: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: '' },
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    // true when this line's qty was added to product stock (so delete can reverse it)
    stockAdded: { type: Boolean, default: false }
  },
  { _id: false }
);

const PurchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: { type: String, required: true, unique: true },
    supplier: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, default: '' },
      gstin: { type: String, default: '' }
    },
    billNumber: { type: String, default: '' }, // supplier's own bill / invoice number
    date: { type: Date, required: true },
    items: { type: [PurchaseItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'paid' },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'bank', 'card', 'credit', 'other'], default: 'cash' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

PurchaseSchema.index({ date: -1 });
PurchaseSchema.index({ 'supplier.name': 1 });

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
