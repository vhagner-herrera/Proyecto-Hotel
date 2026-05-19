package com.hotelbonaventura.reservas.repository;

import com.hotelbonaventura.reservas.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

    Optional<Reserva> findByCodigoReserva(String codigoReserva);

    List<Reserva> findByClienteDni(String clienteDni);

    boolean existsByCodigoReserva(String codigoReserva);

    List<Reserva> findAllByOrderByCreatedAtDesc();
}
