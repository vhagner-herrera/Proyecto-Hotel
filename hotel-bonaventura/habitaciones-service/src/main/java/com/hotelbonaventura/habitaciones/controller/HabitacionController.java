package com.hotelbonaventura.habitaciones.controller;

import com.hotelbonaventura.habitaciones.dto.ActualizarHabitacionRequestDTO;
import com.hotelbonaventura.habitaciones.dto.CambioEstadoRequestDTO;
import com.hotelbonaventura.habitaciones.dto.CambioEstadoResponseDTO;
import com.hotelbonaventura.habitaciones.dto.CrearHabitacionRequestDTO;
import com.hotelbonaventura.habitaciones.dto.HabitacionDTO;
import com.hotelbonaventura.habitaciones.service.HabitacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/habitaciones")
@RequiredArgsConstructor
public class HabitacionController {

    private final HabitacionService habitacionService;

    @GetMapping
    public ResponseEntity<List<HabitacionDTO>> listarTodas() {
        return ResponseEntity.ok(habitacionService.listarTodas());
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<HabitacionDTO>> listarDisponibles() {
        return ResponseEntity.ok(habitacionService.listarDisponibles());
    }

    @GetMapping("/por-estado")
    public ResponseEntity<List<HabitacionDTO>> listarPorEstado(@RequestParam String estado) {
        return ResponseEntity.ok(habitacionService.listarPorEstado(estado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HabitacionDTO> obtenerHabitacion(@PathVariable UUID id) {
        return ResponseEntity.ok(habitacionService.obtenerHabitacion(id));
    }

    @PostMapping
    public ResponseEntity<HabitacionDTO> crearHabitacion(
            @Valid @RequestBody CrearHabitacionRequestDTO request) {
        log.info("Solicitud de creacion de habitacion: numero={}", request.getNumero());
        return ResponseEntity.status(HttpStatus.CREATED).body(habitacionService.crearHabitacion(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitacionDTO> actualizarHabitacion(
            @PathVariable UUID id,
            @Valid @RequestBody ActualizarHabitacionRequestDTO request) {
        log.info("Solicitud de actualizacion de habitacion: id={}", id);
        return ResponseEntity.ok(habitacionService.actualizarHabitacion(id, request));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<CambioEstadoResponseDTO> cambiarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody CambioEstadoRequestDTO request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        log.info("Cambio de estado solicitado para habitacion {} | usuario: {} | rol: {}",
                id, userEmail, userRole);

        CambioEstadoResponseDTO response = habitacionService.cambiarEstado(id, request.getEstado(), userRole);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarHabitacion(@PathVariable UUID id) {
        log.info("Solicitud de eliminacion de habitacion: id={}", id);
        habitacionService.eliminarHabitacion(id);
        return ResponseEntity.noContent().build();
    }
}
