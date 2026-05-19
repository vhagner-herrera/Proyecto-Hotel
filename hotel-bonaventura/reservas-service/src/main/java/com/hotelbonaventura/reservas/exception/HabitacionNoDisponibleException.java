package com.hotelbonaventura.reservas.exception;

public class HabitacionNoDisponibleException extends RuntimeException {

    public HabitacionNoDisponibleException(String mensaje) {
        super(mensaje);
    }

    public HabitacionNoDisponibleException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }
}
