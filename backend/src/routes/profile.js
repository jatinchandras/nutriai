// src/routes/profile.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/clients.js';

const router = Router();

function calcTDEE(profile) {
  const { age, sex, weight_kg, height_cm, activity_level, goal_adjustment } = profile;
  if (!age || !weight_kg || !height_cm) return null;

  // Mifflin-St Jeor BMR
  let bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  bmr += sex === 'male' ? 5 : -161;

  const tdee = Math.round(bmr * (activity_level || 1.55));
  const target = tdee + (goal_adjustment || 0);

  // Macro targets: 30% protein, 40% carbs, 30% fat
  const protein_goal_g = Math.round((target * 0.30) / 4);
  const carbs_goal_g = Math.round((target * 0.40) / 4);
  const fat_goal_g = Math.round((target * 0.30) / 9);

  return { tdee, target, protein_goal_g, carbs_goal_g, fat_goal_g };
}

// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(500).json({ error: 'Failed to fetch profile' });
  return res.json({ success: true, profile: data });
});

// PUT /api/profile
router.put('/', requireAuth, async (req, res) => {
  const {
    age, sex, weight_kg, height_cm,
    activity_level, goal_adjustment, maintenance_calories
  } = req.body;

  const updates = {
    updated_at: new Date().toISOString(),
  };

  if (age) updates.age = parseInt(age);
  if (sex) updates.sex = sex;
  if (weight_kg) updates.weight_kg = parseFloat(weight_kg);
  if (height_cm) updates.height_cm = parseFloat(height_cm);
  if (activity_level) updates.activity_level = parseFloat(activity_level);
  if (goal_adjustment !== undefined) updates.goal_adjustment = parseInt(goal_adjustment);

  // Recalculate TDEE if we have enough data
  const fullProfile = { age, sex, weight_kg, height_cm, activity_level, goal_adjustment };
  const computed = calcTDEE(fullProfile);

  if (computed) {
    // Use manual override if provided, otherwise use computed
    updates.maintenance_calories = maintenance_calories
      ? parseInt(maintenance_calories)
      : computed.target;
    updates.protein_goal_g = computed.protein_goal_g;
    updates.carbs_goal_g = computed.carbs_goal_g;
    updates.fat_goal_g = computed.fat_goal_g;
  } else if (maintenance_calories) {
    updates.maintenance_calories = parseInt(maintenance_calories);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }

  return res.json({ success: true, profile: data, computed });
});

export default router;
