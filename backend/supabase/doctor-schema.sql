-- Doctor Pages Database Schema
-- This schema supports: MySchedule, ShiftSwap, LeaveRequest, and MonthlyStats pages

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS shift_swap_requests CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    building VARCHAR(50),
    floor VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SHIFTS TABLE (for MySchedule page)
-- ============================================
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL, -- 'Morning', 'Afternoon', 'Night'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    department_id UUID REFERENCES departments(id),
    building VARCHAR(50),
    floor VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Pending', -- 'Confirmed', 'Pending', 'Cancelled'
    colleagues_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SHIFT_SWAP_REQUESTS TABLE (for ShiftSwap page)
-- ============================================
CREATE TABLE shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    requester_shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    target_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    target_shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Cancelled'
    requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
    response_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LEAVE_REQUESTS TABLE (for LeaveRequest page)
-- ============================================
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(50) NOT NULL, -- 'Vacation', 'Sick Leave', 'Personal Leave', etc.
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES admins(id),
    approved_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LEAVE_BALANCES TABLE (for LeaveRequest page)
-- ============================================
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL UNIQUE REFERENCES doctors(id) ON DELETE CASCADE,
    total_annual_days INTEGER DEFAULT 20,
    used_days INTEGER DEFAULT 0,
    pending_days INTEGER DEFAULT 0,
    remaining_days INTEGER DEFAULT 20,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_doctor_year UNIQUE(doctor_id, year)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_shifts_doctor_date ON shifts(doctor_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shift_swap_status ON shift_swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requester ON shift_swap_requests(requester_doctor_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_target ON shift_swap_requests(target_doctor_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_doctor ON leave_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_doctor ON leave_balances(doctor_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_swap_requests_updated_at
    BEFORE UPDATE ON shift_swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
    BEFORE UPDATE ON leave_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-UPDATE LEAVE BALANCE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update leave balance when leave request status changes
    IF NEW.status = 'Approved' AND (OLD.status IS NULL OR OLD.status != 'Approved') THEN
        UPDATE leave_balances
        SET used_days = used_days + (NEW.end_date - NEW.start_date + 1),
            pending_days = GREATEST(0, pending_days - (NEW.end_date - NEW.start_date + 1)),
            remaining_days = total_annual_days - used_days - pending_days
        WHERE doctor_id = NEW.doctor_id 
        AND year = EXTRACT(YEAR FROM NEW.start_date);
    ELSIF NEW.status = 'Pending' AND (OLD.status IS NULL OR OLD.status = 'Rejected') THEN
        UPDATE leave_balances
        SET pending_days = pending_days + (NEW.end_date - NEW.start_date + 1),
            remaining_days = total_annual_days - used_days - pending_days
        WHERE doctor_id = NEW.doctor_id 
        AND year = EXTRACT(YEAR FROM NEW.start_date);
    ELSIF NEW.status = 'Rejected' AND OLD.status = 'Pending' THEN
        UPDATE leave_balances
        SET pending_days = GREATEST(0, pending_days - (NEW.end_date - NEW.start_date + 1)),
            remaining_days = total_annual_days - used_days - pending_days
        WHERE doctor_id = NEW.doctor_id 
        AND year = EXTRACT(YEAR FROM NEW.start_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leave_balance
    AFTER INSERT OR UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balance();

-- ============================================
-- SAMPLE DATA FOR DEPARTMENTS
-- ============================================
INSERT INTO departments (name, building, floor) VALUES
    ('Cardiology', 'Building A', 'Floor 3'),
    ('Emergency', 'Building B', 'Ground Floor'),
    ('Pediatrics', 'Building A', 'Floor 2'),
    ('Surgery', 'Building C', 'Floor 4'),
    ('Internal Medicine', 'Building A', 'Floor 5')
ON CONFLICT DO NOTHING;

-- ============================================
-- INITIALIZE LEAVE BALANCE FOR EXISTING DOCTORS
-- ============================================
INSERT INTO leave_balances (doctor_id, total_annual_days, used_days, pending_days, remaining_days, year)
SELECT 
    id,
    20 as total_annual_days,
    5 as used_days,
    2 as pending_days,
    15 as remaining_days,
    EXTRACT(YEAR FROM CURRENT_DATE) as year
FROM doctors
ON CONFLICT (doctor_id, year) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Shifts: Doctors can view their own shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own shifts"
    ON shifts FOR SELECT
    USING (auth.uid()::text = doctor_id::text);

CREATE POLICY "Admins can view all shifts"
    ON shifts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE auth.uid()::text = admins.id::text
        )
    );

-- Shift Swap Requests: Doctors can view requests they're involved in
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own swap requests"
    ON shift_swap_requests FOR SELECT
    USING (
        auth.uid()::text = requester_doctor_id::text OR 
        auth.uid()::text = target_doctor_id::text
    );

CREATE POLICY "Admins can view all swap requests"
    ON shift_swap_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE auth.uid()::text = admins.id::text
        )
    );

-- Leave Requests: Doctors can view their own requests
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own leave requests"
    ON leave_requests FOR SELECT
    USING (auth.uid()::text = doctor_id::text);

CREATE POLICY "Admins can view all leave requests"
    ON leave_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE auth.uid()::text = admins.id::text
        )
    );

-- Leave Balances: Doctors can view their own balance
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own leave balance"
    ON leave_balances FOR SELECT
    USING (auth.uid()::text = doctor_id::text);

CREATE POLICY "Admins can view all leave balances"
    ON leave_balances FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE auth.uid()::text = admins.id::text
        )
    );

-- Departments: Everyone can view
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view departments"
    ON departments FOR SELECT
    TO authenticated
    USING (true);
