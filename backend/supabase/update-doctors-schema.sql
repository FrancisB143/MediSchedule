-- Add department_id and status fields to doctors table
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Available';

-- Update existing doctors to have a default status
UPDATE doctors SET status = 'Available' WHERE status IS NULL;

-- Create index for department_id
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);