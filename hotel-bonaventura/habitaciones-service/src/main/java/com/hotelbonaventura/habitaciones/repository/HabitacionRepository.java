package com.hotelbonaventura.habitaciones.repository;

import com.hotelbonaventura.habitaciones.entity.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitacionRepository extends JpaRepository<Habitacion, UUID> {

    List<Habitacion> findAllByOrderByNumeroAsc();

    List<Habitacion> findByEstadoOrderByNumeroAsc(String estado);

    Optional<Habitacion> findByNumero(String numero);
}
