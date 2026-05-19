package com.hotelbonaventura.reservas.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad de solo lectura que mapea la tabla hotel_habitaciones.habitaciones.
 * Reservas-service solo CONSULTA esta tabla (cross-schema), nunca la modifica.
 */
@Entity
@Immutable
@Table(schema = "hotel_habitaciones", name = "habitaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Habitacion {

    @Id
    private UUID id;

    @Column(name = "numero", length = 2)
    private String numero;

    @Column(name = "tipo", length = 20)
    private String tipo;

    @Column(name = "precio_por_noche", precision = 10, scale = 2)
    private BigDecimal precioPorNoche;

    @Column(name = "estado", length = 20)
    private String estado;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
