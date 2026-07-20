package com.hotelbonaventura.reservas.util;

import com.hotelbonaventura.reservas.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Slf4j
@RequiredArgsConstructor
public class CodigoReservaGenerator {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyMMdd");
    private static final int MAX_INTENTOS = 10;

    private final ReservaRepository reservaRepository;

    public String generar() {
        for (int intento = 0; intento < MAX_INTENTOS; intento++) {
            String codigo = generarCodigo();
            if (!reservaRepository.existsByCodigoReserva(codigo)) {
                log.debug("Código de reserva generado: {}", codigo);
                return codigo;
            }
        }
        throw new IllegalStateException("No se pudo generar un código de reserva único");
    }

    private String generarCodigo() {
        String fecha = LocalDate.now().format(FORMATTER);
        String sufijo = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
        return "RES-" + fecha + "-" + sufijo;
    }
}
