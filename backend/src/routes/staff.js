import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { sendTemporaryPasswordEmail } from '../services/emailService.js';

const router = express.Router();

// Normalize specialization to match frontend departments
const normalizeDepartment = (specialization) => {
  if (!specialization) return 'General';
  
  const normalized = specialization.toLowerCase().trim();
  
  // Mapping of specializations to display departments
  const departmentMap = {
    'cardiology': 'Cardiology',
    'emergency': 'Emergency',
    'emergency medicine': 'Emergency',
    'surgery': 'Surgery',
    'anesthesiology': 'Anesthesiology',
    'pediatrics': 'Pediatrics',
    'neurology': 'Neurology',
    'radiology': 'Radiology',
    'oncology': 'Oncology',
    'internal medicine': 'Internal Medicine'
  };
  
  return departmentMap[normalized] || specialization;
};

// Get all staff members (doctors)
router.get('/', async (req, res) => {
  try {
    // Try to fetch with department field, but fall back if it doesn't exist
    let { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        id,
        email,
        first_name,
        last_name,
        specialization,
        department,
        phone,
        created_at
      `)
      .order('created_at', { ascending: false });

    // If department field doesn't exist, fetch without it
    if (error && error.message && error.message.includes('department')) {
      const { data: doctorsWithoutDept, error: retryError } = await supabase
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
      
      if (retryError) {
        return res.status(500).json({ error: 'Failed to fetch staff members', details: retryError });
      }
      doctors = doctorsWithoutDept;
    } else if (error) {
      return res.status(500).json({ error: 'Failed to fetch staff members', details: error });
    }

    // Get current month's date range
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    
    // Calculate last day without timezone conversion issues
    const lastDayDate = new Date(year, month, 0); // Last day of current month
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

    console.log(`Fetching shifts for ${firstDay} to ${lastDay}`);

    // Fetch shift counts for all doctors for the current month
    const { data: shiftCounts, error: shiftsError } = await supabase
      .from('shifts')
      .select('doctor_id, shift_date')
      .gte('shift_date', firstDay)
      .lte('shift_date', lastDay)
      .eq('status', 'Confirmed');

    console.log('Shift counts query result:', shiftCounts?.length || 0, 'shifts found');
    if (shiftsError) {
      console.error('Error fetching shift counts:', shiftsError);
    }

    // Create a map of doctor_id to shift count
    const shiftCountMap = {};
    if (shiftCounts && !shiftsError) {
      shiftCounts.forEach(shift => {
        shiftCountMap[shift.doctor_id] = (shiftCountMap[shift.doctor_id] || 0) + 1;
      });
      console.log('Shift count map:', shiftCountMap);
    }

    // Transform data to match frontend expectations
    const staffMembers = doctors.map(doctor => ({
      id: doctor.id,
      name: `${doctor.first_name} ${doctor.last_name}`,
      role: doctor.specialization || 'Doctor',
      // Use stored department if available, otherwise normalize specialization
      department: doctor.department ? normalizeDepartment(doctor.department) : normalizeDepartment(doctor.specialization),
      status: 'Available', // Default status
      statusColor: 'green',
      email: doctor.email,
      phone: doctor.phone || '',
      shifts: shiftCountMap[doctor.id] || 0, // Get actual shift count for current month
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
    let { data: newDoctor, error } = await supabase
      .from('doctors')
      .insert({
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        specialization: role,
        department: department || role, // Store department, fallback to role/specialization
        phone: phone || null
      })
      .select()
      .single();

    // If department field doesn't exist, retry without it
    if (error && error.message && error.message.includes('department')) {
      const { data: doctorWithoutDept, error: retryError } = await supabase
        .from('doctors')
        .insert({
          email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          specialization: role,
          phone: phone || null
        })
        .select()
        .single();
      
      if (retryError) {
        console.error('Database error:', retryError);
        return res.status(500).json({ error: 'Failed to create staff member', details: retryError });
      }
      newDoctor = doctorWithoutDept;
    } else if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create staff member', details: error });
    }

    const fullName = `${newDoctor.first_name} ${newDoctor.last_name}`;
    
    // Send temporary password email automatically
    try {
      const emailResult = await sendTemporaryPasswordEmail(email, fullName, temporaryPassword);
      if (emailResult.success) {
        console.log('Email sent successfully to:', email);
      } else {
        console.warn('Failed to send email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    res.json({
      success: true,
      message: 'Staff member created successfully',
      staff: {
        id: newDoctor.id,
        name: fullName,
        role: newDoctor.specialization,
        department: normalizeDepartment(newDoctor.department || department || role),
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