package com.hotelbonaventura.reservas.repository;

import com.hotelbonaventura.reservas.entity.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Consulta de solo lectura sobre hotel_habitaciones.habitaciones.
 * findById lo provee JpaRepository (la entidad ya mapea schema y tabla).
 */
@Repository
public interface HabitacionRepository extends JpaRepository<Habitacion, UUID> {
}
