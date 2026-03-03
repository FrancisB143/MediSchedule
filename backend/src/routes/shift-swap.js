import express from 'express';
import { supabase } from '../config/supabase.js';
import { sendSwapStatusNotificationEmail } from '../services/emailService.js';

const router = express.Router();

const REQUEST_STATUS = {
  PENDING_COWORKER: 'Pending Coworker Approval',
  DECLINED_COWORKER: 'Declined by Coworker',
  PENDING_ADMIN: 'Pending Admin Approval',
  APPROVED: 'Approved',
  REJECTED_ADMIN: 'Rejected by Admin',
  CANCELLED: 'Cancelled'
};

const ACTIVE_REQUEST_STATUSES = [
  REQUEST_STATUS.PENDING_COWORKER,
  REQUEST_STATUS.PENDING_ADMIN
];

const MAX_WEEKLY_HOURS = Number(process.env.OVERTIME_MAX_HOURS_PER_WEEK || 60);

const getWeekDateRange = (dateInput) => {
  const date = new Date(`${dateInput}T00:00:00`);
  const day = date.getDay();

  const start = new Date(date);
  start.setDate(date.getDate() - day);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0]
  };
};

const getShiftHours = (startTime, endTime) => {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  let hours = (end - start) / (1000 * 60 * 60);

  if (hours < 0) {
    hours += 24;
  }

  return hours;
};

const hasTimeOverlap = (startA, endA, startB, endB) => {
  const aStart = new Date(`1970-01-01T${startA}`);
  let aEnd = new Date(`1970-01-01T${endA}`);
  const bStart = new Date(`1970-01-01T${startB}`);
  let bEnd = new Date(`1970-01-01T${endB}`);

  if (aEnd <= aStart) {
    aEnd = new Date(aEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  if (bEnd <= bStart) {
    bEnd = new Date(bEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  return aStart < bEnd && bStart < aEnd;
};

const getDoctorById = async (doctorId) => {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, email, specialization')
    .eq('id', doctorId)
    .single();

  return { data, error };
};

const checkDoctorOvertimeLimit = async ({ doctorId, shiftDate, addedShiftHours = 0, excludedShiftId = null }) => {
  const { weekStart, weekEnd } = getWeekDateRange(shiftDate);

  let query = supabase
    .from('shifts')
    .select('id, start_time, end_time')
    .eq('doctor_id', doctorId)
    .gte('shift_date', weekStart)
    .lte('shift_date', weekEnd);

  if (excludedShiftId) {
    query = query.neq('id', excludedShiftId);
  }

  const { data: shifts, error } = await query;

  if (error) {
    return { ok: false, error, weeklyHours: 0, projectedHours: 0 };
  }

  const weeklyHours = (shifts || []).reduce((total, shift) => {
    return total + getShiftHours(shift.start_time, shift.end_time);
  }, 0);

  const projectedHours = weeklyHours + addedShiftHours;

  return {
    ok: projectedHours <= MAX_WEEKLY_HOURS,
    weeklyHours,
    projectedHours
  };
};

const validateShiftCompatibility = (requesterShift, targetShift) => {
  // Both shifts must be in the same department
  if (!requesterShift?.department_id || !targetShift?.department_id) {
    return { ok: false, reason: 'Both shifts must have department assignments.' };
  }

  if (requesterShift.department_id !== targetShift.department_id) {
    return { ok: false, reason: 'Shifts must be in the same department to swap.' };
  }

  return { ok: true };
};

const sendSwapNotification = async ({ toDoctor, subject, heading, message, details = [] }) => {
  if (!toDoctor?.email) {
    return;
  }

  const fullName = `Dr. ${toDoctor.first_name} ${toDoctor.last_name}`;

  await sendSwapStatusNotificationEmail({
    email: toDoctor.email,
    name: fullName,
    subject,
    heading,
    message,
    details
  });
};

// Get all shift swap requests for a doctor (both sent and received)
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Get requests initiated by doctor
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
          specialization,
          email
        )
      `)
      .eq('requester_doctor_id', doctorId)
      .in('status', ['Pending', ...ACTIVE_REQUEST_STATUSES])
      .order('created_at', { ascending: false });

    if (sentError) {
      return res.status(500).json({ error: 'Failed to fetch swap requests', details: sentError });
    }

    const formattedSent = sentRequests.map(request => ({
      id: request.id,
      status: request.status,
      requestedDate: request.requested_date,
      responseDate: request.response_date,
      notes: request.notes || null,
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

    // Get requests requiring coworker action
    const { data: incomingRequests, error: incomingError } = await supabase
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
        requester_doctor:doctors!requester_doctor_id (
          first_name,
          last_name,
          specialization
        )
      `)
      .eq('target_doctor_id', doctorId)
      .eq('status', REQUEST_STATUS.PENDING_COWORKER)
      .order('created_at', { ascending: false });

    if (incomingError) {
      return res.status(500).json({ error: 'Failed to fetch incoming swap requests', details: incomingError });
    }

    const formattedIncoming = incomingRequests.map(request => ({
      id: request.id,
      status: request.status,
      requestedDate: request.requested_date,
      requesterDoctor: {
        name: `Dr. ${request.requester_doctor.first_name} ${request.requester_doctor.last_name}`,
        specialization: request.requester_doctor.specialization
      },
      yourShift: {
        date: request.target_shift.shift_date,
        type: request.target_shift.shift_type,
        startTime: request.target_shift.start_time,
        endTime: request.target_shift.end_time,
        department: request.target_shift.departments?.name || 'N/A'
      },
      requestedShift: {
        date: request.requester_shift.shift_date,
        type: request.requester_shift.shift_type,
        startTime: request.requester_shift.start_time,
        endTime: request.requester_shift.end_time,
        department: request.requester_shift.departments?.name || 'N/A'
      }
    }));

    return res.json({
      success: true,
      requests: formattedSent,
      incomingRequests: formattedIncoming
    });

  } catch (error) {
    console.error('Error fetching shift swap requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new shift swap request
router.post('/', async (req, res) => {
  try {
    const { requesterDoctorId, requesterShiftId, targetDoctorId, targetShiftId, notes } = req.body;

    if (!requesterDoctorId || !requesterShiftId || !targetDoctorId || !targetShiftId) {
      return res.status(400).json({ error: 'Missing required fields: requesterDoctorId, requesterShiftId, targetDoctorId, targetShiftId are all required.' });
    }

    // Validate requester shift exists and is assigned to requester doctor
    const { data: requesterShift, error: requesterShiftError } = await supabase
      .from('shifts')
      .select('id, doctor_id, shift_date, shift_type, start_time, end_time, department_id')
      .eq('id', requesterShiftId)
      .single();

    if (requesterShiftError || !requesterShift) {
      return res.status(404).json({ error: 'Selected shift does not exist.' });
    }

    if (requesterShift.doctor_id !== requesterDoctorId) {
      return res.status(403).json({ error: 'You are not assigned to the selected shift.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(`${requesterShift.shift_date}T00:00:00`);

    if (shiftDate <= today) {
      return res.status(400).json({ error: 'Shift swap can only be requested for future shifts.' });
    }

    // Validate the specific target shift chosen by the requester
    const { data: targetShift, error: targetShiftError } = await supabase
      .from('shifts')
      .select('id, doctor_id, shift_date, shift_type, start_time, end_time, department_id')
      .eq('id', targetShiftId)
      .single();

    if (targetShiftError || !targetShift) {
      return res.status(404).json({ error: 'Selected target shift does not exist.' });
    }

    if (targetShift.doctor_id !== targetDoctorId) {
      return res.status(403).json({ error: 'Selected shift does not belong to the target doctor.' });
    }

    // Prevent duplicate active requests for this requester shift
    const { data: existingRequests, error: existingError } = await supabase
      .from('shift_swap_requests')
      .select('id')
      .eq('requester_shift_id', requesterShiftId)
      .in('status', ACTIVE_REQUEST_STATUSES);

    if (existingError) {
      return res.status(500).json({ error: 'Failed to validate existing requests', details: existingError });
    }

    if ((existingRequests || []).length > 0) {
      return res.status(400).json({ error: 'This shift already has an active swap request.' });
    }

    // Validate both doctors and qualification/training proxy
    const [{ data: requesterDoctor, error: requesterDoctorError }, { data: targetDoctor, error: targetDoctorError }] = await Promise.all([
      getDoctorById(requesterDoctorId),
      getDoctorById(targetDoctorId)
    ]);

    if (requesterDoctorError || !requesterDoctor || targetDoctorError || !targetDoctor) {
      return res.status(404).json({ error: 'Doctor record not found for requester or coworker.' });
    }

    const shiftCompatibility = validateShiftCompatibility(requesterShift, targetShift);
    if (!shiftCompatibility.ok) {
      return res.status(400).json({ error: shiftCompatibility.reason });
    }

    // Validate coworker conflict after hypothetical swap
    const { data: coworkerSameDayShifts, error: coworkerConflictError } = await supabase
      .from('shifts')
      .select('id, start_time, end_time')
      .eq('doctor_id', targetDoctorId)
      .eq('shift_date', requesterShift.shift_date)
      .neq('id', targetShift.id);

    if (coworkerConflictError) {
      return res.status(500).json({ error: 'Failed to validate coworker schedule conflicts', details: coworkerConflictError });
    }

    const hasConflict = (coworkerSameDayShifts || []).some((shift) =>
      hasTimeOverlap(
        requesterShift.start_time,
        requesterShift.end_time,
        shift.start_time,
        shift.end_time
      )
    );

    if (hasConflict) {
      return res.status(400).json({ error: 'Selected coworker has a schedule conflict for this shift.' });
    }

    // Validate coworker overtime after taking requester shift
    const requesterShiftHours = getShiftHours(requesterShift.start_time, requesterShift.end_time);
    const overtimeCheck = await checkDoctorOvertimeLimit({
      doctorId: targetDoctorId,
      shiftDate: requesterShift.shift_date,
      addedShiftHours: requesterShiftHours,
      excludedShiftId: targetShift.id
    });

    if (overtimeCheck.error) {
      return res.status(500).json({ error: 'Failed to validate overtime limit', details: overtimeCheck.error });
    }

    if (!overtimeCheck.ok) {
      return res.status(400).json({
        error: `Selected coworker would exceed overtime limits (${Math.round(overtimeCheck.projectedHours)}h > ${MAX_WEEKLY_HOURS}h/week).`
      });
    }

    // Create request in coworker pending state
    const { data: newRequest, error: insertError } = await supabase
      .from('shift_swap_requests')
      .insert({
        requester_doctor_id: requesterDoctorId,
        requester_shift_id: requesterShift.id,
        target_doctor_id: targetDoctorId,
        target_shift_id: targetShift.id,
        status: REQUEST_STATUS.PENDING_COWORKER,
        requested_date: new Date().toISOString().split('T')[0],
        notes: notes || null
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to create swap request', details: insertError });
    }

    await sendSwapNotification({
      toDoctor: targetDoctor,
      subject: 'New Shift Swap Request - Action Required',
      heading: 'Shift Swap Request Pending Your Approval',
      message: `Dr. ${requesterDoctor.first_name} ${requesterDoctor.last_name} requested to swap shifts with you for ${requesterShift.shift_date}.`,
      details: [
        `Requested Shift: ${requesterShift.shift_type} (${requesterShift.start_time} - ${requesterShift.end_time})`,
        `Your Current Shift: ${targetShift.shift_type} (${targetShift.start_time} - ${targetShift.end_time})`,
        `Current Status: ${REQUEST_STATUS.PENDING_COWORKER}`
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Shift swap request created and sent to coworker for approval.',
      request: newRequest
    });

  } catch (error) {
    console.error('Error creating shift swap request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Coworker accepts/declines a swap request
router.patch('/:requestId/coworker-response', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { coworkerDoctorId, action, note } = req.body;

    if (!coworkerDoctorId || !action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid coworker response payload.' });
    }

    const { data: request, error: requestError } = await supabase
      .from('shift_swap_requests')
      .select(`
        *,
        requester_doctor:doctors!requester_doctor_id (id, first_name, last_name, email),
        target_doctor:doctors!target_doctor_id (id, first_name, last_name, email)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Swap request not found.' });
    }

    if (request.target_doctor_id !== coworkerDoctorId) {
      return res.status(403).json({ error: 'You are not authorized to act on this swap request.' });
    }

    if (request.status !== REQUEST_STATUS.PENDING_COWORKER) {
      return res.status(400).json({ error: `Coworker action is not allowed when status is "${request.status}".` });
    }

    const nextStatus = action === 'accept'
      ? REQUEST_STATUS.PENDING_ADMIN
      : REQUEST_STATUS.DECLINED_COWORKER;

    const { data: updatedRequest, error: updateError } = await supabase
      .from('shift_swap_requests')
      .update({
        status: nextStatus,
        response_date: new Date().toISOString().split('T')[0],
        notes: note || null
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update coworker response', details: updateError });
    }

    await sendSwapNotification({
      toDoctor: request.requester_doctor,
      subject: 'Shift Swap Request Updated',
      heading: 'Coworker Responded to Your Shift Swap Request',
      message: action === 'accept'
        ? `Your coworker accepted the swap request. It is now pending admin approval.`
        : `Your coworker declined the swap request.${note ? ` Reason: ${note}` : ''}`,
      details: [`Current Status: ${nextStatus}`]
    });

    return res.json({
      success: true,
      message: `Swap request ${action === 'accept' ? 'accepted' : 'declined'} by coworker.`,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error processing coworker response:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin approval/rejection review
router.patch('/:requestId/admin-review', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminId, action, rejectionReason } = req.body;

    if (!adminId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid admin review payload.' });
    }

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      return res.status(403).json({ error: 'Invalid admin user.' });
    }

    const { data: request, error: requestError } = await supabase
      .from('shift_swap_requests')
      .select(`
        *,
        requester_shift:shifts!requester_shift_id (id, doctor_id, shift_date, shift_type, start_time, end_time, department_id),
        target_shift:shifts!target_shift_id (id, doctor_id, shift_date, shift_type, start_time, end_time, department_id),
        requester_doctor:doctors!requester_doctor_id (id, first_name, last_name, email, specialization),
        target_doctor:doctors!target_doctor_id (id, first_name, last_name, email, specialization)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Swap request not found.' });
    }

    if (request.status !== REQUEST_STATUS.PENDING_ADMIN) {
      return res.status(400).json({ error: `Admin review is only allowed for status "${REQUEST_STATUS.PENDING_ADMIN}".` });
    }

    if (action === 'reject') {
      const { data: rejectedRequest, error: rejectError } = await supabase
        .from('shift_swap_requests')
        .update({
          status: REQUEST_STATUS.REJECTED_ADMIN,
          response_date: new Date().toISOString().split('T')[0],
          notes: rejectionReason || 'Rejected by admin'
        })
        .eq('id', requestId)
        .select()
        .single();

      if (rejectError) {
        return res.status(500).json({ error: 'Failed to reject shift swap request', details: rejectError });
      }

      await Promise.all([
        sendSwapNotification({
          toDoctor: request.requester_doctor,
          subject: 'Shift Swap Rejected by Admin',
          heading: 'Your Shift Swap Request Was Rejected',
          message: rejectionReason || 'No rejection reason was provided.',
          details: [`Current Status: ${REQUEST_STATUS.REJECTED_ADMIN}`]
        }),
        sendSwapNotification({
          toDoctor: request.target_doctor,
          subject: 'Shift Swap Rejected by Admin',
          heading: 'Shift Swap Request Rejected',
          message: rejectionReason || 'No rejection reason was provided.',
          details: [`Current Status: ${REQUEST_STATUS.REJECTED_ADMIN}`]
        })
      ]);

      return res.json({
        success: true,
        message: 'Shift swap request rejected by admin.',
        request: rejectedRequest
      });
    }

    // Admin approval checks
    const shiftCompatibility = validateShiftCompatibility(request.requester_shift, request.target_shift);
    if (!shiftCompatibility.ok) {
      return res.status(400).json({ error: `Admin validation failed: ${shiftCompatibility.reason}` });
    }

    // Overtime checks for both sides after swap
    const requesterProjected = await checkDoctorOvertimeLimit({
      doctorId: request.requester_doctor_id,
      shiftDate: request.requester_shift.shift_date,
      addedShiftHours: getShiftHours(request.target_shift.start_time, request.target_shift.end_time),
      excludedShiftId: request.requester_shift_id
    });

    if (requesterProjected.error) {
      return res.status(500).json({ error: 'Failed overtime validation for requester', details: requesterProjected.error });
    }

    const targetProjected = await checkDoctorOvertimeLimit({
      doctorId: request.target_doctor_id,
      shiftDate: request.target_shift.shift_date,
      addedShiftHours: getShiftHours(request.requester_shift.start_time, request.requester_shift.end_time),
      excludedShiftId: request.target_shift_id
    });

    if (targetProjected.error) {
      return res.status(500).json({ error: 'Failed overtime validation for target doctor', details: targetProjected.error });
    }

    if (!requesterProjected.ok || !targetProjected.ok) {
      return res.status(400).json({
        error: `Admin overtime validation failed. Weekly max is ${MAX_WEEKLY_HOURS} hours.`
      });
    }

    // Staffing coverage check: both shifts must still exist and be assigned to expected doctors
    if (!request.requester_shift || !request.target_shift) {
      return res.status(400).json({ error: 'Staffing coverage check failed: one of the shifts no longer exists.' });
    }

    if (
      request.requester_shift.doctor_id !== request.requester_doctor_id ||
      request.target_shift.doctor_id !== request.target_doctor_id
    ) {
      return res.status(400).json({ error: 'Staffing coverage check failed: shift assignments changed since request creation.' });
    }

    // Apply schedule updates (swap doctor assignments)
    const { error: updateRequesterShiftError } = await supabase
      .from('shifts')
      .update({ doctor_id: request.target_doctor_id })
      .eq('id', request.requester_shift_id)
      .eq('doctor_id', request.requester_doctor_id);

    if (updateRequesterShiftError) {
      return res.status(500).json({ error: 'Failed to update requester shift during approval', details: updateRequesterShiftError });
    }

    const { error: updateTargetShiftError } = await supabase
      .from('shifts')
      .update({ doctor_id: request.requester_doctor_id })
      .eq('id', request.target_shift_id)
      .eq('doctor_id', request.target_doctor_id);

    if (updateTargetShiftError) {
      // Best-effort rollback
      await supabase
        .from('shifts')
        .update({ doctor_id: request.requester_doctor_id })
        .eq('id', request.requester_shift_id);

      return res.status(500).json({ error: 'Failed to update target shift during approval', details: updateTargetShiftError });
    }

    const { data: approvedRequest, error: approvedError } = await supabase
      .from('shift_swap_requests')
      .update({
        status: REQUEST_STATUS.APPROVED,
        response_date: new Date().toISOString().split('T')[0],
        notes: 'Approved by admin and schedules updated automatically.'
      })
      .eq('id', requestId)
      .select()
      .single();

    if (approvedError) {
      return res.status(500).json({ error: 'Shifts swapped but failed to finalize request status', details: approvedError });
    }

    await Promise.all([
      sendSwapNotification({
        toDoctor: request.requester_doctor,
        subject: 'Shift Swap Approved',
        heading: 'Your Shift Swap Request Was Approved',
        message: 'The admin approved your shift swap request and both schedules were updated automatically.',
        details: [`Current Status: ${REQUEST_STATUS.APPROVED}`]
      }),
      sendSwapNotification({
        toDoctor: request.target_doctor,
        subject: 'Shift Swap Approved',
        heading: 'Shift Swap Approved and Scheduled',
        message: 'The admin approved the shift swap request and both schedules were updated automatically.',
        details: [`Current Status: ${REQUEST_STATUS.APPROVED}`]
      })
    ]);

    return res.json({
      success: true,
      message: 'Shift swap request approved and schedules updated.',
      request: approvedRequest
    });
  } catch (error) {
    console.error('Error processing admin review:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a swap request
router.delete('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const { error } = await supabase
      .from('shift_swap_requests')
      .update({ status: REQUEST_STATUS.CANCELLED })
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

// Get available colleagues for a specific shift date
router.get('/available-colleagues/:shiftId/:currentDoctorId', async (req, res) => {
  try {
    const { shiftId, currentDoctorId } = req.params;

    // Get the shift date from the selected shift
    const { data: selectedShift, error: shiftError } = await supabase
      .from('shifts')
      .select('id, doctor_id, shift_date, shift_type, start_time, end_time, department_id')
      .eq('id', shiftId)
      .single();

    if (shiftError || !selectedShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (selectedShift.doctor_id !== currentDoctorId) {
      return res.status(403).json({ error: 'You are not assigned to this shift.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(`${selectedShift.shift_date}T00:00:00`);

    if (selectedDate <= today) {
      return res.status(400).json({ error: 'Shift date must be in the future.' });
    }

    const { data: currentDoctor, error: currentDoctorError } = await getDoctorById(currentDoctorId);
    if (currentDoctorError || !currentDoctor) {
      return res.status(404).json({ error: 'Current doctor not found.' });
    }

    // Get all doctors who have shifts on the same date (excluding current doctor)
    const { data: colleagueShifts, error: colleagueError } = await supabase
      .from('shifts')
      .select(`
        id,
        doctor_id,
        shift_type,
        start_time,
        end_time,
        department_id,
        doctors!inner (
          id,
          first_name,
          last_name,
          specialization,
          email
        )
      `)
      .eq('shift_date', selectedShift.shift_date)
      .neq('doctor_id', currentDoctorId);

    if (colleagueError) {
      return res.status(500).json({ error: 'Failed to fetch colleagues', details: colleagueError });
    }

    const requesterShiftHours = getShiftHours(selectedShift.start_time, selectedShift.end_time);

    // Remove duplicates and format response
    const uniqueColleagues = [];
    const seenDoctorIds = new Set();

    for (const shift of colleagueShifts) {
      if (!seenDoctorIds.has(shift.doctor_id)) {
        seenDoctorIds.add(shift.doctor_id);
        const doctor = shift.doctors;

        const shiftCompatibility = validateShiftCompatibility(selectedShift, shift);

        const { data: sameDayOtherShifts, error: sameDayOtherShiftsError } = await supabase
          .from('shifts')
          .select('id, start_time, end_time')
          .eq('doctor_id', doctor.id)
          .eq('shift_date', selectedShift.shift_date)
          .neq('id', shift.id);

        const hasConflict = !sameDayOtherShiftsError && (sameDayOtherShifts || []).some((otherShift) =>
          hasTimeOverlap(
            selectedShift.start_time,
            selectedShift.end_time,
            otherShift.start_time,
            otherShift.end_time
          )
        );

        const overtimeCheck = await checkDoctorOvertimeLimit({
          doctorId: doctor.id,
          shiftDate: selectedShift.shift_date,
          addedShiftHours: requesterShiftHours,
          excludedShiftId: shift.id
        });

        const exceedsOvertime = !overtimeCheck.error && !overtimeCheck.ok;
        const reasons = [];

        if (!shiftCompatibility.ok) {
          reasons.push(shiftCompatibility.reason);
        }

        if (hasConflict) {
          reasons.push('Schedule conflict on selected date');
        }

        if (exceedsOvertime) {
          reasons.push(`Would exceed overtime limit (${MAX_WEEKLY_HOURS}h/week)`);
        }

        if (sameDayOtherShiftsError) {
          reasons.push('Unable to validate schedule conflict');
        }

        if (overtimeCheck.error) {
          reasons.push('Unable to validate overtime limit');
        }

        const isAvailable = reasons.length === 0;

        uniqueColleagues.push({
          id: doctor.id,
          name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
          specialization: doctor.specialization,
          initials: `${doctor.first_name[0]}${doctor.last_name[0]}`,
          available: isAvailable,
          reason: isAvailable ? null : reasons.join(', ')
        });
      }
    }

    return res.json({
      success: true,
      colleagues: uniqueColleagues
    });

  } catch (error) {
    console.error('Error fetching available colleagues:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
