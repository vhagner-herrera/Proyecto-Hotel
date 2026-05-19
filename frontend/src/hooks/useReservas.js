import { useEffect } from 'react';
import useReservasStore from '../store/reservasStore';
import { getReservas } from '../api/reservas.api';

export function useReservas() {
  const { reservas, loading, error, setReservas, setLoading, setError } = useReservasStore();

  useEffect(() => {
    setLoading(true);
    getReservas()
      .then(({ data }) => setReservas(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { reservas, loading, error };
}
