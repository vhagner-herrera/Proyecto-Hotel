package com.hotelbonaventura.habitaciones.kafka;

import com.hotelbonaventura.habitaciones.service.HabitacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class ReservaCompletadaListener {

    private final HabitacionService habitacionService;

    /** El group-id viene de spring.kafka.consumer.group-id (application.yml). */
    @KafkaListener(topics = "reserva-completada-topic")
    public void onReservaCompletada(ReservaCompletadaEvent event) {
        log.info("📥 Evento recibido en habitaciones-service: Reserva {} completada para habitación {}", 
                event.getCodigoReserva(), event.getNumeroHabitacion());
        
        try {
            habitacionService.marcarComoOcupada(event.getIdHabitacion());
            log.info("✅ Habitación {} marcada como OCUPADA", event.getNumeroHabitacion());
        } catch (Exception e) {
            log.error("❌ Error marcando habitación como ocupada: {}", e.getMessage(), e);
        }
    }
}
