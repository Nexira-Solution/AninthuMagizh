import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'Other', trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'bank', 'card', 'other'], default: 'cash' },
    vendor: { type: String, default: '' },
    notes: { type: String, default: '' },
    // Set when the expense is a salary / advance paid to an employee
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    payrollMonth: { type: String, default: '' } // 'YYYY-MM' the payment is for
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1, date: -1 });
ExpenseSchema.index({ employee: 1, payrollMonth: 1 });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
