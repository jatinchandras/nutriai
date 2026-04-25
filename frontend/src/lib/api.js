// src/lib/api.js
import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function authFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json;
}

// ── Food ──────────────────────────────────────────────────────────
export const api = {
  food: {
    estimate: (description) =>
      authFetch('/food/estimate', {
        method: 'POST',
        body: JSON.stringify({ description }),
      }),
    save: (entry) =>
      authFetch('/food', {
        method: 'POST',
        body: JSON.stringify(entry),
      }),
    list: (date) =>
      authFetch(`/food?date=${date}`),
    delete: (id) =>
      authFetch(`/food/${id}`, { method: 'DELETE' }),
  },

  // ── Workout ──────────────────────────────────────────────────────
  workout: {
    estimate: (description) =>
      authFetch('/workout/estimate', {
        method: 'POST',
        body: JSON.stringify({ description }),
      }),
    save: (entry) =>
      authFetch('/workout', {
        method: 'POST',
        body: JSON.stringify(entry),
      }),
    list: (date) =>
      authFetch(`/workout?date=${date}`),
    delete: (id) =>
      authFetch(`/workout/${id}`, { method: 'DELETE' }),
  },

  // ── Profile ──────────────────────────────────────────────────────
  profile: {
    get: () => authFetch('/profile'),
    update: (data) =>
      authFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
