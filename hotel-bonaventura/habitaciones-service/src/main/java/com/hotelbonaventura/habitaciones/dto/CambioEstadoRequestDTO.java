package com.hotelbonaventura.habitaciones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CambioEstadoRequestDTO {

    @NotBlank(message = "El estado es obligatorio")
    @Pattern(regexp = "DISPONIBLE|OCUPADA|MANTENIMIENTO", message = "Estado invalido. Valores permitidos: DISPONIBLE, OCUPADA, MANTENIMIENTO")
    private String estado;
}
