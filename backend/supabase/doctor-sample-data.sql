-- Sample Data for Doctor Pages
-- Run this AFTER executing doctor-schema.sql

-- ============================================
-- SAMPLE SHIFTS DATA (for MySchedule page)
-- ============================================

-- Get the doctor ID (replace email with actual doctor email)
DO $$
DECLARE
    v_doctor_id UUID;
    v_cardiology_id UUID;
    v_emergency_id UUID;
BEGIN
    -- Get doctor ID
    SELECT id INTO v_doctor_id FROM doctors WHERE email = 'abucio_230000001128@uic.edu.ph';
    
    -- Get department IDs
    SELECT id INTO v_cardiology_id FROM departments WHERE name = 'Cardiology';
    SELECT id INTO v_emergency_id FROM departments WHERE name = 'Emergency';
    
    -- Insert sample shifts for the current week
    -- Wednesday Morning Shift
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status, colleagues_count)
    VALUES (
        v_doctor_id,
        CURRENT_DATE + INTERVAL '1 day', -- Wednesday
        'Morning',
        '07:00:00',
        '15:00:00',
        v_cardiology_id,
        'Building A',
        'Floor 3',
        'Confirmed',
        3
    );
    
    -- Thursday Afternoon Shift
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status, colleagues_count)
    VALUES (
        v_doctor_id,
        CURRENT_DATE + INTERVAL '2 days', -- Thursday
        'Afternoon',
        '15:00:00',
        '23:00:00',
        v_cardiology_id,
        'Building A',
        'Floor 3',
        'Confirmed',
        2
    );
    
    -- Friday Morning Shift
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status, colleagues_count)
    VALUES (
        v_doctor_id,
        CURRENT_DATE + INTERVAL '3 days', -- Friday
        'Morning',
        '07:00:00',
        '15:00:00',
        v_emergency_id,
        'Building B',
        'Ground Floor',
        'Pending',
        4
    );
    
    -- Saturday Morning Shift (for shift swap)
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status, colleagues_count)
    VALUES (
        v_doctor_id,
        CURRENT_DATE + INTERVAL '4 days', -- Saturday
        'Morning',
        '07:00:00',
        '15:00:00',
        v_cardiology_id,
        'Building A',
        'Floor 3',
        'Confirmed',
        2
    );
    
    -- Sunday Afternoon Shift (for shift swap)
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status, colleagues_count)
    VALUES (
        v_doctor_id,
        CURRENT_DATE + INTERVAL '5 days', -- Sunday
        'Afternoon',
        '15:00:00',
        '23:00:00',
        v_emergency_id,
        'Building B',
        'Ground Floor',
        'Confirmed',
        3
    );
    
    -- Monday Night Shift (for shift swap)
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status, colleagues_count)
    VALUES (
        v_doctor_id,
        CURRENT_DATE + INTERVAL '6 days', -- Monday
        'Night',
        '23:00:00',
        '07:00:00',
        v_cardiology_id,
        'Building A',
        'Floor 3',
        'Confirmed',
        2
    );
END $$;

-- ============================================
-- SAMPLE SHIFT SWAP REQUEST (for ShiftSwap page)
-- ============================================

DO $$
DECLARE
    v_requester_id UUID;
    v_target_id UUID;
    v_requester_shift UUID;
    v_target_shift UUID;
BEGIN
    -- Get requester doctor (current user)
    SELECT id INTO v_requester_id FROM doctors WHERE email = 'abucio_230000001128@uic.edu.ph';
    
    -- Get target doctor (Dr. Michael Wong - you may need to create this doctor first)
    SELECT id INTO v_target_id FROM doctors WHERE first_name = 'Michael' AND last_name = 'Wong';
    
    -- If Dr. Michael Wong doesn't exist, create him
    IF v_target_id IS NULL THEN
        INSERT INTO doctors (email, password_hash, first_name, last_name, specialization)
        VALUES (
            'mwong@hospital.com',
            '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i',
            'Michael',
            'Wong',
            'Cardiology'
        ) RETURNING id INTO v_target_id;
    END IF;
    
    -- Get the Saturday shift (requester's shift)
    SELECT id INTO v_requester_shift FROM shifts 
    WHERE doctor_id = v_requester_id 
    AND shift_date = CURRENT_DATE + INTERVAL '4 days'
    LIMIT 1;
    
    -- Create a shift for the target doctor (Monday Afternoon)
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status)
    SELECT 
        v_target_id,
        CURRENT_DATE + INTERVAL '6 days',
        'Afternoon',
        '15:00:00',
        '23:00:00',
        id,
        'Building A',
        'Floor 3',
        'Confirmed'
    FROM departments WHERE name = 'Cardiology'
    RETURNING id INTO v_target_shift;
    
    -- Create swap request
    INSERT INTO shift_swap_requests (
        requester_doctor_id,
        requester_shift_id,
        target_doctor_id,
        target_shift_id,
        status,
        requested_date
    ) VALUES (
        v_requester_id,
        v_requester_shift,
        v_target_id,
        v_target_shift,
        'Pending',
        CURRENT_DATE - INTERVAL '5 days' -- Requested 5 days ago
    );
END $$;

-- ============================================
-- SAMPLE LEAVE REQUESTS (for LeaveRequest page)
-- ============================================

DO $$
DECLARE
    v_doctor_id UUID;
    v_admin_id UUID;
BEGIN
    -- Get doctor ID
    SELECT id INTO v_doctor_id FROM doctors WHERE email = 'abucio_230000001128@uic.edu.ph';
    
    -- Get admin ID for approvals
    SELECT id INTO v_admin_id FROM admins LIMIT 1;
    
    -- Approved Personal Leave
    INSERT INTO leave_requests (
        doctor_id,
        start_date,
        end_date,
        leave_type,
        reason,
        status,
        submitted_date,
        approved_by,
        approved_date
    ) VALUES (
        v_doctor_id,
        '2024-06-20',
        '2024-06-22',
        'Personal Leave',
        'Family emergency',
        'Approved',
        '2024-06-10',
        v_admin_id,
        '2024-06-11'
    );
    
    -- Approved Vacation
    INSERT INTO leave_requests (
        doctor_id,
        start_date,
        end_date,
        leave_type,
        reason,
        status,
        submitted_date,
        approved_by,
        approved_date
    ) VALUES (
        v_doctor_id,
        '2024-05-15',
        '2024-05-17',
        'Vacation',
        'Pre-planned vacation',
        'Approved',
        '2024-05-01',
        v_admin_id,
        '2024-05-02'
    );
    
    -- Rejected Sick Leave
    INSERT INTO leave_requests (
        doctor_id,
        start_date,
        end_date,
        leave_type,
        reason,
        status,
        submitted_date,
        approved_by,
        approved_date,
        rejection_reason
    ) VALUES (
        v_doctor_id,
        '2024-04-10',
        '2024-04-11',
        'Sick Leave',
        'Medical appointment',
        'Rejected',
        '2024-04-08',
        v_admin_id,
        '2024-04-09',
        'Insufficient coverage available'
    );
    
    -- Pending Leave Request
    INSERT INTO leave_requests (
        doctor_id,
        start_date,
        end_date,
        leave_type,
        reason,
        status,
        submitted_date
    ) VALUES (
        v_doctor_id,
        CURRENT_DATE + INTERVAL '14 days',
        CURRENT_DATE + INTERVAL '16 days',
        'Vacation',
        'Personal time off',
        'Pending',
        CURRENT_DATE
    );
END $$;

-- ============================================
-- VERIFY DATA
-- ============================================

-- Count shifts per doctor
SELECT 
    d.first_name,
    d.last_name,
    COUNT(s.id) as total_shifts,
    SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/3600) as total_hours
FROM doctors d
LEFT JOIN shifts s ON d.id = s.doctor_id
GROUP BY d.id, d.first_name, d.last_name;

-- View shift swap requests
SELECT 
    concat(d1.first_name, ' ', d1.last_name) as requester,
    concat(d2.first_name, ' ', d2.last_name) as target,
    ssr.status,
    ssr.requested_date
FROM shift_swap_requests ssr
JOIN doctors d1 ON ssr.requester_doctor_id = d1.id
JOIN doctors d2 ON ssr.target_doctor_id = d2.id;

-- View leave requests summary
SELECT 
    d.first_name,
    d.last_name,
    lr.leave_type,
    lr.start_date,
    lr.end_date,
    lr.status
FROM leave_requests lr
JOIN doctors d ON lr.doctor_id = d.id
ORDER BY lr.submitted_date DESC;

-- View leave balances
SELECT 
    d.first_name,
    d.last_name,
    lb.total_annual_days,
    lb.used_days,
    lb.pending_days,
    lb.remaining_days
FROM leave_balances lb
JOIN doctors d ON lb.doctor_id = d.id;
