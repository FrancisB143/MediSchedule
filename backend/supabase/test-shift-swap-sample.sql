-- ============================================
-- SHIFT SWAP TEST DATA
-- Run this script to create sample shift swap scenarios for testing
-- ============================================

-- Note: This script assumes you have:
-- 1. Departments table populated
-- 2. At least one doctor in your system
-- 3. Shifts table created

DO $$
DECLARE
    v_current_doctor_id UUID;
    v_colleague1_id UUID;
    v_colleague2_id UUID;
    v_colleague3_id UUID;
    v_cardiology_dept_id UUID;
    v_emergency_dept_id UUID;
    
    -- Shift IDs
    v_current_morning_shift UUID;
    v_current_night_shift UUID;
    v_colleague1_morning_shift UUID;
    v_colleague1_afternoon_shift UUID;
    v_colleague2_morning_shift UUID;
    v_colleague3_afternoon_shift UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO v_cardiology_dept_id FROM departments WHERE name = 'Cardiology' LIMIT 1;
    SELECT id INTO v_emergency_dept_id FROM departments WHERE name = 'Emergency' LIMIT 1;
    
    -- Get current logged in doctor (replace with your actual doctor email)
    SELECT id INTO v_current_doctor_id FROM doctors WHERE email = 'abucio_230000001128@uic.edu.ph' LIMIT 1;
    
    -- If no departments exist, create them
    IF v_cardiology_dept_id IS NULL THEN
        INSERT INTO departments (name, building, floor)
        VALUES ('Cardiology', 'Building A', 'Floor 3')
        RETURNING id INTO v_cardiology_dept_id;
    END IF;
    
    IF v_emergency_dept_id IS NULL THEN
        INSERT INTO departments (name, building, floor)
        VALUES ('Emergency', 'Building B', 'Ground Floor')
        RETURNING id INTO v_emergency_dept_id;
    END IF;
    
    -- Create test colleagues if they don't exist
    -- Colleague 1: Same department as current doctor
    SELECT id INTO v_colleague1_id FROM doctors WHERE email = 'sarah.johnson@hospital.com';
    IF v_colleague1_id IS NULL THEN
        INSERT INTO doctors (email, password_hash, first_name, last_name, specialization)
        VALUES (
            'sarah.johnson@hospital.com',
            '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i', -- password: test123
            'Sarah',
            'Johnson',
            'Cardiology'
        ) RETURNING id INTO v_colleague1_id;
    END IF;
    
    -- Colleague 2: Same department
    SELECT id INTO v_colleague2_id FROM doctors WHERE email = 'michael.chen@hospital.com';
    IF v_colleague2_id IS NULL THEN
        INSERT INTO doctors (email, password_hash, first_name, last_name, specialization)
        VALUES (
            'michael.chen@hospital.com',
            '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i',
            'Michael',
            'Chen',
            'Cardiology'
        ) RETURNING id INTO v_colleague2_id;
    END IF;
    
    -- Colleague 3: Different department
    SELECT id INTO v_colleague3_id FROM doctors WHERE email = 'emily.rodriguez@hospital.com';
    IF v_colleague3_id IS NULL THEN
        INSERT INTO doctors (email, password_hash, first_name, last_name, specialization)
        VALUES (
            'emily.rodriguez@hospital.com',
            '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i',
            'Emily',
            'Rodriguez',
            'Emergency Medicine'
        ) RETURNING id INTO v_colleague3_id;
    END IF;
    
    RAISE NOTICE 'Created/Found test doctors...';
    
    -- ============================================
    -- CREATE SHIFTS FOR NEXT 2 WEEKS
    -- ============================================
    
    -- Current Doctor's Shifts (to be swapped)
    -- Shift 1: Morning shift on Monday (5 days from now)
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status)
    VALUES (
        v_current_doctor_id,
        CURRENT_DATE + INTERVAL '5 days',
        'Morning',
        '07:00:00',
        '15:00:00',
        v_cardiology_dept_id,
        'Building A',
        'Floor 3',
        'Confirmed'
    ) RETURNING id INTO v_current_morning_shift;
    
    -- Shift 2: Night shift on Wednesday (7 days from now)
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status)
    VALUES (
        v_current_doctor_id,
        CURRENT_DATE + INTERVAL '7 days',
        'Night',
        '23:00:00',
        '07:00:00',
        v_cardiology_dept_id,
        'Building A',
        'Floor 3',
        'Confirmed'
    ) RETURNING id INTO v_current_night_shift;
    
    -- Colleague 1's Shifts (same department, available for swap)
    -- Morning shift on same date as current doctor
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status)
    VALUES (
        v_colleague1_id,
        CURRENT_DATE + INTERVAL '5 days',
        'Morning',
        '07:00:00',
        '15:00:00',
        v_cardiology_dept_id,
        'Building A',
        'Floor 3',
        'Confirmed'
    ) RETURNING id INTO v_colleague1_morning_shift;
    
    -- Afternoon shift on different date
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status)
    VALUES (
        v_colleague1_id,
        CURRENT_DATE + INTERVAL '7 days',
        'Afternoon',
        '15:00:00',
        '23:00:00',
        v_cardiology_dept_id,
        'Building A',
        'Floor 3',
        'Confirmed'
    ) RETURNING id INTO v_colleague1_afternoon_shift;
    
    -- Colleague 2's Shift (same department, same date)
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status)
    VALUES (
        v_colleague2_id,
        CURRENT_DATE + INTERVAL '5 days',
        'Morning',
        '07:00:00',
        '15:00:00',
        v_cardiology_dept_id,
        'Building A',
        'Floor 3',
        'Confirmed'
    ) RETURNING id INTO v_colleague2_morning_shift;
    
    -- Colleague 3's Shift (different department - should not be swappable)
    INSERT INTO shifts (doctor_id, shift_date, shift_type, start_time, end_time, department_id, building, floor, status)
    VALUES (
        v_colleague3_id,
        CURRENT_DATE + INTERVAL '5 days',
        'Afternoon',
        '15:00:00',
        '23:00:00',
        v_emergency_dept_id,
        'Building B',
        'Ground Floor',
        'Confirmed'
    ) RETURNING id INTO v_colleague3_afternoon_shift;
    
    RAISE NOTICE 'Created test shifts...';
    
    -- ============================================
    -- CREATE SHIFT SWAP REQUESTS
    -- ============================================
    
    -- Swap Request 1: Pending Coworker Approval
    -- Current doctor wants to swap Monday morning with Colleague 1's Wednesday afternoon
    INSERT INTO shift_swap_requests (
        requester_doctor_id,
        requester_shift_id,
        target_doctor_id,
        target_shift_id,
        status,
        requested_date,
        notes
    ) VALUES (
        v_current_doctor_id,
        v_current_morning_shift,
        v_colleague1_id,
        v_colleague1_afternoon_shift,
        'Pending Coworker Approval',
        CURRENT_DATE,
        'Family appointment on Monday morning'
    );
    
    -- Swap Request 2: Pending Admin Approval
    -- (This means colleague already approved, now waiting for admin)
    INSERT INTO shift_swap_requests (
        requester_doctor_id,
        requester_shift_id,
        target_doctor_id,
        target_shift_id,
        status,
        requested_date,
        response_date,
        notes
    ) VALUES (
        v_current_doctor_id,
        v_current_night_shift,
        v_colleague2_id,
        v_colleague2_morning_shift,
        'Pending Admin Approval',
        CURRENT_DATE - INTERVAL '2 days',
        CURRENT_DATE - INTERVAL '1 day',
        'Prefer day shifts this week'
    );
    
    -- You can also create additional swap requests with other statuses:
    -- 'Declined by Coworker'
    -- 'Approved'
    -- 'Rejected by Admin'
    -- 'Cancelled'
    
    RAISE NOTICE 'Created shift swap requests successfully!';
    RAISE NOTICE '------------------------------------';
    RAISE NOTICE 'Test data created:';
    RAISE NOTICE '- Current Doctor: %', v_current_doctor_id;
    RAISE NOTICE '- 3 Colleague Doctors created';
    RAISE NOTICE '- 6 Shifts created for next 2 weeks';
    RAISE NOTICE '- 2 Shift swap requests created';
    RAISE NOTICE '------------------------------------';
    RAISE NOTICE 'You can now test the Shift Swap feature!';
    
END $$;

-- ============================================
-- VERIFY THE DATA
-- ============================================

-- View all shifts created
SELECT 
    s.id,
    d.first_name || ' ' || d.last_name as doctor_name,
    s.shift_date,
    s.shift_type,
    s.start_time,
    s.end_time,
    dept.name as department,
    s.status
FROM shifts s
JOIN doctors d ON s.doctor_id = d.id
LEFT JOIN departments dept ON s.department_id = dept.id
WHERE s.shift_date >= CURRENT_DATE
ORDER BY s.shift_date, s.start_time;

-- View all swap requests
SELECT 
    sr.id,
    req_doc.first_name || ' ' || req_doc.last_name as requester,
    tar_doc.first_name || ' ' || tar_doc.last_name as target,
    sr.status,
    sr.requested_date,
    sr.notes
FROM shift_swap_requests sr
JOIN doctors req_doc ON sr.requester_doctor_id = req_doc.id
JOIN doctors tar_doc ON sr.target_doctor_id = tar_doc.id
ORDER BY sr.requested_date DESC;
