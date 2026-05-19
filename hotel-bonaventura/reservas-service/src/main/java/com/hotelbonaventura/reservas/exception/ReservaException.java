package com.hotelbonaventura.reservas.exception;

public class ReservaException extends RuntimeException {

    public ReservaException(String mensaje) {
        super(mensaje);
    }

    public ReservaException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }
}
