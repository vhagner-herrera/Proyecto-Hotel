package com.hotelbonaventura.administracion.controller;

import com.hotelbonaventura.administracion.dto.DashboardDTO;
import com.hotelbonaventura.administracion.dto.ReporteIngresosDTO;
import com.hotelbonaventura.administracion.dto.ReporteOcupacionDTO;
import com.hotelbonaventura.administracion.service.ReporteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * El rol ADMINISTRADOR lo valida AdminRoleInterceptor para todo /api/admin/**.
 */
@RestController
@RequestMapping("/api/admin/reportes")
@Slf4j
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/ingresos")
    public ResponseEntity<ReporteIngresosDTO> reporteIngresos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin
    ) {
        if (fechaInicio == null) {
            fechaInicio = LocalDate.now().withDayOfMonth(1);
        }
        if (fechaFin == null) {
            fechaFin = LocalDate.now();
        }

        return ResponseEntity.ok(reporteService.generarReporteIngresos(fechaInicio, fechaFin));
    }

    @GetMapping("/ocupacion")
    public ResponseEntity<ReporteOcupacionDTO> reporteOcupacion() {
        return ResponseEntity.ok(reporteService.generarReporteOcupacion());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> dashboard() {
        return ResponseEntity.ok(reporteService.obtenerDatosDashboard());
    }
}
