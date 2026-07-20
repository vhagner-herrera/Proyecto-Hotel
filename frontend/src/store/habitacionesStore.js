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

  /**
   * Actualización optimista tras un check-in exitoso: marca la habitación
   * como OCUPADA en el cache local sin esperar al backend.
   * Se marca el cache como fresco a propósito: el cambio real llega por
   * Kafka con ~1s de retraso, y un refetch inmediato podría devolver
   * DISPONIBLE otra vez y pisar este estado. El polling periódico o la
   * siguiente visita reconcilian con el servidor.
   */
  marcarOcupada: (idHabitacion) =>
    set((state) => ({
      habitaciones: state.habitaciones.map((h) =>
        h.id === idHabitacion ? { ...h, estado: 'OCUPADA' } : h
      ),
      lastFetched: Date.now(),
    })),
}));

export default useHabitacionesStore;
