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
const PORT = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL?.trim();

// Middleware
const allowedOrigins = frontendUrl
  ? [frontendUrl, 'http://localhost:5173']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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

// Start server for local dev; Vercel uses the exported app
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

export default app;
