import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get doctor's schedule data
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Get current doctor's specialization
    const { data: currentDoctor, error: doctorError } = await supabase
      .from('doctors')
      .select('specialization')
      .eq('id', doctorId)
      .single();

    if (doctorError || !currentDoctor) {
      return res.status(404).json({ error: 'Doctor not found', details: doctorError });
    }

    // Get current week's shifts
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Fetch shifts for the week
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select(`
        *,
        departments (
          name,
          building,
          floor
        )
      `)
      .eq('doctor_id', doctorId)
      .gte('shift_date', startOfWeek.toISOString().split('T')[0])
      .lte('shift_date', endOfWeek.toISOString().split('T')[0])
      .order('shift_date', { ascending: true });

    if (shiftsError) {
      return res.status(500).json({ error: 'Failed to fetch shifts', details: shiftsError });
    }

    // Calculate stats
    let totalHours = 0;
    let departmentsSet = new Set();
    let colleaguesSet = new Set();

    // Calculate total hours and collect departments
    shifts.forEach(shift => {
      // Calculate hours worked
      const start = new Date(`1970-01-01T${shift.start_time}`);
      const end = new Date(`1970-01-01T${shift.end_time}`);
      let hours = (end - start) / (1000 * 60 * 60);
      
      // Handle overnight shifts (negative hours)
      if (hours < 0) {
        hours += 24;
      }
      
      totalHours += hours;
      
      // Collect unique departments
      if (shift.departments) {
        departmentsSet.add(shift.departments.name);
      }
    });

    // Count colleagues (other doctors with same specialization working in the same shifts)
    // Query all shifts that match the doctor's shift dates
    const shiftDates = shifts.map(s => s.shift_date);
    const colleaguesByDate = {};
    
    if (shiftDates.length > 0) {
      const { data: colleagueShifts, error: colleagueError } = await supabase
        .from('shifts')
        .select(`
          doctor_id,
          shift_date,
          shift_type,
          department_id,
          doctors!inner (
            specialization
          )
        `)
        .in('shift_date', shiftDates)
        .neq('doctor_id', doctorId)
        .eq('doctors.specialization', currentDoctor.specialization);

      if (!colleagueError && colleagueShifts) {
        // Group colleagues by date-type-department for accurate counting
        colleagueShifts.forEach(colShift => {
          colleaguesSet.add(colShift.doctor_id);
          
          // Group by shift key (date + type + department)
          const shiftKey = `${colShift.shift_date}-${colShift.shift_type}-${colShift.department_id}`;
          if (!colleaguesByDate[shiftKey]) {
            colleaguesByDate[shiftKey] = new Set();
          }
          colleaguesByDate[shiftKey].add(colShift.doctor_id);
        });
      }
    }

    const stats = {
      scheduledShifts: shifts.length,
      totalHours: Math.round(totalHours),
      colleagues: colleaguesSet.size,
      departments: Array.from(departmentsSet)
    };

    return res.json({
      success: true,
      stats,
      shifts: shifts.map(shift => {
        // Calculate colleagues for this specific shift
        const shiftKey = `${shift.shift_date}-${shift.shift_type}-${shift.department_id}`;
        const shiftColleagues = colleaguesByDate[shiftKey]?.size || 0;
        
        return {
          id: shift.id,
          date: shift.shift_date,
          shiftType: shift.shift_type,
          startTime: shift.start_time,
          endTime: shift.end_time,
          department: shift.departments?.name || 'N/A',
          building: shift.building || shift.departments?.building || 'N/A',
          floor: shift.floor || shift.departments?.floor || 'N/A',
          status: shift.status,
          colleagues: shiftColleagues
        };
      })
    });

  } catch (error) {
    console.error('Error fetching schedule:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all shifts for a specific month (for calendar view)
router.get('/doctor/:doctorId/calendar', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { year, month } = req.query;

    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;

    const firstDay = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        *,
        departments (
          name,
          building,
          floor
        )
      `)
      .eq('doctor_id', doctorId)
      .gte('shift_date', firstDay)
      .lte('shift_date', lastDay)
      .order('shift_date', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch calendar shifts', details: error });
    }

    return res.json({
      success: true,
      shifts: shifts.map(shift => ({
        id: shift.id,
        date: shift.shift_date,
        shiftType: shift.shift_type,
        startTime: shift.start_time,
        endTime: shift.end_time,
        department: shift.departments?.name || 'N/A',
        building: shift.building || shift.departments?.building || 'N/A',
        floor: shift.floor || shift.departments?.floor || 'N/A',
        status: shift.status,
        colleagues: shift.colleagues_count || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching calendar shifts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming shifts (next 2 weeks)
router.get('/doctor/:doctorId/upcoming', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        *,
        departments (
          name,
          building,
          floor
        )
      `)
      .eq('doctor_id', doctorId)
      .gte('shift_date', today)
      .order('shift_date', { ascending: true })
      .limit(10);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch upcoming shifts', details: error });
    }

    return res.json({
      success: true,
      shifts: shifts.map(shift => ({
        id: shift.id,
        date: shift.shift_date,
        shiftType: shift.shift_type,
        startTime: shift.start_time,
        endTime: shift.end_time,
        department: shift.departments?.name || 'N/A',
        building: shift.building || shift.departments?.building || 'N/A',
        floor: shift.floor || shift.departments?.floor || 'N/A',
        status: shift.status,
        colleagues: shift.colleagues_count || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching upcoming shifts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish roster/schedule - saves assignments to the database
router.post('/publish', async (req, res) => {
  try {
    console.log('=== PUBLISH REQUEST RECEIVED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { assignments, month, year } = req.body;

    if (!assignments || Object.keys(assignments).length === 0) {
      console.log('ERROR: No assignments provided');
      return res.status(400).json({ 
        success: false, 
        error: 'No assignments to publish' 
      });
    }
    
    console.log('Number of assignment keys:', Object.keys(assignments).length);

    // Pre-fetch all departments for name → id lookup
    const { data: allDepartments } = await supabase.from('departments').select('id, name');
    const deptNameToId = {};
    (allDepartments || []).forEach(d => { deptNameToId[d.name.toLowerCase()] = d.id; });

    // Convert assignments object to array of shift entries
    const shiftsToCreate = [];
    const seenShifts = new Set(); // Track unique shifts to prevent duplicates
    
    for (const [key, staffList] of Object.entries(assignments)) {
      // Parse key: "YYYY-M-DD-ShiftType" or "YYYY-M-D-ShiftType"
      // Use regex to handle variable-length month/day
      const keyMatch = key.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(.+)$/);
      
      if (!keyMatch) {
        console.warn(`Invalid key format: ${key}`);
        continue;
      }
      
      const [, assignYear, assignMonth, day, shiftType] = keyMatch;
      
      // Format date as YYYY-MM-DD without timezone conversion
      const paddedMonth = String(assignMonth).padStart(2, '0');
      const paddedDay = String(day).padStart(2, '0');
      const shiftDate = `${assignYear}-${paddedMonth}-${paddedDay}`;
      
      console.log(`Parsed key: ${key} -> Date: ${shiftDate}, Shift: ${shiftType}`);
      
      // For each staff member assigned to this shift
      staffList.forEach((assignment) => {
        const shiftKey = `${assignment.staffId}-${shiftDate}-${shiftType}`;
        
        // Skip if this exact shift assignment already exists (deduplication)
        if (seenShifts.has(shiftKey)) {
          console.warn(`Duplicate shift detected for ${assignment.staffId} on ${shiftDate} ${shiftType}, skipping`);
          return;
        }
        
        seenShifts.add(shiftKey);

        const departmentId = assignment.department
          ? deptNameToId[assignment.department.toLowerCase()] || null
          : null;

        shiftsToCreate.push({
          doctor_id: assignment.staffId,
          shift_date: shiftDate,
          shift_type: shiftType,
          start_time: getShiftStartTime(shiftType),
          end_time: getShiftEndTime(shiftType),
          department_id: departmentId,
          status: 'Confirmed'
        });
      });
    }

    if (shiftsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid shifts to publish'
      });
    }

    console.log(`Publishing ${shiftsToCreate.length} shifts:`, JSON.stringify(shiftsToCreate, null, 2));

    // Insert shifts into database
    const { data, error } = await supabase
      .from('shifts')
      .insert(shiftsToCreate)
      .select();

    if (error) {
      console.error('Error publishing schedule:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to publish schedule',
        details: error.message 
      });
    }

    console.log(`Successfully published ${data.length} shifts`);

    return res.json({
      success: true,
      message: 'Schedule published successfully',
      shiftsCreated: data.length,
      shifts: data
    });

  } catch (error) {
    console.error('Error publishing schedule:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get published shifts for a specific month
router.get('/published/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Calculate date range for the month
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1)
      .toISOString()
      .split('T')[0];
    const lastDay = new Date(parseInt(year), parseInt(month), 0)
      .toISOString()
      .split('T')[0];

    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        id,
        doctor_id,
        shift_date,
        shift_type,
        start_time,
        end_time,
        status,
        doctors (
          first_name,
          last_name,
          email,
          specialization
        )
      `)
      .gte('shift_date', firstDay)
      .lte('shift_date', lastDay)
      .eq('status', 'Confirmed')
      .order('shift_date', { ascending: true })
      .order('shift_type', { ascending: true });

    if (error) {
      console.error('Error fetching published shifts:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch shifts',
        details: error.message 
      });
    }

    // Group by date and shift type
    const groupedShifts = {};
    shifts.forEach(shift => {
      const key = `${shift.shift_date}-${shift.shift_type}`;
      if (!groupedShifts[key]) {
        groupedShifts[key] = [];
      }
      groupedShifts[key].push({
        id: shift.id,
        doctor: shift.doctors ? `${shift.doctors.first_name} ${shift.doctors.last_name}` : 'Unknown',
        doctorId: shift.doctor_id,
        email: shift.doctors?.email,
        specialization: shift.doctors?.specialization,
        startTime: shift.start_time,
        endTime: shift.end_time,
        status: shift.status
      });
    });

    return res.json({
      success: true,
      year: parseInt(year),
      month: parseInt(month),
      shifts: groupedShifts,
      totalShifts: shifts.length
    });

  } catch (error) {
    console.error('Error fetching published shifts:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Helper function to get shift start time
function getShiftStartTime(shiftType) {
  const shiftTimes = {
    'Morning Shift': '07:00:00',
    'Afternoon Shift': '15:00:00',
    'Evening Shift': '15:00:00',
    'Night Shift': '23:00:00'
  };
  return shiftTimes[shiftType] || '07:00:00';
}

// Helper function to get shift end time
function getShiftEndTime(shiftType) {
  const shiftTimes = {
    'Morning Shift': '15:00:00',
    'Afternoon Shift': '23:00:00',
    'Evening Shift': '23:00:00',
    'Night Shift': '07:00:00'
  };
  return shiftTimes[shiftType] || '15:00:00';
}

export default router;
