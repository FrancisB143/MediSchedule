import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/leave-requests/doctor/:doctorId - Get leave balance for a doctor
router.get('/doctor/:doctorId/balance', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const currentYear = new Date().getFullYear();

    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('year', currentYear)
      .single();

    if (error) {
      // If no balance record exists, return default values
      if (error.code === 'PGRST116') {
        return res.json({
          total_annual_days: 20,
          used_days: 0,
          pending_days: 0,
          remaining_days: 20
        });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
});

// GET /api/leave-requests/doctor/:doctorId - Get all leave requests for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        approved_by_admin:admins!leave_requests_approved_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('doctor_id', doctorId)
      .order('submitted_date', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// POST /api/leave-requests - Submit a new leave request
router.post('/', async (req, res) => {
  try {
    const { doctor_id, start_date, end_date, leave_type, reason } = req.body;

    // Validate required fields
    if (!doctor_id || !start_date || !end_date || !leave_type || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (endDate < startDate) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    // Calculate number of days
    const daysDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Insert leave request
    const { data: leaveRequest, error: insertError } = await supabase
      .from('leave_requests')
      .insert({
        doctor_id,
        start_date,
        end_date,
        leave_type,
        reason,
        status: 'Pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update leave balance (increment pending_days)
    const currentYear = new Date().getFullYear();
    
    // First, check if balance exists
    const { data: existingBalance } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('doctor_id', doctor_id)
      .eq('year', currentYear)
      .single();

    if (existingBalance) {
      // Update existing balance
      const { error: updateError } = await supabase
        .from('leave_balances')
        .update({
          pending_days: existingBalance.pending_days + daysDifference,
          remaining_days: existingBalance.remaining_days - daysDifference
        })
        .eq('id', existingBalance.id);

      if (updateError) throw updateError;
    } else {
      // Create new balance record
      const { error: createError } = await supabase
        .from('leave_balances')
        .insert({
          doctor_id,
          total_annual_days: 20,
          used_days: 0,
          pending_days: daysDifference,
          remaining_days: 20 - daysDifference,
          year: currentYear
        });

      if (createError) throw createError;
    }

    res.status(201).json({ 
      message: 'Leave request submitted successfully',
      data: leaveRequest 
    });
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// DELETE /api/leave-requests/:requestId - Cancel a pending leave request
router.delete('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get the leave request details first
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending requests can be cancelled' });
    }

    // Calculate days to restore
    const startDate = new Date(leaveRequest.start_date);
    const endDate = new Date(leaveRequest.end_date);
    const daysDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Delete the leave request
    const { error: deleteError } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) throw deleteError;

    // Update leave balance (decrement pending_days, increment remaining_days)
    const currentYear = new Date().getFullYear();
    
    const { data: balance } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('doctor_id', leaveRequest.doctor_id)
      .eq('year', currentYear)
      .single();

    if (balance) {
      const { error: updateError } = await supabase
        .from('leave_balances')
        .update({
          pending_days: Math.max(0, balance.pending_days - daysDifference),
          remaining_days: balance.remaining_days + daysDifference
        })
        .eq('id', balance.id);

      if (updateError) throw updateError;
    }

    res.json({ message: 'Leave request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
});

export default router;
