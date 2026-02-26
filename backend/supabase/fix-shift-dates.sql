-- Fix the dates of test shifts from January 31 to February 1, 2026
-- This corrects the timezone bug that caused shifts to be saved with wrong dates

-- Step 1: See what shifts we currently have
SELECT 
  shift_date,
  shift_type,
  d.first_name || ' ' || d.last_name as doctor_name,
  status
FROM shifts s
JOIN doctors d ON s.doctor_id = d.id
WHERE shift_date BETWEEN '2026-01-01' AND '2026-02-28'
ORDER BY shift_date, shift_type;

-- Step 2: Update the dates from January 31 to February 1
-- IMPORTANT: Run this to fix your existing test shifts
UPDATE shifts
SET shift_date = '2026-02-01'
WHERE shift_date = '2026-01-31'
  AND status = 'Confirmed';

-- Step 3: Verify the update worked
SELECT 
  shift_date,
  shift_type,
  d.first_name || ' ' || d.last_name as doctor_name,
  status
FROM shifts s
JOIN doctors d ON s.doctor_id = d.id
WHERE shift_date = '2026-02-01'
  AND status = 'Confirmed'
ORDER BY shift_type, doctor_name;

-- Alternative: If you want to delete old shifts and start fresh instead
-- Uncomment the line below to delete all January-February 2026 shifts
-- DELETE FROM shifts WHERE shift_date >= '2026-01-01' AND shift_date <= '2026-02-29' AND status = 'Confirmed';

