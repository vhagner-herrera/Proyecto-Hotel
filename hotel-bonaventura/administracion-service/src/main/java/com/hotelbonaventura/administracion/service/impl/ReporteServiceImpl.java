package com.hotelbonaventura.administracion.service.impl;

import com.hotelbonaventura.administracion.dto.*;
import com.hotelbonaventura.administracion.repository.BoletaRepository;
import com.hotelbonaventura.administracion.repository.HabitacionRepository;
import com.hotelbonaventura.administracion.repository.ReservaRepository;
import com.hotelbonaventura.administracion.repository.UsuarioRepository;
import com.hotelbonaventura.administracion.service.ReporteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReporteServiceImpl implements ReporteService {

    private final BoletaRepository boletaRepository;
    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    public ReporteIngresosDTO generarReporteIngresos(LocalDate inicio, LocalDate fin) {
        // Rango medio-abierto [inicio, fin+1dia): incluye el dia final completo,
        // sin perder el ultimo segundo como ocurria con fin.atTime(23:59:59)
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.plusDays(1).atStartOfDay();

        BigDecimal totalIngresos = boletaRepository.calcularIngresosPorPeriodo(inicioDateTime, finDateTime);
        if (totalIngresos == null) {
            totalIngresos = BigDecimal.ZERO;
        }

        BigDecimal baseImponible = totalIngresos.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
        BigDecimal igv = totalIngresos.subtract(baseImponible);

        long cantidadBoletas = boletaRepository.contarBoletasPorPeriodo(inicioDateTime, finDateTime);

        List<Object[]> datosPorDia = boletaRepository.obtenerIngresosPorDia(inicioDateTime, finDateTime);
        List<IngresosPorDiaDTO> detalles = datosPorDia.stream()
                .map(row -> new IngresosPorDiaDTO(
                        parseLocalDate(row[0]),
                        row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO,
                        row[2] != null ? ((Number) row[2]).longValue() : 0L
                ))
                .toList();

        PeriodoDTO periodo = new PeriodoDTO(inicio, fin);

        return new ReporteIngresosDTO(periodo, totalIngresos, baseImponible, igv, cantidadBoletas, detalles);
    }

    @Override
    public ReporteOcupacionDTO generarReporteOcupacion() {
        long disponibles = habitacionRepository.countByEstado("DISPONIBLE");
        long ocupadas = habitacionRepository.countByEstado("OCUPADA");
        long mantenimiento = habitacionRepository.countByEstado("MANTENIMIENTO");
        long total = disponibles + ocupadas + mantenimiento;

        double porcentaje = total > 0 ? (ocupadas * 100.0 / total) : 0.0;

        List<Object[]> estadisticas = habitacionRepository.obtenerEstadisticasPorTipo();
        List<DetalleOcupacionDTO> detalles = estadisticas.stream()
                .map(row -> {
                    String tipo = (String) row[0];
                    int totalTipo = row[1] != null ? ((Number) row[1]).intValue() : 0;
                    int disponiblesTipo = row[2] != null ? ((Number) row[2]).intValue() : 0;
                    int ocupadasTipo = row[3] != null ? ((Number) row[3]).intValue() : 0;
                    double porcentajeTipo = totalTipo > 0 ? (ocupadasTipo * 100.0 / totalTipo) : 0.0;
                    return new DetalleOcupacionDTO(tipo, totalTipo, disponiblesTipo, ocupadasTipo, porcentajeTipo);
                })
                .toList();

        return new ReporteOcupacionDTO(
                (int) total,
                (int) disponibles,
                (int) ocupadas,
                (int) mantenimiento,
                porcentaje,
                detalles
        );
    }

    @Override
    public DashboardDTO obtenerDatosDashboard() {
        LocalDate primerDiaMes = LocalDate.now().withDayOfMonth(1);
        LocalDate hoy = LocalDate.now();

        ReporteIngresosDTO ingresos = generarReporteIngresos(primerDiaMes, hoy);
        ReporteOcupacionDTO ocupacion = generarReporteOcupacion();

        long reservasMes = reservaRepository.contarReservasPorPeriodo(
                primerDiaMes.atStartOfDay(),
                hoy.plusDays(1).atStartOfDay()
        );

        long usuariosActivos = usuarioRepository.countByEstado("ACTIVO");

        long diasTranscurridos = ChronoUnit.DAYS.between(primerDiaMes, hoy) + 1;
        BigDecimal promedioDiario = diasTranscurridos > 0
                ? ingresos.getTotalIngresos().divide(new BigDecimal(diasTranscurridos), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new DashboardDTO(
                ingresos.getTotalIngresos(),
                reservasMes,
                ocupacion.getHabitacionesDisponibles(),
                ocupacion.getHabitacionesOcupadas(),
                ocupacion.getPorcentajeOcupacion(),
                usuariosActivos,
                ingresos.getCantidadBoletas(),
                promedioDiario
        );
    }

    private LocalDate parseLocalDate(Object obj) {
        if (obj == null) return LocalDate.now();
        if (obj instanceof java.sql.Date) {
            return ((java.sql.Date) obj).toLocalDate();
        }
        if (obj instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) obj).toLocalDateTime().toLocalDate();
        }
        if (obj instanceof java.util.Date) {
            return new java.sql.Date(((java.util.Date) obj).getTime()).toLocalDate();
        }
        try {
            return LocalDate.parse(obj.toString());
        } catch (Exception e) {
            log.warn("No se pudo parsear fecha: {}", obj);
            return LocalDate.now();
        }
    }
}
