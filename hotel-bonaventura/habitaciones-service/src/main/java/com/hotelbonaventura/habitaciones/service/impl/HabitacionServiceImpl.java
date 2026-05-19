package com.hotelbonaventura.habitaciones.service.impl;

import com.hotelbonaventura.habitaciones.dto.ActualizarHabitacionRequestDTO;
import com.hotelbonaventura.habitaciones.dto.CambioEstadoResponseDTO;
import com.hotelbonaventura.habitaciones.dto.CrearHabitacionRequestDTO;
import com.hotelbonaventura.habitaciones.dto.HabitacionDTO;
import com.hotelbonaventura.habitaciones.entity.Habitacion;
import com.hotelbonaventura.habitaciones.exception.EstadoInvalidoException;
import com.hotelbonaventura.habitaciones.exception.HabitacionDuplicadaException;
import com.hotelbonaventura.habitaciones.exception.HabitacionNoEncontradaException;
import com.hotelbonaventura.habitaciones.mapper.HabitacionMapper;
import com.hotelbonaventura.habitaciones.repository.HabitacionRepository;
import com.hotelbonaventura.habitaciones.service.HabitacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HabitacionServiceImpl implements HabitacionService {

    private final HabitacionRepository habitacionRepository;
    private final HabitacionMapper habitacionMapper;

    @Override
    public List<HabitacionDTO> listarTodas() {
        List<Habitacion> habitaciones = habitacionRepository.findAllByOrderByNumeroAsc();
        log.info("Listando {} habitaciones", habitaciones.size());
        return habitacionMapper.toDTOList(habitaciones);
    }

    @Override
    public List<HabitacionDTO> listarDisponibles() {
        List<Habitacion> disponibles = habitacionRepository.findByEstadoOrderByNumeroAsc("DISPONIBLE");
        log.info("Habitaciones disponibles: {}", disponibles.size());
        return habitacionMapper.toDTOList(disponibles);
    }

    @Override
    public List<HabitacionDTO> listarPorEstado(String estado) {
        String estadoUpper = estado.toUpperCase();
        validarEstado(estadoUpper);
        List<Habitacion> habitaciones = habitacionRepository.findByEstadoOrderByNumeroAsc(estadoUpper);
        log.info("Habitaciones con estado {}: {}", estadoUpper, habitaciones.size());
        return habitacionMapper.toDTOList(habitaciones);
    }

    @Override
    @Transactional
    public CambioEstadoResponseDTO cambiarEstado(UUID id, String nuevoEstado, String userRole) {
        String estadoUpper = nuevoEstado.toUpperCase();

        if ("OCUPADA".equals(estadoUpper)) {
            throw new EstadoInvalidoException(
                    "El estado OCUPADA solo puede ser asignado automaticamente al completarse una reserva.");
        }

        if ("MANTENIMIENTO".equals(estadoUpper) && !"ADMINISTRADOR".equalsIgnoreCase(userRole)) {
            throw new EstadoInvalidoException(
                    "Solo un ADMINISTRADOR puede cambiar el estado a MANTENIMIENTO.");
        }

        Habitacion habitacion = habitacionRepository.findById(id)
                .orElseThrow(() -> new HabitacionNoEncontradaException(
                        "Habitacion no encontrada con id: " + id));

        String estadoAnterior = habitacion.getEstado();
        habitacion.setEstado(estadoUpper);
        habitacionRepository.save(habitacion);

        log.info("Habitacion {} cambio de estado: {} -> {} | rol: {}",
                habitacion.getNumero(), estadoAnterior, estadoUpper, userRole);

        return new CambioEstadoResponseDTO(
                habitacion.getId(),
                habitacion.getNumero(),
                habitacion.getEstado(),
                "Estado actualizado correctamente"
        );
    }

    @Override
    @Transactional
    public void marcarComoOcupada(UUID idHabitacion) {
        Habitacion habitacion = habitacionRepository.findById(idHabitacion)
                .orElseThrow(() -> new HabitacionNoEncontradaException(
                        "Habitacion no encontrada con id: " + idHabitacion));

        if ("OCUPADA".equals(habitacion.getEstado())) {
            log.info("Habitacion {} ya estaba OCUPADA, evento ignorado (idempotencia)", habitacion.getNumero());
            return;
        }

        habitacion.setEstado("OCUPADA");
        habitacionRepository.save(habitacion);
        log.info("Habitacion {} marcada como OCUPADA via evento Kafka", habitacion.getNumero());
    }

    @Override
    public HabitacionDTO obtenerHabitacion(UUID id) {
        Habitacion habitacion = habitacionRepository.findById(id)
                .orElseThrow(() -> new HabitacionNoEncontradaException(
                        "Habitacion no encontrada con id: " + id));
        return habitacionMapper.toDTO(habitacion);
    }

    @Override
    @Transactional
    public HabitacionDTO crearHabitacion(CrearHabitacionRequestDTO request) {
        habitacionRepository.findByNumero(request.getNumero()).ifPresent(h -> {
            throw new HabitacionDuplicadaException(
                    "Ya existe una habitacion con el numero: " + request.getNumero());
        });

        Habitacion habitacion = new Habitacion();
        habitacion.setNumero(request.getNumero());
        habitacion.setTipo(request.getTipo().toUpperCase());
        habitacion.setPrecioPorNoche(request.getPrecioPorNoche());
        habitacion.setEstado("DISPONIBLE");

        Habitacion saved = habitacionRepository.save(habitacion);
        log.info("Habitacion creada: numero={}, tipo={}, precio={}", saved.getNumero(), saved.getTipo(), saved.getPrecioPorNoche());
        return habitacionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public HabitacionDTO actualizarHabitacion(UUID id, ActualizarHabitacionRequestDTO request) {
        Habitacion habitacion = habitacionRepository.findById(id)
                .orElseThrow(() -> new HabitacionNoEncontradaException(
                        "Habitacion no encontrada con id: " + id));

        habitacion.setTipo(request.getTipo().toUpperCase());
        habitacion.setPrecioPorNoche(request.getPrecioPorNoche());

        if (request.getEstado() != null && !request.getEstado().isBlank()) {
            habitacion.setEstado(request.getEstado().toUpperCase());
        }

        Habitacion saved = habitacionRepository.save(habitacion);
        log.info("Habitacion {} actualizada: tipo={}, precio={}, estado={}",
                saved.getNumero(), saved.getTipo(), saved.getPrecioPorNoche(), saved.getEstado());
        return habitacionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public void eliminarHabitacion(UUID id) {
        Habitacion habitacion = habitacionRepository.findById(id)
                .orElseThrow(() -> new HabitacionNoEncontradaException(
                        "Habitacion no encontrada con id: " + id));

        if ("OCUPADA".equals(habitacion.getEstado())) {
            throw new EstadoInvalidoException(
                    "No se puede eliminar la habitacion " + habitacion.getNumero() + " porque esta ocupada.");
        }

        habitacionRepository.delete(habitacion);
        log.info("Habitacion {} eliminada", habitacion.getNumero());
    }

    private void validarEstado(String estado) {
        if (!estado.matches("DISPONIBLE|OCUPADA|MANTENIMIENTO")) {
            throw new EstadoInvalidoException(
                    "Estado invalido: '" + estado + "'. Valores permitidos: DISPONIBLE, OCUPADA, MANTENIMIENTO");
        }
    }
}
