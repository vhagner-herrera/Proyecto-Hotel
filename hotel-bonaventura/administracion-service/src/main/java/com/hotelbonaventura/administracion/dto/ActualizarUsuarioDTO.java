package com.hotelbonaventura.administracion.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActualizarUsuarioDTO {

    @Size(max = 100, message = "Nombre muy largo")
    private String nombre;

    @Pattern(regexp = "ADMINISTRADOR|RECEPCIONISTA", message = "Rol inválido")
    private String rol;
}
