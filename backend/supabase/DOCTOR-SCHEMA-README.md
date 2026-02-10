# Doctor Pages Database Schema Documentation

## Overview
This database schema supports all doctor-facing features in the DocTime application:
- **MySchedule**: View and manage shift schedules
- **ShiftSwap**: Request shift swaps with colleagues
- **LeaveRequest**: Submit and track leave requests
- **MonthlyStats**: View statistics and analytics

## Tables

### 1. departments
Stores hospital department information.

**Columns:**
- `id` (UUID, PK): Unique department identifier
- `name` (VARCHAR): Department name (e.g., "Cardiology", "Emergency")
- `building` (VARCHAR): Building location
- `floor` (VARCHAR): Floor location
- `created_at` (TIMESTAMP): Record creation time

**Used In:** MySchedule page for shift assignments

---

### 2. shifts
Stores all doctor shift assignments.

**Columns:**
- `id` (UUID, PK): Unique shift identifier
- `doctor_id` (UUID, FK): Reference to doctors table
- `shift_date` (DATE): Date of the shift
- `shift_type` (VARCHAR): "Morning", "Afternoon", or "Night"
- `start_time` (TIME): Shift start time (e.g., 07:00:00)
- `end_time` (TIME): Shift end time (e.g., 15:00:00)
- `department_id` (UUID, FK): Reference to departments table
- `building` (VARCHAR): Building location
- `floor` (VARCHAR): Floor location
- `status` (VARCHAR): "Confirmed", "Pending", or "Cancelled"
- `colleagues_count` (INTEGER): Number of colleagues on the same shift
- `notes` (TEXT): Additional notes
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Last update time

**Used In:** 
- MySchedule page: Display upcoming shifts
- ShiftSwap page: Show available shifts for swapping
- MonthlyStats page: Calculate statistics

---

### 3. shift_swap_requests
Tracks shift swap requests between doctors.

**Columns:**
- `id` (UUID, PK): Unique request identifier
- `requester_doctor_id` (UUID, FK): Doctor requesting the swap
- `requester_shift_id` (UUID, FK): Shift the requester wants to swap
- `target_doctor_id` (UUID, FK): Doctor being asked to swap
- `target_shift_id` (UUID, FK): Shift the requester wants to receive
- `status` (VARCHAR): "Pending", "Approved", "Rejected", or "Cancelled"
- `requested_date` (DATE): Date the request was made
- `response_date` (DATE): Date of response (if any)
- `notes` (TEXT): Additional notes or reasons
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Last update time

**Used In:** ShiftSwap page to display and manage swap requests

---

### 4. leave_requests
Stores doctor leave/time-off requests.

**Columns:**
- `id` (UUID, PK): Unique request identifier
- `doctor_id` (UUID, FK): Doctor requesting leave
- `start_date` (DATE): Leave start date
- `end_date` (DATE): Leave end date
- `leave_type` (VARCHAR): "Vacation", "Sick Leave", "Personal Leave", etc.
- `reason` (TEXT): Detailed reason for leave
- `status` (VARCHAR): "Pending", "Approved", or "Rejected"
- `submitted_date` (TIMESTAMP): When request was submitted
- `approved_by` (UUID, FK): Admin who approved/rejected (nullable)
- `approved_date` (TIMESTAMP): When decision was made (nullable)
- `rejection_reason` (TEXT): Reason for rejection (nullable)
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Last update time

**Used In:** LeaveRequest page to submit and track leave requests

---

### 5. leave_balances
Tracks each doctor's leave balance for the year.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `doctor_id` (UUID, FK): Reference to doctor (unique per year)
- `total_annual_days` (INTEGER): Total annual leave days (default: 20)
- `used_days` (INTEGER): Days already used
- `pending_days` (INTEGER): Days in pending requests
- `remaining_days` (INTEGER): Days still available
- `year` (INTEGER): Year for this balance
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Last update time

**Constraint:** Unique combination of (doctor_id, year)

**Used In:** LeaveRequest page to display available leave days

**Auto-Updates:** Automatically recalculates when leave requests are approved/rejected

---

## Setup Instructions

### 1. Execute Main Schema
Run in Supabase SQL Editor:
```sql
-- First, make sure you have the base schema (doctors and admins tables)
-- Then execute:
```
Copy and execute: `backend/supabase/doctor-schema.sql`

### 2. Load Sample Data (Optional)
To test with sample data:
```sql
-- Execute sample data
```
Copy and execute: `backend/supabase/doctor-sample-data.sql`

---

## Automatic Features

### 1. Leave Balance Auto-Update
When a leave request status changes, the `leave_balances` table automatically updates:

- **Pending → Approved**: Moves days from `pending_days` to `used_days`
- **New Pending**: Adds days to `pending_days`
- **Pending → Rejected**: Removes days from `pending_days`
- **Calculates**: `remaining_days` = `total_annual_days` - `used_days` - `pending_days`

### 2. Timestamp Management
All tables with `updated_at` automatically update the timestamp on any record change.

---

## Security (Row Level Security)

### Doctors Can:
- ✅ View their own shifts
- ✅ View shift swap requests they're involved in (requester or target)
- ✅ View their own leave requests
- ✅ View their own leave balance
- ✅ View all departments

### Admins Can:
- ✅ View all shifts
- ✅ View all shift swap requests
- ✅ View all leave requests
- ✅ View all leave balances
- ✅ View all departments

---

## Data Calculations for MonthlyStats Page

### Total Hours This Week
```sql
SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as total_hours
FROM shifts
WHERE doctor_id = $doctor_id
AND shift_date >= date_trunc('week', CURRENT_DATE)
AND shift_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days';
```

### Total Shifts This Month
```sql
SELECT COUNT(*) as total_shifts
FROM shifts
WHERE doctor_id = $doctor_id
AND shift_date >= date_trunc('month', CURRENT_DATE)
AND shift_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
```

### Shift Type Distribution
```sql
SELECT 
    shift_type,
    COUNT(*) as count
FROM shifts
WHERE doctor_id = $doctor_id
AND shift_date >= date_trunc('month', CURRENT_DATE)
GROUP BY shift_type;
```

### Weekly Hours Breakdown
```sql
SELECT 
    EXTRACT(WEEK FROM shift_date) as week_number,
    SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as hours
FROM shifts
WHERE doctor_id = $doctor_id
AND shift_date >= date_trunc('month', CURRENT_DATE)
GROUP BY week_number
ORDER BY week_number;
```

### Attendance Rate
```sql
SELECT 
    COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) * 100.0 / COUNT(*) as attendance_percentage
FROM shifts
WHERE doctor_id = $doctor_id
AND shift_date >= date_trunc('month', CURRENT_DATE)
AND shift_date <= CURRENT_DATE;
```

---

## Example Queries

### Get Doctor's Upcoming Shifts
```sql
SELECT 
    s.*,
    d.name as department_name
FROM shifts s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.doctor_id = 'doctor-uuid-here'
AND s.shift_date >= CURRENT_DATE
ORDER BY s.shift_date, s.start_time;
```

### Get Pending Shift Swap Requests
```sql
SELECT 
    ssr.*,
    concat(d1.first_name, ' ', d1.last_name) as requester_name,
    concat(d2.first_name, ' ', d2.last_name) as target_name,
    s1.shift_date as requester_shift_date,
    s1.shift_type as requester_shift_type,
    s2.shift_date as target_shift_date,
    s2.shift_type as target_shift_type
FROM shift_swap_requests ssr
JOIN doctors d1 ON ssr.requester_doctor_id = d1.id
JOIN doctors d2 ON ssr.target_doctor_id = d2.id
JOIN shifts s1 ON ssr.requester_shift_id = s1.id
JOIN shifts s2 ON ssr.target_shift_id = s2.id
WHERE ssr.status = 'Pending'
AND (ssr.requester_doctor_id = 'doctor-uuid-here' OR ssr.target_doctor_id = 'doctor-uuid-here');
```

### Get Leave Request History
```sql
SELECT 
    lr.*,
    concat(a.first_name, ' ', a.last_name) as approved_by_name
FROM leave_requests lr
LEFT JOIN admins a ON lr.approved_by = a.id
WHERE lr.doctor_id = 'doctor-uuid-here'
ORDER BY lr.submitted_date DESC;
```

### Get Leave Balance for Current Year
```sql
SELECT *
FROM leave_balances
WHERE doctor_id = 'doctor-uuid-here'
AND year = EXTRACT(YEAR FROM CURRENT_DATE);
```

---

## Database Relationships

```
doctors (from base schema)
  ├── shifts (one-to-many)
  ├── shift_swap_requests (one-to-many as requester)
  ├── shift_swap_requests (one-to-many as target)
  ├── leave_requests (one-to-many)
  └── leave_balances (one-to-one per year)

departments
  └── shifts (one-to-many)

admins (from base schema)
  └── leave_requests (one-to-many for approvals)

shifts
  ├── shift_swap_requests (one-to-many as requester_shift)
  └── shift_swap_requests (one-to-many as target_shift)
```

---

## Maintenance

### Add Leave Balance for New Year
```sql
INSERT INTO leave_balances (doctor_id, total_annual_days, used_days, pending_days, remaining_days, year)
SELECT 
    id,
    20,
    0,
    0,
    20,
    EXTRACT(YEAR FROM CURRENT_DATE)
FROM doctors
ON CONFLICT (doctor_id, year) DO NOTHING;
```

### Clean Up Old Shifts (keep last 2 years)
```sql
DELETE FROM shifts
WHERE shift_date < CURRENT_DATE - INTERVAL '2 years';
```

### Archive Old Leave Requests (keep last 3 years)
```sql
-- Consider moving to archive table instead of deleting
DELETE FROM leave_requests
WHERE submitted_date < CURRENT_DATE - INTERVAL '3 years';
```

---

## Status Values Reference

### shifts.status
- `Confirmed`: Shift is confirmed and scheduled
- `Pending`: Shift is tentative, awaiting confirmation
- `Cancelled`: Shift was cancelled

### shift_swap_requests.status
- `Pending`: Awaiting response from target doctor
- `Approved`: Both parties and admin approved
- `Rejected`: Request was denied
- `Cancelled`: Requester cancelled the request

### leave_requests.status
- `Pending`: Awaiting admin review
- `Approved`: Leave request approved by admin
- `Rejected`: Leave request denied by admin

---

## Troubleshooting

### Leave balance not updating
Check if the trigger is enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_leave_balance';
```

### Can't see data
Verify Row Level Security policies are correct and user is authenticated.

### Performance issues
Ensure all indexes are created (check doctor-schema.sql).

---

## Next Steps

After setting up the database:
1. ✅ Execute `doctor-schema.sql` in Supabase
2. ✅ Execute `doctor-sample-data.sql` for testing (optional)
3. ✅ Create backend API endpoints to query this data
4. ✅ Connect frontend pages to backend APIs
5. ✅ Test all CRUD operations

---

**Schema Version:** 1.0  
**Last Updated:** February 10, 2026  
**Compatible With:** DocTime v1.0
