package com.hotelbonaventura.administracion.repository;

import com.hotelbonaventura.administracion.entity.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface HabitacionRepository extends JpaRepository<Habitacion, UUID> {
    long countByEstado(String estado);

    @Query(value = "SELECT tipo, " +
                   "COUNT(*) as total, " +
                   "SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles, " +
                   "SUM(CASE WHEN estado = 'OCUPADA' THEN 1 ELSE 0 END) as ocupadas " +
                   "FROM hotel_habitaciones.habitaciones " +
                   "GROUP BY tipo", nativeQuery = true)
    List<Object[]> obtenerEstadisticasPorTipo();
}
