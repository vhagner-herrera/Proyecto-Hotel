package com.hotelbonaventura.administracion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UsuarioDTO {
    private UUID id;
    private String nombre;
    private String correo;
    private String rol;
    private String estado;
    private LocalDateTime createdAt;
}
