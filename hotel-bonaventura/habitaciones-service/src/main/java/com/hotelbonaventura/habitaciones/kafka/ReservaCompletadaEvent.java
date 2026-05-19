package com.hotelbonaventura.habitaciones.kafka;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaCompletadaEvent {
    private UUID idReserva;
    private String codigoReserva;
    private UUID idHabitacion;
    private String numeroHabitacion;
    private String clienteDni;
    private String clienteNombre;
    private LocalDate fechaCheckin;
    private LocalDate fechaCheckout;
    private Integer cantidadNoches;
    private BigDecimal montoTotal;
    private String metodoPago;
}
