import { create } from 'zustand';

const useHabitacionesStore = create((set) => ({
  habitaciones: [],
  loading: false,
  error: null,
  setHabitaciones: (habitaciones) => set({ habitaciones }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export default useHabitacionesStore;
