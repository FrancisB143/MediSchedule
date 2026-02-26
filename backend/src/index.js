import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import shiftsRoutes from './routes/shifts.js';
import shiftSwapRoutes from './routes/shift-swap.js';
import leaveRequestsRoutes from './routes/leave-requests.js';
import staffRoutes from './routes/staff.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/shift-swap', shiftSwapRoutes);
app.use('/api/leave-requests', leaveRequestsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DocTime Backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
