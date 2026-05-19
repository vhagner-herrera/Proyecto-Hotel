package com.hotelbonaventura.reservas.controller;

import com.hotelbonaventura.reservas.dto.CheckinRequestDTO;
import com.hotelbonaventura.reservas.dto.CheckinResponseDTO;
import com.hotelbonaventura.reservas.dto.ReniecResponseDTO;
import com.hotelbonaventura.reservas.dto.ReservaDTO;
import com.hotelbonaventura.reservas.exception.ReservaException;
import com.hotelbonaventura.reservas.service.ReservaService;
import com.hotelbonaventura.reservas.service.ReniecService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
@Slf4j
public class ReservaController {

    private final ReservaService reservaService;
    private final ReniecService reniecService;

    @GetMapping
    public ResponseEntity<List<ReservaDTO>> listarTodas() {
        log.info("📋 Listando todas las reservas");
        return ResponseEntity.ok(reservaService.listarTodas());
    }

    @GetMapping("/consultar-dni/{dni}")
    public ResponseEntity<ReniecResponseDTO> consultarDni(@PathVariable String dni) {
        log.info("🔍 Consultando DNI: {}", dni);

        if (!dni.matches("^[0-9]{8}$")) {
            throw new ReservaException("DNI debe tener exactamente 8 dígitos numéricos");
        }

        ReniecResponseDTO response = reniecService.consultarDni(dni);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/checkin")
    public ResponseEntity<CheckinResponseDTO> procesarCheckin(
            @Valid @RequestBody CheckinRequestDTO request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        log.info("📥 Check-in solicitado por: {} - Habitación: {} - Documento: {}",
                 userEmail, request.getNumeroHabitacion(), request.getClienteDocumento());

        CheckinResponseDTO response = reservaService.procesarCheckin(request, userEmail);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservaDTO> obtenerReserva(@PathVariable UUID id) {
        log.info("🔍 Obteniendo reserva: {}", id);

        ReservaDTO response = reservaService.obtenerReserva(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cliente/{clienteDni}")
    public ResponseEntity<List<ReservaDTO>> listarReservasPorCliente(@PathVariable String clienteDni) {
        log.info("🔍 Listando reservas del cliente: {}", clienteDni);

        List<ReservaDTO> response = reservaService.listarReservasPorCliente(clienteDni);
        return ResponseEntity.ok(response);
    }
}
