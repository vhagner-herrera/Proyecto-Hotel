package com.hotelbonaventura.reservas.kafka;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaCompletadaEvent {

    private UUID idReserva;
    private String codigoReserva;
    private UUID idHabitacion;
    private String numeroHabitacion;
    private String tipoHabitacion;
    private BigDecimal precioPorNoche;
    private String clienteDocumento;
    private String clienteNombreCompleto;
    private Integer clienteEdad;
    private String clienteCelular;
    private LocalDate fechaCheckin;
    private LocalDate fechaCheckout;
    private Integer cantidadNoches;
    private BigDecimal montoTotal;
    private String metodoPago;
    private LocalDateTime timestamp;
}
