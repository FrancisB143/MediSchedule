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

export default router;
