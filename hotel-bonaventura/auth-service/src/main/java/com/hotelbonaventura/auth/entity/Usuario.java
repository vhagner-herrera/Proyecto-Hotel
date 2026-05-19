package com.hotelbonaventura.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Mapea la tabla hotel_auth.usuarios de Supabase.
 *
 * CRITICO: La tabla NO tiene columna updated_at.
 * Solo existe created_at. NO usar @PreUpdate ni mapear updated_at.
 *
 * ddl-auto=none: Hibernate no modifica el schema, solo lee.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(schema = "hotel_auth", name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 100)
    private String correo;

    /** Hash BCrypt almacenado en la BD. Nunca se expone en respuestas. */
    @Column(nullable = false, length = 255)
    private String contrasena;

    /** Valores esperados: ADMINISTRADOR, RECEPCIONISTA */
    @Column(nullable = false, length = 20)
    private String rol;

    /** Valores esperados: ACTIVO, INACTIVO */
    @Column(nullable = false, length = 15)
    private String estado;

    /** Solo existe created_at en la BD. NO hay updated_at. */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
