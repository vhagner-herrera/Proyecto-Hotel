import { useEffect } from 'react';
import useHabitacionesStore from '../store/habitacionesStore';
import { getHabitaciones } from '../api/habitaciones.api';

export function useHabitaciones() {
  const { habitaciones, loading, error, setHabitaciones, setLoading, setError } = useHabitacionesStore();

  useEffect(() => {
    setLoading(true);
    getHabitaciones()
      .then(({ data }) => setHabitaciones(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { habitaciones, loading, error };
}
