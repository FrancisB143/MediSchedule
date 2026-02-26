-- Add department column to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Create an index on department for faster queries
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);

-- Update existing doctors with their specialization as default department if not set
UPDATE doctors SET department = specialization WHERE department IS NULL;
