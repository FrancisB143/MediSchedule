# MySchedule Setup Guide

This guide will help you set up and test the MySchedule page with real Supabase data.

## Prerequisites

- ✅ Backend Express server with Supabase integration
- ✅ Frontend React app
- ✅ Supabase account with project created

## Setup Steps

### 1. Execute Database Schemas in Supabase

Go to your Supabase dashboard SQL Editor and execute these files **in order**. Each script drops and recreates tables, so you can run them multiple times without errors.

#### Step 1.1: Execute Main Schema
Run `backend/supabase/schema.sql` to create the base authentication tables.

**What this does:**
- Drops existing doctors and admins tables
- Creates doctors and admins tables with fresh data
- Inserts doctor: `abucio_230000001128@uic.edu.ph` / `12345`
- Inserts admin: `fbangoy_230000001354@uic.edu.ph` / `12345`

#### Step 1.2: Execute Doctor Schema
Run `backend/supabase/doctor-schema.sql` to create all doctor-related tables.

**What this does:**
- Drops existing doctor feature tables
- Creates departments, shifts, shift_swap_requests, leave_requests, leave_balances tables
- Sets up Row Level Security (RLS) policies
- Creates triggers and indexes

#### Step 1.3: Execute Sample Data
Run `backend/supabase/sample-shifts.sql` to populate sample shift data.

**What this does:**
- Inserts 3 departments (Cardiology, Emergency, Pediatrics)
- Creates 7 sample shifts for the current week
- Automatically detects doctor ID from email
- Shifts have varying types (Morning, Afternoon, Night) and statuses (Confirmed, Pending)

**Note:** This script automatically finds your doctor ID, no manual editing needed!

#### Optional: Verify Data
After executing the scripts, run this query to verify:

```sql
SELECT 
    s.shift_date,
    s.shift_type,
    s.start_time,
    s.end_time,
    d.name as department,
    s.status,
    s.colleagues_count
FROM shifts s
JOIN departments d ON s.department_id = d.id
JOIN doctors doc ON s.doctor_id = doc.id
WHERE doc.email = 'abucio_230000001128@uic.edu.ph'
ORDER BY s.shift_date;
```

### 2. Backend Server

The backend is already running on `http://localhost:3001`.

**Available Endpoints:**
- `GET /api/health` - Check server status
- `POST /api/auth/login` - Login endpoint
- `GET /api/shifts/doctor/:doctorId` - Get current week shifts with stats
- `GET /api/shifts/doctor/:doctorId/upcoming` - Get next 10 upcoming shifts

### 3. Test the MySchedule Page

1. **Start Frontend** (if not already running):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login**:
   - Go to `http://localhost:5173/login`
   - Email: `abucio_230000001128@uic.edu.ph`
   - Password: `12345`
   - Click "Sign In"

3. **Navigate to MySchedule**:
   - After login, you'll be directed to the doctor dashboard
   - Click on "My Schedule" in the sidebar
   - The page will automatically fetch shifts from Supabase

### What You Should See

**Stats Cards:**
- **This Week**: Number of scheduled shifts
- **Total Hours**: Sum of all shift hours
- **Colleagues**: Total number of colleagues working with you
- **Departments**: Number and names of departments

**Shift Cards:**
Each shift card displays:
- Day number and name (e.g., "15 WED")
- Shift type (Morning Shift, Afternoon Shift, Night Shift)
- Status badge (Confirmed, Pending, Cancelled)
- Time range (e.g., "7:00 AM - 3:00 PM")
- Department, Building, and Floor
- Number of colleagues on the shift
- "View Details" button

### Troubleshooting

#### No shifts showing:
1. Check browser console for errors (F12)
2. Verify backend is running: `http://localhost:3001/api/health`
3. Check Network tab to see API request to `/api/shifts/doctor/:doctorId`
4. Verify you executed `sample-shifts.sql` in Supabase
5. Check Supabase SQL Editor for any errors in schema execution

#### Login not working:
1. Verify you executed `schema.sql` in Supabase
2. Check that the password hash is correct in the database
3. Clear localStorage and try again
4. Check backend logs for authentication errors

#### "Loading schedule..." stuck:
1. Check browser console for CORS errors
2. Verify backend URL is correct: `http://localhost:3001`
3. Check that your Supabase credentials in `.env` are correct
4. Verify doctor record exists in database

### API Response Example

When you call `GET /api/shifts/doctor/:doctorId`, you'll get:

```json
{
  "success": true,
  "stats": {
    "scheduledShifts": 4,
    "totalHours": 32,
    "colleagues": 12,
    "departments": ["Cardiology", "Emergency"]
  },
  "shifts": [
    {
      "id": "uuid",
      "date": "2025-01-15",
      "shiftType": "Morning Shift",
      "startTime": "07:00:00",
      "endTime": "15:00:00",
      "department": "Cardiology",
      "building": "Building A",
      "floor": "Floor 3",
      "status": "confirmed",
      "colleagues": 3
    }
  ]
}
```

### Database Structure

**shifts table columns:**
- `id` (UUID, primary key)
- `doctor_id` (UUID, references doctors)
- `department_id` (UUID, references departments)
- `shift_date` (DATE)
- `shift_type` (TEXT) - e.g., "Morning Shift"
- `start_time` (TIME)
- `end_time` (TIME)
- `status` (TEXT) - "confirmed", "pending", "cancelled"
- `colleagues_count` (INTEGER)
- `created_at` (TIMESTAMPTZ)

**departments table columns:**
- `id` (UUID, primary key)
- `name` (TEXT, unique)
- `building` (TEXT)
- `floor` (TEXT)
- `created_at` (TIMESTAMPTZ)

### Next Steps

Once MySchedule is working:
1. Implement Shift Swap functionality
2. Implement Leave Request functionality
3. Add real-time updates with Supabase subscriptions
4. Add shift details modal
5. Implement shift filtering (by status, department, date range)

### Notes

- All times are stored in 24-hour format (HH:MM:SS)
- Dates are stored in ISO format (YYYY-MM-DD)
- The API calculates stats dynamically from the current week's shifts
- Status colors: Green (Confirmed), Yellow (Pending), Red (Cancelled)
- Row Level Security (RLS) is enabled but bypassed using service role key
