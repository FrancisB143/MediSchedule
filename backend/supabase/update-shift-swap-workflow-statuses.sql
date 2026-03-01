-- Update shift swap workflow statuses to support multi-step approvals

ALTER TABLE shift_swap_requests
ALTER COLUMN status TYPE VARCHAR(50);

ALTER TABLE shift_swap_requests
ALTER COLUMN status SET DEFAULT 'Pending Coworker Approval';

-- Normalize old values to new workflow values
UPDATE shift_swap_requests
SET status = 'Pending Coworker Approval'
WHERE status = 'Pending';

UPDATE shift_swap_requests
SET status = 'Rejected by Admin'
WHERE status = 'Rejected';

-- Optional: ensure no unexpected nulls
UPDATE shift_swap_requests
SET status = 'Pending Coworker Approval'
WHERE status IS NULL;
