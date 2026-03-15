import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const router = express.Router();
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET?.trim() || process.env.JWT_SECRET?.trim();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user is a doctor
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('email', email)
      .single();

    console.log('Doctor lookup:', { email, found: !!doctor, error: doctorError?.message });

    if (doctor && !doctorError) {
      console.log('Doctor found, verifying password...');
      // Verify password
      const isValidPassword = await bcrypt.compare(password, doctor.password_hash);
      console.log('Password valid:', isValidPassword);
      
      if (isValidPassword) {
        // Generate JWT token
        const token = jwt.sign(
          { id: doctor.id, email: doctor.email, type: 'doctor' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          userType: 'doctor',
          token,
          user: {
            id: doctor.id,
            email: doctor.email,
            firstName: doctor.first_name,
            lastName: doctor.last_name,
            phone: doctor.phone,
            specialization: doctor.specialization
          }
        });
      }
    }

    // Check if user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    console.log('Admin lookup:', { email, found: !!admin, error: adminError?.message });

    if (admin && !adminError) {
      console.log('Admin found, verifying password...');
      console.log('Stored hash:', admin.password_hash?.substring(0, 20) + '...');
      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      console.log('Password valid:', isValidPassword);
      
      if (isValidPassword) {
        // Generate JWT token
        const token = jwt.sign(
          { id: admin.id, email: admin.email, type: 'admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          userType: 'admin',
          token,
          user: {
            id: admin.id,
            email: admin.email,
            firstName: admin.first_name,
            lastName: admin.last_name,
            phone: admin.phone,
            role: admin.role
          }
        });
      }
    }

    // If we get here, credentials are invalid
    return res.status(401).json({ error: 'Invalid email or password' });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    return res.json({
      success: true,
      user: decoded
    });

  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Update profile endpoint
router.put('/update-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { firstName, lastName, email, phone, specialization, role } = req.body;

    // Determine if user is doctor or admin
    let table = decoded.type === 'admin' ? 'admins' : 'doctors';
    
    // Build update object based on user type
    let updateData = {
      first_name: firstName,
      last_name: lastName,
      email: email
    };

    // Only add phone if it's provided
    if (phone) {
      updateData.phone = phone;
    }

    // Add specialization for doctors, role for admins
    if (decoded.type === 'doctor') {
      updateData.specialization = specialization;
    } else {
      updateData.role = role;
    }

    console.log('Update data:', updateData);
    console.log('Table:', table);
    console.log('Decoded ID:', decoded.id);

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', decoded.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      return res.status(500).json({ error: 'Failed to update profile', details: error.message, code: error.code });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        specialization: updatedUser.specialization || updatedUser.role
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Change password endpoint
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Determine if user is doctor or admin
    let table = decoded.type === 'admin' ? 'admins' : 'doctors';
    
    // Get current user
    const { data: user, error: userError } = await supabase
      .from(table)
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (userError || !user) {
      return res.status(500).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { data: updatedUser, error } = await supabase
      .from(table)
      .update({ password_hash: hashedPassword })
      .eq('id', decoded.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to change password', details: error });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
