package com.hotelbonaventura.administracion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "hotel_pagos", name = "boletas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Immutable
public class Boleta {

    @Id
    private UUID id;

    @Column(name = "id_reserva")
    private UUID idReserva;

    @Column(name = "base_imponible")
    private BigDecimal baseImponible;

    @Column(name = "igv")
    private BigDecimal igv;

    @Column(name = "importe_total")
    private BigDecimal importeTotal;

    @Column(name = "fecha_emision")
    private LocalDateTime fechaEmision;
}
