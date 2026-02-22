import express from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get all staff members (doctors)
router.get('/', async (req, res) => {
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        id,
        email,
        first_name,
        last_name,
        specialization,
        phone,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch staff members', details: error });
    }

    // Transform data to match frontend expectations
    const staffMembers = doctors.map(doctor => ({
      id: doctor.id,
      name: `${doctor.first_name} ${doctor.last_name}`,
      role: doctor.specialization || 'Doctor',
      department: 'Not Assigned', // For now, since department_id doesn't exist
      status: 'Available', // Default status
      statusColor: 'green',
      email: doctor.email,
      phone: doctor.phone || '',
      shifts: 0, // This would need to be calculated from shifts table
      initials: `${doctor.first_name?.[0] || ''}${doctor.last_name?.[0] || ''}`.toUpperCase()
    }));

    res.json({ success: true, staff: staffMembers });
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new staff member
router.post('/', async (req, res) => {
  try {
    const { name, role, department, email, phone, status } = req.body;

    // Validate required fields
    if (!name || !role || !email) {
      return res.status(400).json({ error: 'Name, role, and email are required' });
    }

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate a temporary password (8 characters, alphanumeric)
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Insert new doctor
    const { data: newDoctor, error } = await supabase
      .from('doctors')
      .insert({
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        specialization: role,
        phone: phone || null
        // department_id and status will be added later when the schema is updated
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create staff member', details: error });
    }

    res.json({
      success: true,
      message: 'Staff member created successfully',
      staff: {
        id: newDoctor.id,
        name: `${newDoctor.first_name} ${newDoctor.last_name}`,
        role: newDoctor.specialization,
        department: 'Not Assigned',
        status: 'Available',
        email: newDoctor.email,
        phone: newDoctor.phone
      },
      temporaryPassword: temporaryPassword
    });
  } catch (err) {
    console.error('Error creating staff member:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete staff member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the doctor from the database
    const { data: deletedDoctor, error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to delete staff member', details: error });
    }

    if (!deletedDoctor) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({
      success: true,
      message: 'Staff member deleted successfully',
      staff: {
        id: deletedDoctor.id,
        name: `${deletedDoctor.first_name} ${deletedDoctor.last_name}`,
        email: deletedDoctor.email
      }
    });
  } catch (err) {
    console.error('Error deleting staff member:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;