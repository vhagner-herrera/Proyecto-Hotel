package com.hotelbonaventura.reservas.exception;

public class DniNoEncontradoException extends RuntimeException {

    public DniNoEncontradoException(String mensaje) {
        super(mensaje);
    }

    public DniNoEncontradoException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }
}
