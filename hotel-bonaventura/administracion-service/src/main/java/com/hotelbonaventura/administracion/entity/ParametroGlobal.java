package com.hotelbonaventura.administracion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(schema = "hotel_administracion", name = "parametros_globales")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParametroGlobal {

    @Id
    @Column(name = "clave", length = 50)
    private String clave;

    @Column(name = "valor", columnDefinition = "TEXT", nullable = false)
    private String valor;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
