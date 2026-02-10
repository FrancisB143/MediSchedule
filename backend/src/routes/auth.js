import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const router = express.Router();

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
          process.env.SUPABASE_JWT_SECRET,
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
          process.env.SUPABASE_JWT_SECRET,
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

    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    
    return res.json({
      success: true,
      user: decoded
    });

  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
