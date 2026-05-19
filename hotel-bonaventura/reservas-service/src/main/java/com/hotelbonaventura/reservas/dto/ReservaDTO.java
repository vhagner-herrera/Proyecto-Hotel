package com.hotelbonaventura.reservas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaDTO {

    private UUID id;
    private UUID idHabitacion;
    private String codigoReserva;
    private String clienteDni;
    private String clienteNombreCompleto;
    private String numeroHabitacion;
    private LocalDate fechaCheckin;
    private LocalDate fechaCheckout;
    private Integer cantidadNoches;
    private String estado;
}
