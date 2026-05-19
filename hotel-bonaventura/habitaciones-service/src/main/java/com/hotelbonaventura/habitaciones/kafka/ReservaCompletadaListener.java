package com.hotelbonaventura.habitaciones.kafka;

import com.hotelbonaventura.habitaciones.service.HabitacionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ReservaCompletadaListener {

    @Autowired
    private HabitacionService habitacionService;

    @KafkaListener(topics = "reserva-completada-topic", groupId = "habitaciones-service-group")
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
