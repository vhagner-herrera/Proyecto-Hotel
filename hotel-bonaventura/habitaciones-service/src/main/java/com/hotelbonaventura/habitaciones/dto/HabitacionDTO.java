package com.hotelbonaventura.habitaciones.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HabitacionDTO {
    private UUID id;
    private String numero;
    private String tipo;
    private BigDecimal precioPorNoche;
    private String estado;
}
