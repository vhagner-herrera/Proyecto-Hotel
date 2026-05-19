package com.hotelbonaventura.administracion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReporteIngresosDTO {
    private PeriodoDTO periodo;
    private BigDecimal totalIngresos;
    private BigDecimal totalBaseImponible;
    private BigDecimal totalIGV;
    private Long cantidadBoletas;
    private List<IngresosPorDiaDTO> detallesPorDia;
}
