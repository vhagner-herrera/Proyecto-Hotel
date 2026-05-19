package com.hotelbonaventura.reservas.repository;

import com.hotelbonaventura.reservas.entity.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitacionRepository extends JpaRepository<Habitacion, UUID> {

    @Query(value = "SELECT * FROM hotel_habitaciones.habitaciones WHERE id = :id", nativeQuery = true)
    Optional<Habitacion> findById(@Param("id") UUID id);
}
