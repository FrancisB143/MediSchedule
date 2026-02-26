-- Cleanup script to remove old test shifts with incorrect dates
-- Run this in Supabase SQL Editor if you have test shifts you want to remove

-- Delete all shifts for January and February 2026 (cleanup for fresh start)
DELETE FROM shifts 
WHERE shift_date >= '2026-01-01' 
  AND shift_date <= '2026-02-29'
  AND status = 'Confirmed';

-- To see what would be deleted first, uncomment and run this query:
-- SELECT * FROM shifts 
-- WHERE shift_date >= '2026-01-01' 
--   AND shift_date <= '2026-02-29'
--   AND status = 'Confirmed';
