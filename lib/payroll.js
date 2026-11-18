// Pure helpers (no DB) - safe to import in both API routes and client pages.

export const STATUS = {
  present:        { label: 'Present',      short: 'P',  monthly: 1,   daily: 1,   color: '#075447' },
  'half-day':     { label: 'Half day',     short: 'HD', monthly: 0.5, daily: 0.5, color: '#C58A08' },
  'paid-leave':   { label: 'Paid leave',   short: 'PL', monthly: 1,   daily: 1,   color: '#3B6EA5' },
  'unpaid-leave': { label: 'Unpaid leave', short: 'UL', monthly: 0,   daily: 0,   color: '#8A7A70' },
  absent:         { label: 'Absent',       short: 'A',  monthly: 0,   daily: 0,   color: '#8F1538' },
  holiday:        { label: 'Holiday',      short: 'H',  monthly: 1,   daily: 0,   color: '#7A5AA6' },
  'weekly-off':   { label: 'Weekly off',   short: 'WO', monthly: 1,   daily: 0,   color: '#A89A90' }
};
export const STATUS_KEYS = Object.keys(STATUS);

export const daysInMonth = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

// Payroll for one employee for one month.
//  monthly: salary / days-in-month x payable days (holiday + weekly-off are paid)
//  daily  : wage x payable days     (holiday + weekly-off are NOT paid)
// Days with no attendance record are counted as `unmarked` and are NOT paid.
export function computePayroll(emp, records, month) {
  const total = daysInMonth(month);
  const count = {};
  let payDays = 0;
  let overtimeHours = 0;
  let marked = 0;
  for (const r of records) {
    const s = STATUS[r.status];
    if (!s) continue;
    marked++;
    count[r.status] = (count[r.status] || 0) + 1;
    payDays += emp.salaryType === 'daily' ? s.daily : s.monthly;
    overtimeHours += Number(r.overtimeHours) || 0;
  }
  const rate = Number(emp.salary) || 0;
  const base = emp.salaryType === 'daily' ? rate * payDays : (rate / total) * payDays;
  const overtime = overtimeHours * (Number(emp.overtimeRate) || 0);
  return {
    totalDays: total,
    marked,
    unmarked: Math.max(0, total - marked),
    count,
    payDays,
    overtimeHours,
    base: Math.round(base),
    overtime: Math.round(overtime),
    gross: Math.round(base + overtime)
  };
}
