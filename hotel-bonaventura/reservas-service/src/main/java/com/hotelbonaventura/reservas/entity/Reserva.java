package com.hotelbonaventura.reservas.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "hotel_reservas", name = "reservas", uniqueConstraints = {
    @UniqueConstraint(columnNames = "codigo_reserva")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reserva {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "id_habitacion", nullable = false)
    private UUID idHabitacion;

    @Column(name = "nombre_huesped", nullable = false)
    private String nombreHuesped;

    @Column(name = "documento_huesped", nullable = false)
    private String documentoHuesped;

    @Column(name = "codigo_reserva", length = 30, nullable = false, unique = true)
    private String codigoReserva;

    @Column(name = "cliente_dni", length = 8, nullable = false)
    private String clienteDni;

    @Column(name = "cliente_nombre_completo", length = 250, nullable = false)
    private String clienteNombreCompleto;

    @Column(name = "fecha_checkin", nullable = false)
    private LocalDate fechaCheckin;

    @Column(name = "fecha_checkout", nullable = false)
    private LocalDate fechaCheckout;

    @Column(name = "cantidad_noches", nullable = false)
    private Integer cantidadNoches;

    @Column(name = "numero_habitacion", length = 10)
    private String numeroHabitacion;

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
