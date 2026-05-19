package com.hotelbonaventura.administracion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PeriodoDTO {
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
}
