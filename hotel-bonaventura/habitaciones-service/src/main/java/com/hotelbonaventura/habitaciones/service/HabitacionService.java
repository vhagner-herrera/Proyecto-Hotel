package com.hotelbonaventura.habitaciones.service;

import com.hotelbonaventura.habitaciones.dto.ActualizarHabitacionRequestDTO;
import com.hotelbonaventura.habitaciones.dto.CambioEstadoResponseDTO;
import com.hotelbonaventura.habitaciones.dto.CrearHabitacionRequestDTO;
import com.hotelbonaventura.habitaciones.dto.HabitacionDTO;

import java.util.List;
import java.util.UUID;

public interface HabitacionService {

    List<HabitacionDTO> listarTodas();

    List<HabitacionDTO> listarDisponibles();

    List<HabitacionDTO> listarPorEstado(String estado);

    CambioEstadoResponseDTO cambiarEstado(UUID id, String nuevoEstado, String userRole);

    void marcarComoOcupada(UUID idHabitacion);

    HabitacionDTO obtenerHabitacion(UUID id);

    HabitacionDTO crearHabitacion(CrearHabitacionRequestDTO request);

    HabitacionDTO actualizarHabitacion(UUID id, ActualizarHabitacionRequestDTO request);

    void eliminarHabitacion(UUID id);
}
