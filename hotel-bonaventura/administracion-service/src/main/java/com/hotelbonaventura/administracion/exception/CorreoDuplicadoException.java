package com.hotelbonaventura.administracion.exception;

/** Se lanza al intentar crear un usuario con un correo ya registrado (HTTP 409). */
public class CorreoDuplicadoException extends RuntimeException {
    public CorreoDuplicadoException(String message) {
        super(message);
    }
}
