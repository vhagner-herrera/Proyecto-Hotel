package com.hotelbonaventura.administracion.repository;

import com.hotelbonaventura.administracion.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

    @Query(value = "SELECT COUNT(*) FROM hotel_reservas.reservas " +
                   "WHERE created_at BETWEEN :inicio AND :fin", nativeQuery = true)
    long contarReservasPorPeriodo(@Param("inicio") LocalDateTime inicio,
                                  @Param("fin") LocalDateTime fin);
}
