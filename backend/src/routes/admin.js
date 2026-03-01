import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total doctors count
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id', { count: 'exact' });

    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError);
      return res.status(500).json({ error: 'Failed to fetch doctor stats' });
    }

    const totalDoctors = doctors?.length || 0;

    // Get pending requests (both leave and shift swap)
    const { data: pendingLeaveRequests, error: leaveError } = await supabase
      .from('leave_requests')
      .select('id', { count: 'exact' })
      .eq('status', 'Pending');

    const { data: pendingShiftSwaps, error: swapError } = await supabase
      .from('shift_swap_requests')
      .select('id', { count: 'exact' })
      .in('status', ['Pending', 'Pending Coworker Approval', 'Pending Admin Approval']);

    if (leaveError || swapError) {
      console.error('Error fetching pending requests:', leaveError || swapError);
    }

    const totalPendingRequests = (pendingLeaveRequests?.length || 0) + (pendingShiftSwaps?.length || 0);

    // Get shifts statistics
    const { data: allShifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id, status, doctor_id')
      .eq('status', 'Confirmed');

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError);
      return res.status(500).json({ error: 'Failed to fetch shifts stats' });
    }

    const confirmedShifts = allShifts?.length || 0;

    // Calculate coverage rate
    // Get total possible shifts (assuming 3 shifts per day for a month)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const shiftsPerDay = 3; // Morning, Afternoon, Evening
    const totalPossibleShifts = daysInMonth * shiftsPerDay;
    const coverageRate = totalPossibleShifts > 0 
      ? Math.round((confirmedShifts / totalPossibleShifts) * 100) 
      : 0;

    return res.json({
      success: true,
      stats: {
        totalDoctors,
        activeShifts: confirmedShifts,
        pendingRequests: totalPendingRequests,
        coverageRate: Math.min(coverageRate, 100), // Cap at 100%
        pendingLeaveRequests: pendingLeaveRequests?.length || 0,
        pendingShiftSwaps: pendingShiftSwaps?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get staff count by department
router.get('/staff-by-department', async (req, res) => {
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('specialization');

    if (error) {
      console.error('Error fetching doctors:', error);
      return res.status(500).json({ error: 'Failed to fetch staff by department' });
    }

    // Count doctors by specialization (used as department)
    const departmentCounts = {};
    
    doctors?.forEach(doc => {
      // Use specialization as department
      const dept = doc.specialization || 'General';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    // Convert to array and sort by count descending
    const staffByDept = Object.entries(departmentCounts)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    console.log('Staff by department:', staffByDept);

    return res.json({
      success: true,
      staffByDepartment: staffByDept,
      totalStaff: doctors?.length || 0
    });

  } catch (error) {
    console.error('Error fetching staff by department:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get weekly coverage data
// Optional query param: ?week=YYYY-MM-DD (any date in the desired week)
// If not provided, shows week with most shifts in current month, or current week if none found
router.get('/weekly-coverage', async (req, res) => {
  try {
    let queryDate = req.query.week ? new Date(req.query.week) : null;
    
    // If no week specified, find the week with the most shifts this month
    if (!queryDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
      
      // Get all shifts for this month
      const { data: monthShifts, error: monthError } = await supabase
        .from('shifts')
        .select('shift_date')
        .gte('shift_date', firstDay)
        .lte('shift_date', lastDay)
        .eq('status', 'Confirmed');
      
      // Group shifts by week and find week with most shifts
      const shiftsByWeek = {};
      monthShifts?.forEach(shift => {
        const shiftDate = new Date(shift.shift_date);
        const dayOfWeek = shiftDate.getDay();
        const sunday = new Date(shiftDate);
        sunday.setDate(shiftDate.getDate() - dayOfWeek);
        const weekStart = sunday.toISOString().split('T')[0];
        shiftsByWeek[weekStart] = (shiftsByWeek[weekStart] || 0) + 1;
      });
      
      // Get week with most shifts, or use current week
      const weekWithMostShifts = Object.entries(shiftsByWeek).sort((a, b) => b[1] - a[1])[0];
      if (weekWithMostShifts) {
        queryDate = new Date(weekWithMostShifts[0]);
        console.log(`Found ${weekWithMostShifts[1]} shifts in week starting ${weekWithMostShifts[0]}`);
      } else {
        queryDate = today;
        console.log('No shifts found in month, using current week');
      }
    }
    
    const currentDay = queryDate.getDay();
    const startOfWeek = new Date(queryDate);
    startOfWeek.setDate(queryDate.getDate() - currentDay);
    
    console.log('Query date:', queryDate.toISOString().split('T')[0]);
    console.log('Start of week (Sunday):', startOfWeek.toISOString().split('T')[0]);
    
    // Calculate all 7 days of the week
    const weeklyData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Fetch confirmed shifts for this day
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('id, doctor_id, shift_type')
        .eq('shift_date', dateStr)
        .eq('status', 'Confirmed');
      
      const shiftsCount = shiftsData?.length || 0;
      console.log(`${dateStr} (${daysOfWeek[i]}): ${shiftsCount} shifts`);
      
      // Calculate coverage percentage (3 shifts max per day = 100%)
      const maxShiftsPerDay = 3;
      const coverage = Math.round((shiftsCount / maxShiftsPerDay) * 100);
      
      weeklyData.push({
        day: daysOfWeek[i],
        shifts: shiftsCount,
        coverage: Math.min(coverage, 100),
        date: dateStr
      });
    }

    console.log('Weekly data:', weeklyData);

    return res.json({
      success: true,
      weeklyData,
      startOfWeek: startOfWeek.toISOString().split('T')[0],
      note: 'Shows week with most shifts. Use ?week=YYYY-MM-DD to query specific weeks'
    });

  } catch (error) {
    console.error('Error fetching weekly coverage:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
