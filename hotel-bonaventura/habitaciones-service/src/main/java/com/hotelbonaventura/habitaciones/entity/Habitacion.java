package com.hotelbonaventura.habitaciones.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "hotel_habitaciones", name = "habitaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Habitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "numero", length = 2, unique = true, nullable = false)
    private String numero;

    @Column(name = "tipo", length = 20, nullable = false)
    private String tipo;

    @Column(name = "precio_por_noche", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioPorNoche;

    @Column(name = "estado", length = 20, nullable = false)
    private String estado;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
