-- Sample data for testing MySchedule page
-- Run this after executing doctor-schema.sql

-- Insert sample departments
INSERT INTO departments (name, building, floor) VALUES
  ('Cardiology', 'Building A', 'Floor 3'),
  ('Emergency', 'Building B', 'Ground Floor'),
  ('Pediatrics', 'Building A', 'Floor 2');

-- Insert additional sample doctors (colleagues)
INSERT INTO doctors (email, password_hash, first_name, last_name, specialization, phone) VALUES
  ('colleague1@uic.edu.ph', '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i', 'Sarah', 'Johnson', 'Cardiology', '555-0201'),
  ('colleague2@uic.edu.ph', '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i', 'Michael', 'Chen', 'Emergency Medicine', '555-0202'),
  ('colleague3@uic.edu.ph', '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i', 'Emily', 'Rodriguez', 'Pediatrics', '555-0203'),
  ('colleague4@uic.edu.ph', '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i', 'David', 'Kim', 'Cardiology', '555-0204');

-- Insert sample shifts for the current week
-- This script automatically gets the doctor IDs and creates realistic colleague relationships
DO $$
DECLARE 
    doctor_uuid UUID;
    colleague1_uuid UUID;
    colleague2_uuid UUID;
    colleague3_uuid UUID;
    colleague4_uuid UUID;
    cardiology_dept UUID;
    emergency_dept UUID;
    pediatrics_dept UUID;
    today DATE := CURRENT_DATE;
    week_start DATE;
BEGIN
    -- Get doctor IDs
    SELECT id INTO doctor_uuid FROM doctors WHERE email = 'abucio_230000001128@uic.edu.ph';
    SELECT id INTO colleague1_uuid FROM doctors WHERE email = 'colleague1@uic.edu.ph';
    SELECT id INTO colleague2_uuid FROM doctors WHERE email = 'colleague2@uic.edu.ph';
    SELECT id INTO colleague3_uuid FROM doctors WHERE email = 'colleague3@uic.edu.ph';
    SELECT id INTO colleague4_uuid FROM doctors WHERE email = 'colleague4@uic.edu.ph';
    
    IF doctor_uuid IS NULL THEN
        RAISE EXCEPTION 'Main doctor not found. Please run schema.sql first.';
    END IF;

    -- Get department IDs
    SELECT id INTO cardiology_dept FROM departments WHERE name = 'Cardiology';
    SELECT id INTO emergency_dept FROM departments WHERE name = 'Emergency';
    SELECT id INTO pediatrics_dept FROM departments WHERE name = 'Pediatrics';

    -- Calculate start of current week (Monday)
    week_start := today - (EXTRACT(DOW FROM today)::INTEGER - 1);

    -- Insert shifts for main doctor (John Smith)
    INSERT INTO shifts (doctor_id, department_id, shift_date, shift_type, start_time, end_time, status) VALUES
        -- Monday - Morning Shift in Cardiology
        (doctor_uuid, cardiology_dept, week_start, 'Morning Shift', '07:00:00', '15:00:00', 'confirmed'),
        
        -- Tuesday - Afternoon Shift in Emergency
        (doctor_uuid, emergency_dept, week_start + 1, 'Afternoon Shift', '15:00:00', '23:00:00', 'confirmed'),
        
        -- Wednesday - Morning Shift in Cardiology
        (doctor_uuid, cardiology_dept, week_start + 2, 'Morning Shift', '07:00:00', '15:00:00', 'confirmed'),
        
        -- Thursday - Night Shift in Emergency
        (doctor_uuid, emergency_dept, week_start + 3, 'Night Shift', '23:00:00', '07:00:00', 'confirmed'),
        
        -- Friday - Morning Shift in Pediatrics
        (doctor_uuid, pediatrics_dept, week_start + 4, 'Morning Shift', '07:00:00', '15:00:00', 'pending'),
        
        -- Saturday - Afternoon Shift in Cardiology
        (doctor_uuid, cardiology_dept, week_start + 5, 'Afternoon Shift', '15:00:00', '23:00:00', 'confirmed'),
        
        -- Next week - Monday
        (doctor_uuid, emergency_dept, week_start + 7, 'Morning Shift', '07:00:00', '15:00:00', 'pending');

    -- Insert shifts for colleagues (to make colleague counting work)
    -- Colleague 1 (Sarah) - Cardiology specialist, works same days in Cardiology
    INSERT INTO shifts (doctor_id, department_id, shift_date, shift_type, start_time, end_time, status) VALUES
        (colleague1_uuid, cardiology_dept, week_start, 'Morning Shift', '07:00:00', '15:00:00', 'confirmed'),
        (colleague1_uuid, cardiology_dept, week_start + 2, 'Morning Shift', '07:00:00', '15:00:00', 'confirmed'),
        (colleague1_uuid, cardiology_dept, week_start + 5, 'Afternoon Shift', '15:00:00', '23:00:00', 'confirmed');

    -- Colleague 2 (Michael) - Emergency specialist
    INSERT INTO shifts (doctor_id, department_id, shift_date, shift_type, start_time, end_time, status) VALUES
        (colleague2_uuid, emergency_dept, week_start + 1, 'Afternoon Shift', '15:00:00', '23:00:00', 'confirmed'),
        (colleague2_uuid, emergency_dept, week_start + 3, 'Night Shift', '23:00:00', '07:00:00', 'confirmed'),
        (colleague2_uuid, emergency_dept, week_start + 7, 'Morning Shift', '07:00:00', '15:00:00', 'confirmed');

    -- Colleague 3 (Emily) - Pediatrics specialist
    INSERT INTO shifts (doctor_id, department_id, shift_date, shift_type, start_time, end_time, status) VALUES
        (colleague3_uuid, pediatrics_dept, week_start + 4, 'Morning Shift', '07:00:00', '15:00:00', 'confirmed'),
        (colleague3_uuid, pediatrics_dept, week_start + 4, 'Afternoon Shift', '15:00:00', '23:00:00', 'confirmed');

    -- Colleague 4 (David) - Another Cardiology doctor
    INSERT INTO shifts (doctor_id, department_id, shift_date, shift_type, start_time, end_time, status) VALUES
        (colleague4_uuid, cardiology_dept, week_start, 'Morning Shift', '07:00:00', '15:00:00', 'confirmed'),
        (colleague4_uuid, cardiology_dept, week_start + 2, 'Morning Shift', '07:00:00', '15:00:00', 'confirmed');

    RAISE NOTICE 'Sample shifts created successfully for main doctor and colleagues';
END $$;

-- Verify the data - Show main doctor's shifts with colleague counts
SELECT 
    s.shift_date,
    s.shift_type,
    s.start_time,
    s.end_time,
    d.name as department,
    d.building,
    d.floor,
    s.status,
    (
        SELECT COUNT(DISTINCT s2.doctor_id)
        FROM shifts s2
        WHERE s2.shift_date = s.shift_date
        AND s2.shift_type = s.shift_type
        AND s2.department_id = s.department_id
        AND s2.doctor_id != s.doctor_id
    ) as colleagues_count
FROM shifts s
JOIN departments d ON s.department_id = d.id
JOIN doctors doc ON s.doctor_id = doc.id
WHERE doc.email = 'abucio_230000001128@uic.edu.ph'
ORDER BY s.shift_date, s.start_time;
