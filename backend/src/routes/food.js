// src/routes/food.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase, groq } from '../lib/clients.js';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const router = Router();

// POST /api/food/estimate — AI estimates macros from description
router.post('/estimate', requireAuth, async (req, res) => {
  const { description } = req.body;
  if (!description || description.trim().length < 3) {
    return res.status(400).json({ error: 'Please provide a food description' });
  }
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 512,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a precise nutrition estimator. Respond ONLY with a valid JSON object.
Format: { "name": "concise meal name max 60 chars", "calories": integer, "protein_g": number 1 decimal, "carbs_g": number 1 decimal, "fat_g": number 1 decimal, "confidence": "high" or "medium" or "low", "note": "one sentence about accuracy or assumptions" }
Rules: Be accurate. Use exact weights when given. Estimate sensible portions otherwise.`
        },
        { role: 'user', content: `Estimate nutrition for: ${description.trim()}` }
      ]
    });
    const result = JSON.parse(completion.choices[0].message.content.trim());
    if (!result.calories || !result.name) throw new Error('Invalid AI response');
    return res.json({ success: true, estimate: result });
  } catch (err) {
    console.error('Food estimate error:', err);
    return res.status(500).json({ error: 'Failed to estimate nutrition. Please try again.' });
  }
});

// POST /api/food — save entry
router.post('/', requireAuth, async (req, res) => {
  const { name, description, calories, protein_g, carbs_g, fat_g, confidence, ai_note, log_date } = req.body;
  if (!name || !calories) return res.status(400).json({ error: 'name and calories are required' });
  const { data, error } = await supabase.from('food_logs').insert({
    user_id: req.user.id,
    log_date: log_date || new Date().toISOString().split('T')[0],
    name, description,
    calories: Math.round(calories),
    protein_g: protein_g || 0, carbs_g: carbs_g || 0, fat_g: fat_g || 0,
    confidence, ai_note
  }).select().single();
  if (error) { console.error(error); return res.status(500).json({ error: 'Failed to save' }); }
  return res.status(201).json({ success: true, entry: data });
});

// GET /api/food?date=YYYY-MM-DD
router.get('/', requireAuth, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('food_logs').select('*')
    .eq('user_id', req.user.id).eq('log_date', date).order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: 'Failed to fetch' });
  return res.json({ success: true, entries: data });
});

// DELETE /api/food/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('food_logs').delete()
    .eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: 'Failed to delete' });
  return res.json({ success: true });
});

export default router;
