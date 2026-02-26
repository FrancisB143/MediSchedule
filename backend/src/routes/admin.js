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
      .eq('status', 'Pending');

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

export default router;
