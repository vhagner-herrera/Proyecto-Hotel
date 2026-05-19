import { create } from 'zustand';

const useReservasStore = create((set) => ({
  reservas: [],
  reservaActual: null,
  loading: false,
  error: null,
  setReservas: (reservas) => set({ reservas }),
  setReservaActual: (reservaActual) => set({ reservaActual }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export default useReservasStore;
