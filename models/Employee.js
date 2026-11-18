import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    role: { type: String, default: '' },
    // monthly -> `salary` is the full-month salary; daily -> `salary` is the wage per day
    salaryType: { type: String, enum: ['monthly', 'daily'], default: 'monthly' },
    salary: { type: Number, default: 0, min: 0 },
    // Paid per overtime hour
    overtimeRate: { type: Number, default: 0, min: 0 },
    joinDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
