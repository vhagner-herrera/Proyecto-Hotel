package com.hotelbonaventura.administracion.service;

import com.hotelbonaventura.administracion.dto.DashboardDTO;
import com.hotelbonaventura.administracion.dto.ReporteIngresosDTO;
import com.hotelbonaventura.administracion.dto.ReporteOcupacionDTO;

import java.time.LocalDate;

public interface ReporteService {
    ReporteIngresosDTO generarReporteIngresos(LocalDate inicio, LocalDate fin);
    ReporteOcupacionDTO generarReporteOcupacion();
    DashboardDTO obtenerDatosDashboard();
}
