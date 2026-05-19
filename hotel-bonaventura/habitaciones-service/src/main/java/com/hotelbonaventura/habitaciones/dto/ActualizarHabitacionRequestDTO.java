package com.hotelbonaventura.habitaciones.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarHabitacionRequestDTO {

    @NotBlank(message = "El tipo es requerido")
    @Size(max = 20, message = "El tipo no puede tener mas de 20 caracteres")
    private String tipo;

    @NotNull(message = "El precio por noche es requerido")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
    private BigDecimal precioPorNoche;

    @Pattern(regexp = "DISPONIBLE|MANTENIMIENTO",
             message = "Estado invalido. Solo se permite DISPONIBLE o MANTENIMIENTO")
    private String estado;
}
