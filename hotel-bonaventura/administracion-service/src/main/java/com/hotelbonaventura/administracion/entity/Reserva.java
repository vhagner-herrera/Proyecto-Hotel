package com.hotelbonaventura.administracion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "hotel_reservas", name = "reservas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Immutable
public class Reserva {

    @Id
    private UUID id;

    @Column(name = "codigo_reserva")
    private String codigoReserva;

    @Column(name = "estado")
    private String estado;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
