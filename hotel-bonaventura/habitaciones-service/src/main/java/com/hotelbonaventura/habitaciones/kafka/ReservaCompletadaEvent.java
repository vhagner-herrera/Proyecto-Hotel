package com.hotelbonaventura.habitaciones.kafka;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Vista parcial del evento publicado por reservas-service.
 * Solo se mapean los campos que este servicio necesita para marcar
 * la habitacion como OCUPADA; el resto del JSON se ignora.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaCompletadaEvent {
    private UUID idReserva;
    private String codigoReserva;
    private UUID idHabitacion;
    private String numeroHabitacion;
}
