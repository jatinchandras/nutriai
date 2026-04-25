// src/lib/clients.js
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import 'dotenv/config';

if (!process.env.SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
if (!process.env.GROQ_API_KEY) throw new Error('Missing GROQ_API_KEY');

// Service-role client — bypasses RLS for backend operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Groq client — free tier: 14,400 requests/day, 30 req/min on llama-3.3-70b
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
