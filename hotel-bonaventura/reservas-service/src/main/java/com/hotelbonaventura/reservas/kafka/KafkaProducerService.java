package com.hotelbonaventura.reservas.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaProducerService {

    private static final String TOPIC = "reserva-completada-topic";

    /**
     * Mapper propio con fechas ISO: Spring Boot 4 usa Jackson 3 y ya no
     * expone un bean ObjectMapper de Jackson 2 para inyectar.
     */
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publicarReservaCompletada(ReservaCompletadaEvent event) {
        String json;
        try {
            json = MAPPER.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            log.error("❌ Error serializando evento para reserva {}: {}",
                    event.getCodigoReserva(), e.getMessage(), e);
            return;
        }

        // send() es asincrono: el resultado (exito o fallo del broker) se loguea en el callback
        kafkaTemplate.send(TOPIC, event.getIdReserva().toString(), json)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("❌ Fallo publicando evento Kafka para reserva {}: {}",
                                event.getCodigoReserva(), ex.getMessage(), ex);
                    } else {
                        log.info("📤 Evento publicado en Kafka: reserva={} habitacion={}",
                                event.getCodigoReserva(), event.getNumeroHabitacion());
                    }
                });
    }
}
