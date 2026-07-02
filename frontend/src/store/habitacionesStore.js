import { create } from 'zustand';
import { getHabitaciones } from '../api/habitaciones.api';

const STALE_MS = 120_000; // 2 minutos

const useHabitacionesStore = create((set, get) => ({
  habitaciones: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchHabitaciones: async (force = false) => {
    const { lastFetched, loading } = get();
    if (loading) return;
    if (!force && lastFetched && Date.now() - lastFetched < STALE_MS) return;

    set({ loading: true, error: null });
    try {
      const res = await getHabitaciones();
      set({ habitaciones: res.data, lastFetched: Date.now() });
    } catch {
      set({ error: 'Error al cargar las habitaciones' });
    } finally {
      set({ loading: false });
    }
  },

  invalidate: () => set({ lastFetched: null }),
}));

export default useHabitacionesStore;
