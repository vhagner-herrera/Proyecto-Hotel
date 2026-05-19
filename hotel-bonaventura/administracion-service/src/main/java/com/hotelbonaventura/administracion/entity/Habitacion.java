package com.hotelbonaventura.administracion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.util.UUID;

@Entity
@Table(schema = "hotel_habitaciones", name = "habitaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Immutable
public class Habitacion {

    @Id
    private UUID id;

    @Column(name = "numero")
    private String numero;

    @Column(name = "tipo")
    private String tipo;

    @Column(name = "estado")
    private String estado;
}
