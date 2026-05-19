package com.hotelbonaventura.habitaciones.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class CambioEstadoResponseDTO {
    private UUID id;
    private String numero;
    private String estado;
    private String message;
}
