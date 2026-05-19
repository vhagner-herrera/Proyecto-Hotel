package com.hotelbonaventura.reservas.util;

import com.hotelbonaventura.reservas.repository.ReservaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Random;

@Component
@Slf4j
public class CodigoReservaGenerator {

    private static final Random random = new Random();
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyMMdd");

    public String generar(ReservaRepository repo) {
        String codigo;
        int intentos = 0;
        int maxIntentos = 10;

        do {
            codigo = generarCodigo();
            intentos++;

            if (intentos > maxIntentos) {
                throw new RuntimeException("No se pudo generar un código de reserva único");
            }
        } while (repo.existsByCodigoReserva(codigo));

        log.info("✅ Código de reserva generado: {}", codigo);
        return codigo;
    }

    private String generarCodigo() {
        String fecha = LocalDate.now().format(formatter);
        String random6Digits = String.format("%06d", random.nextInt(1000000));
        return "RES-" + fecha + "-" + random6Digits;
    }
}
