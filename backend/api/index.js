// api/index.js — Vercel Serverless Entry Point
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import foodRoutes from '../src/routes/food.js';
import workoutRoutes from '../src/routes/workout.js';
import profileRoutes from '../src/routes/profile.js';

const app = express();

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// Rate limiting — protect AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,                   // 60 AI calls per user per 15 min
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/profile', profileRoutes);
app.use('/api/food', aiLimiter, foodRoutes);
app.use('/api/workout', aiLimiter, workoutRoutes);

// 404 fallback
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Local dev server ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`NutriAI API running at http://localhost:${PORT}`);
  });
}

// Vercel serverless export
export default app;
