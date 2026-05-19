package com.hotelbonaventura.reservas.kafka;

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

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publicarReservaCompletada(ReservaCompletadaEvent event) {
        try {
            String json = MAPPER.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, event.getIdReserva().toString(), json);
            log.info("📤 Evento publicado en Kafka: reserva={} habitacion={}",
                    event.getCodigoReserva(), event.getNumeroHabitacion());
        } catch (Exception e) {
            log.error("❌ Error publicando evento Kafka para reserva {}: {}",
                    event.getCodigoReserva(), e.getMessage(), e);
        }
    }
}
