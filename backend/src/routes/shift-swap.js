import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get all shift swap requests for a doctor (both sent and received)
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Get swap requests where doctor is the requester (sent requests)
    const { data: sentRequests, error: sentError } = await supabase
      .from('shift_swap_requests')
      .select(`
        *,
        requester_shift:shifts!requester_shift_id (
          shift_date,
          shift_type,
          start_time,
          end_time,
          department_id,
          departments (name)
        ),
        target_shift:shifts!target_shift_id (
          shift_date,
          shift_type,
          start_time,
          end_time,
          department_id,
          departments (name)
        ),
        target_doctor:doctors!target_doctor_id (
          first_name,
          last_name,
          specialization
        )
      `)
      .eq('requester_doctor_id', doctorId)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (sentError) {
      return res.status(500).json({ error: 'Failed to fetch swap requests', details: sentError });
    }

    // Format the response
    const formattedRequests = sentRequests.map(request => ({
      id: request.id,
      status: request.status,
      requestedDate: request.requested_date,
      targetDoctor: {
        name: `Dr. ${request.target_doctor.first_name} ${request.target_doctor.last_name}`,
        specialization: request.target_doctor.specialization
      },
      yourShift: {
        date: request.requester_shift.shift_date,
        type: request.requester_shift.shift_type,
        startTime: request.requester_shift.start_time,
        endTime: request.requester_shift.end_time,
        department: request.requester_shift.departments?.name || 'N/A'
      },
      theirShift: {
        date: request.target_shift.shift_date,
        type: request.target_shift.shift_type,
        startTime: request.target_shift.start_time,
        endTime: request.target_shift.end_time,
        department: request.target_shift.departments?.name || 'N/A'
      }
    }));

    return res.json({
      success: true,
      requests: formattedRequests
    });

  } catch (error) {
    console.error('Error fetching shift swap requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new shift swap request
router.post('/', async (req, res) => {
  try {
    const { requesterDoctorId, requesterShiftId, targetDoctorId } = req.body;

    // Validate input
    if (!requesterDoctorId || !requesterShiftId || !targetDoctorId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if doctor already has a pending swap request
    const { data: existingRequest, error: checkError } = await supabase
      .from('shift_swap_requests')
      .select('id')
      .eq('requester_doctor_id', requesterDoctorId)
      .eq('status', 'Pending')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return res.status(500).json({ error: 'Failed to check existing requests', details: checkError });
    }

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You already have a pending swap request. Please wait for it to be processed or cancel it first.' 
      });
    }

    // For now, we'll use the same shift as target shift (this can be enhanced to select a specific shift)
    // Or we can get the next available shift from the target doctor
    const { data: targetShift, error: targetShiftError } = await supabase
      .from('shifts')
      .select('id')
      .eq('doctor_id', targetDoctorId)
      .gte('shift_date', new Date().toISOString().split('T')[0])
      .order('shift_date', { ascending: true })
      .limit(1)
      .single();

    if (targetShiftError || !targetShift) {
      return res.status(404).json({ error: 'Target doctor has no available shifts' });
    }

    // Create the swap request
    const { data: newRequest, error: insertError } = await supabase
      .from('shift_swap_requests')
      .insert({
        requester_doctor_id: requesterDoctorId,
        requester_shift_id: requesterShiftId,
        target_doctor_id: targetDoctorId,
        target_shift_id: targetShift.id,
        status: 'Pending',
        requested_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to create swap request', details: insertError });
    }

    return res.json({
      success: true,
      message: 'Swap request created successfully',
      request: newRequest
    });

  } catch (error) {
    console.error('Error creating shift swap request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a swap request
router.delete('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const { error } = await supabase
      .from('shift_swap_requests')
      .update({ status: 'Cancelled' })
      .eq('id', requestId);

    if (error) {
      return res.status(500).json({ error: 'Failed to cancel swap request', details: error });
    }

    return res.json({
      success: true,
      message: 'Swap request cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling swap request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
