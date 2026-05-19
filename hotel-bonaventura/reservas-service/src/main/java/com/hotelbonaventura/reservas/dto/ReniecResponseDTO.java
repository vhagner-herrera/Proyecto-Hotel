package com.hotelbonaventura.reservas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReniecResponseDTO {

    private String dni;
    private String nombreCompleto;
    private String primerNombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
}
