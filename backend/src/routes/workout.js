// src/routes/workout.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase, groq } from '../lib/clients.js';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const router = Router();

// POST /api/workout/estimate — AI estimates calories burned
router.post('/estimate', requireAuth, async (req, res) => {
  const { description } = req.body;
  if (!description || description.trim().length < 3) {
    return res.status(400).json({ error: 'Please provide a workout description' });
  }
  const { data: profile } = await supabase.from('profiles').select('weight_kg').eq('id', req.user.id).single();
  const weight = profile?.weight_kg || 70;
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 512,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a precise exercise calorie estimator. The user weighs ${weight}kg.
Respond ONLY with a valid JSON object.
Format: { "name": "concise workout name max 60 chars", "calories_burned": integer, "duration_minutes": integer, "confidence": "high" or "medium" or "low", "note": "one sentence about method or assumptions" }
Use MET-based calculation: Calories = MET x weight_kg x hours. If heart rate or pace is given, use it for higher accuracy.`
        },
        { role: 'user', content: `Estimate calories burned for: ${description.trim()}` }
      ]
    });
    const result = JSON.parse(completion.choices[0].message.content.trim());
    if (!result.calories_burned || !result.name) throw new Error('Invalid AI response');
    return res.json({ success: true, estimate: result });
  } catch (err) {
    console.error('Workout estimate error:', err);
    return res.status(500).json({ error: 'Failed to estimate calories. Please try again.' });
  }
});

// POST /api/workout — save entry
router.post('/', requireAuth, async (req, res) => {
  const { name, description, calories_burned, duration_minutes, confidence, ai_note, log_date } = req.body;
  if (!name || !calories_burned) return res.status(400).json({ error: 'name and calories_burned are required' });
  const { data, error } = await supabase.from('workout_logs').insert({
    user_id: req.user.id,
    log_date: log_date || new Date().toISOString().split('T')[0],
    name, description,
    calories_burned: Math.round(calories_burned),
    duration_minutes, confidence, ai_note
  }).select().single();
  if (error) { console.error(error); return res.status(500).json({ error: 'Failed to save' }); }
  return res.status(201).json({ success: true, entry: data });
});

// GET /api/workout?date=YYYY-MM-DD
router.get('/', requireAuth, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('workout_logs').select('*')
    .eq('user_id', req.user.id).eq('log_date', date).order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: 'Failed to fetch' });
  return res.json({ success: true, entries: data });
});

// DELETE /api/workout/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('workout_logs').delete()
    .eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: 'Failed to delete' });
  return res.json({ success: true });
});

export default router;
