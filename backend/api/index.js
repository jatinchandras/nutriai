// api/index.js — Vercel Serverless Entry Point
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import foodRoutes from '../src/routes/food.js';
import workoutRoutes from '../src/routes/workout.js';
import profileRoutes from '../src/routes/profile.js';

const app = express();

// ── CORS — must come before everything else ───────────────────────
app.use(cors({
  origin: true,             // reflect the request origin — allows all for now
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Handle preflight OPTIONS requests immediately
app.options('*', cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json({ limit: '10kb' }));

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ name: 'NutriAI API', status: 'running', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/profile', profileRoutes);
app.use('/api/food', aiLimiter, foodRoutes);
app.use('/api/workout', aiLimiter, workoutRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Local dev only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`NutriAI API → http://localhost:${PORT}`));
}

export default app;
