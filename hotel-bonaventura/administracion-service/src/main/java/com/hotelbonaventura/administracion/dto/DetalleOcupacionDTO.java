package com.hotelbonaventura.administracion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DetalleOcupacionDTO {
    private String tipo;
    private Integer total;
    private Integer disponibles;
    private Integer ocupadas;
    private Double porcentajeOcupacion;
}
