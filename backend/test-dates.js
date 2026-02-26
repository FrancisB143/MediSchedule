const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;

// OLD WAY (buggy):
const lastDayOld = new Date(year, month, 0).toISOString().split('T')[0];

// NEW WAY (fixed):
const lastDayDate = new Date(year, month, 0); // Last day of current month
const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

console.log('Today:', today.toISOString().split('T')[0]);
console.log('Year:', year);
console.log('Month (1-indexed):', month);
console.log('First day:', firstDay);
console.log('Last day (OLD):', lastDayOld);
console.log('Last day (NEW):', lastDay);
console.log('Expected last day: 2026-02-28');

