// src/hooks/useLogs.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

export function useLogs(date) {
  const [foodLogs, setFoodLogs] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const [food, workout] = await Promise.all([
        api.food.list(date),
        api.workout.list(date),
      ]);
      setFoodLogs(food.entries || []);
      setWorkoutLogs(workout.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const deleteFood = async (id) => {
    await api.food.delete(id);
    setFoodLogs(prev => prev.filter(e => e.id !== id));
  };

  const deleteWorkout = async (id) => {
    await api.workout.delete(id);
    setWorkoutLogs(prev => prev.filter(e => e.id !== id));
  };

  const addFood = (entry) => {
    setFoodLogs(prev => [...prev, entry]);
  };

  const addWorkout = (entry) => {
    setWorkoutLogs(prev => [...prev, entry]);
  };

  // Derived totals
  const totals = {
    calories: foodLogs.reduce((s, e) => s + e.calories, 0),
    protein: foodLogs.reduce((s, e) => s + (e.protein_g || 0), 0),
    carbs: foodLogs.reduce((s, e) => s + (e.carbs_g || 0), 0),
    fat: foodLogs.reduce((s, e) => s + (e.fat_g || 0), 0),
    burned: workoutLogs.reduce((s, e) => s + e.calories_burned, 0),
  };

  return {
    foodLogs, workoutLogs,
    totals, loading, error,
    deleteFood, deleteWorkout,
    addFood, addWorkout,
    refetch: fetchLogs,
  };
}
