package com.hotelbonaventura.reservas.service.impl;

import com.hotelbonaventura.reservas.dto.CheckinRequestDTO;
import com.hotelbonaventura.reservas.dto.CheckinResponseDTO;
import com.hotelbonaventura.reservas.dto.ReservaDTO;
import com.hotelbonaventura.reservas.entity.Habitacion;
import com.hotelbonaventura.reservas.entity.Reserva;
import com.hotelbonaventura.reservas.exception.HabitacionNoDisponibleException;
import com.hotelbonaventura.reservas.exception.ReservaException;
import com.hotelbonaventura.reservas.kafka.KafkaProducerService;
import com.hotelbonaventura.reservas.kafka.ReservaCompletadaEvent;
import com.hotelbonaventura.reservas.mapper.ReservaMapper;
import com.hotelbonaventura.reservas.repository.HabitacionRepository;
import com.hotelbonaventura.reservas.repository.ReservaRepository;
import com.hotelbonaventura.reservas.service.ReservaService;
import com.hotelbonaventura.reservas.util.CodigoReservaGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReservaServiceImpl implements ReservaService {

    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final KafkaProducerService kafkaProducerService;
    private final CodigoReservaGenerator codigoGenerator;
    private final ReservaMapper reservaMapper;

    @Override
    public CheckinResponseDTO procesarCheckin(CheckinRequestDTO request, String userEmail) {
        log.info("📥 Check-in solicitado por: {} - Habitación: {} - Documento: {}",
                 userEmail, request.getIdHabitacion(), request.getClienteDocumento());

        Habitacion habitacion = habitacionRepository.findById(request.getIdHabitacion())
            .orElseThrow(() -> new ReservaException("Habitación no encontrada"));

        if (!"DISPONIBLE".equals(habitacion.getEstado())) {
            throw new HabitacionNoDisponibleException(
                "La habitación " + habitacion.getNumero() +
                " no está disponible. Estado actual: " + habitacion.getEstado()
            );
        }

        if ("DNI".equals(request.getTipoDocumento())
                && !request.getClienteDocumento().matches("^[0-9]{8}$")) {
            throw new ReservaException("DNI debe tener exactamente 8 dígitos numéricos");
        }

        // Numero, tipo y precio se toman SIEMPRE de la BD, nunca del request:
        // un cliente malicioso podria enviar un precio adulterado.
        BigDecimal precioPorNoche = habitacion.getPrecioPorNoche();
        BigDecimal montoTotal = precioPorNoche
            .multiply(BigDecimal.valueOf(request.getCantidadNoches()));

        LocalDate fechaCheckin = LocalDate.now();
        LocalDate fechaCheckout = fechaCheckin.plusDays(request.getCantidadNoches());

        String codigoReserva = codigoGenerator.generar();

        Reserva reserva = new Reserva();
        reserva.setIdHabitacion(habitacion.getId());
        reserva.setNombreHuesped(request.getClienteNombreCompleto());
        reserva.setDocumentoHuesped(request.getClienteDocumento());
        reserva.setCodigoReserva(codigoReserva);
        reserva.setClienteDni(request.getClienteDocumento());
        reserva.setClienteNombreCompleto(request.getClienteNombreCompleto());
        reserva.setNumeroHabitacion(habitacion.getNumero());
        reserva.setFechaCheckin(fechaCheckin);
        reserva.setFechaCheckout(fechaCheckout);
        reserva.setCantidadNoches(request.getCantidadNoches());
        reserva.setEstado("CONFIRMADA");

        Reserva reservaGuardada = reservaRepository.save(reserva);

        log.info("✅ Reserva {} creada por {} - Habitación: {} - Total: {}",
                 codigoReserva, userEmail, habitacion.getNumero(), montoTotal);

        ReservaCompletadaEvent event = new ReservaCompletadaEvent(
            reservaGuardada.getId(),
            codigoReserva,
            habitacion.getId(),
            habitacion.getNumero(),
            habitacion.getTipo(),
            precioPorNoche,
            request.getClienteDocumento(),
            request.getClienteNombreCompleto(),
            request.getClienteEdad(),
            request.getClienteCelular(),
            fechaCheckin,
            fechaCheckout,
            request.getCantidadNoches(),
            montoTotal,
            request.getMetodoPago(),
            LocalDateTime.now()
        );

        kafkaProducerService.publicarReservaCompletada(event);

        return new CheckinResponseDTO(
            reservaGuardada.getId(),
            codigoReserva,
            request.getClienteDocumento(),
            request.getClienteNombreCompleto(),
            habitacion.getNumero(),
            fechaCheckin,
            fechaCheckout,
            request.getCantidadNoches(),
            montoTotal,
            "CONFIRMADA",
            "Reserva creada exitosamente. Procesando pago y boleta..."
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ReservaDTO obtenerReserva(UUID id) {
        Reserva reserva = reservaRepository.findById(id)
            .orElseThrow(() -> new ReservaException("Reserva no encontrada"));

        return reservaMapper.toDTO(reserva);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservaDTO> listarReservasPorCliente(String clienteDni) {
        List<Reserva> reservas = reservaRepository.findByClienteDni(clienteDni);
        return reservaMapper.toDTOList(reservas);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservaDTO> listarTodas() {
        List<Reserva> reservas = reservaRepository.findAllByOrderByCreatedAtDesc();
        log.info("📋 Listando {} reservas", reservas.size());
        return reservaMapper.toDTOList(reservas);
    }
}
