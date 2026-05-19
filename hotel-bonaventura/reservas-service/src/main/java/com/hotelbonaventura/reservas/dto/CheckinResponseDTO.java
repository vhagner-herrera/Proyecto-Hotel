package com.hotelbonaventura.reservas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckinResponseDTO {

    private UUID id;
    private String codigoReserva;
    private String clienteDocumento;
    private String clienteNombreCompleto;
    private String numeroHabitacion;
    private LocalDate fechaCheckin;
    private LocalDate fechaCheckout;
    private Integer cantidadNoches;
    private BigDecimal montoTotal;
    private String estado;
    private String mensaje;
}
