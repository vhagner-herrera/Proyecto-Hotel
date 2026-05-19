package com.hotelbonaventura.administracion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardDTO {
    private BigDecimal ingresosMesActual;
    private Long reservasMesActual;
    private Integer habitacionesDisponibles;
    private Integer habitacionesOcupadas;
    private Double porcentajeOcupacion;
    private Long usuariosActivos;
    private Long boletasEmitidas;
    private BigDecimal promedioIngresosDiario;
}
