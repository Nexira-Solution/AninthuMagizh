import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD' (IST calendar day)
    status: {
      type: String,
      enum: ['present', 'half-day', 'paid-leave', 'unpaid-leave', 'absent', 'holiday', 'weekly-off'],
      default: 'present'
    },
    checkIn: { type: String, default: '' }, // 'HH:mm'
    checkOut: { type: String, default: '' },
    overtimeHours: { type: Number, default: 0, min: 0 },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
