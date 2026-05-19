package com.hotelbonaventura.administracion.controller;

import com.hotelbonaventura.administracion.dto.DashboardDTO;
import com.hotelbonaventura.administracion.dto.ReporteIngresosDTO;
import com.hotelbonaventura.administracion.dto.ReporteOcupacionDTO;
import com.hotelbonaventura.administracion.service.ReporteService;
import com.hotelbonaventura.administracion.exception.AccesoNoAutorizadoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/reportes")
@Slf4j
public class ReporteController {

    @Autowired
    private ReporteService reporteService;

    @GetMapping("/ingresos")
    public ResponseEntity<ReporteIngresosDTO> reporteIngresos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        validarRolAdministrador(userRole);

        if (fechaInicio == null) {
            fechaInicio = LocalDate.now().withDayOfMonth(1);
        }
        if (fechaFin == null) {
            fechaFin = LocalDate.now();
        }

        return ResponseEntity.ok(reporteService.generarReporteIngresos(fechaInicio, fechaFin));
    }

    @GetMapping("/ocupacion")
    public ResponseEntity<ReporteOcupacionDTO> reporteOcupacion(
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        validarRolAdministrador(userRole);
        return ResponseEntity.ok(reporteService.generarReporteOcupacion());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> dashboard(
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        validarRolAdministrador(userRole);
        return ResponseEntity.ok(reporteService.obtenerDatosDashboard());
    }

    private void validarRolAdministrador(String userRole) {
        if (!"ADMINISTRADOR".equals(userRole)) {
            throw new AccesoNoAutorizadoException("Acceso denegado. Se requiere rol ADMINISTRADOR");
        }
    }
}
