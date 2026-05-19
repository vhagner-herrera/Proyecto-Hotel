package com.hotelbonaventura.administracion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReporteOcupacionDTO {
    private Integer habitacionesTotales;
    private Integer habitacionesDisponibles;
    private Integer habitacionesOcupadas;
    private Integer habitacionesMantenimiento;
    private Double porcentajeOcupacion;
    private List<DetalleOcupacionDTO> detallesPorTipo;
}
