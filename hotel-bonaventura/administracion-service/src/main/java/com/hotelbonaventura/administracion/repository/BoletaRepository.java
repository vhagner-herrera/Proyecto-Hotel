package com.hotelbonaventura.administracion.repository;

import com.hotelbonaventura.administracion.entity.Boleta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BoletaRepository extends JpaRepository<Boleta, UUID> {

    @Query(value = "SELECT SUM(importe_total) FROM hotel_pagos.boletas " +
                   "WHERE fecha_emision BETWEEN :inicio AND :fin", nativeQuery = true)
    BigDecimal calcularIngresosPorPeriodo(@Param("inicio") LocalDateTime inicio,
                                          @Param("fin") LocalDateTime fin);

    @Query(value = "SELECT COUNT(*) FROM hotel_pagos.boletas " +
                   "WHERE fecha_emision BETWEEN :inicio AND :fin", nativeQuery = true)
    long contarBoletasPorPeriodo(@Param("inicio") LocalDateTime inicio,
                                 @Param("fin") LocalDateTime fin);

    @Query(value = "SELECT DATE(fecha_emision) as fecha, " +
                   "SUM(importe_total) as ingresos, " +
                   "COUNT(*) as boletas " +
                   "FROM hotel_pagos.boletas " +
                   "WHERE fecha_emision BETWEEN :inicio AND :fin " +
                   "GROUP BY DATE(fecha_emision) " +
                   "ORDER BY fecha", nativeQuery = true)
    List<Object[]> obtenerIngresosPorDia(@Param("inicio") LocalDateTime inicio,
                                         @Param("fin") LocalDateTime fin);
}
