package com.hotelbonaventura.reservas.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckinRequestDTO {

    @NotNull(message = "ID de habitación es obligatorio")
    private UUID idHabitacion;

    @NotBlank(message = "Número de habitación es obligatorio")
    private String numeroHabitacion;

    @NotBlank(message = "Tipo de habitación es obligatorio")
    private String tipoHabitacion;

    @NotNull(message = "Precio por noche es obligatorio")
    @DecimalMin(value = "0.01", message = "Precio debe ser mayor a 0")
    private BigDecimal precioPorNoche;

    @NotBlank(message = "Tipo de documento es obligatorio")
    @Pattern(regexp = "DNI|CARNET_EXTRANJERIA", message = "Tipo de documento inválido")
    private String tipoDocumento;

    @NotBlank(message = "Número de documento es obligatorio")
    @Size(max = 15, message = "Documento muy largo")
    private String clienteDocumento;

    @NotBlank(message = "Nombre completo es obligatorio")
    @Size(max = 250, message = "Nombre muy largo")
    private String clienteNombreCompleto;

    @NotNull(message = "Edad es obligatoria")
    @Min(value = 1, message = "Edad mínima es 1")
    @Max(value = 120, message = "Edad máxima es 120")
    private Integer clienteEdad;

    @NotBlank(message = "Celular es obligatorio")
    @Pattern(regexp = "[0-9]{9,15}", message = "Celular inválido")
    private String clienteCelular;

    @NotNull(message = "Cantidad de noches es obligatoria")
    @Min(value = 1, message = "Mínimo 1 noche")
    private Integer cantidadNoches;

    @NotBlank(message = "Método de pago es obligatorio")
    @Pattern(regexp = "EFECTIVO|TARJETA", message = "Método de pago inválido")
    private String metodoPago;
}
