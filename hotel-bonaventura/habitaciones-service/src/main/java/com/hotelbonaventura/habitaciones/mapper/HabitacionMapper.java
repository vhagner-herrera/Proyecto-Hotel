package com.hotelbonaventura.habitaciones.mapper;

import com.hotelbonaventura.habitaciones.dto.HabitacionDTO;
import com.hotelbonaventura.habitaciones.entity.Habitacion;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class HabitacionMapper {

    public HabitacionDTO toDTO(Habitacion habitacion) {
        return new HabitacionDTO(
                habitacion.getId(),
                habitacion.getNumero(),
                habitacion.getTipo(),
                habitacion.getPrecioPorNoche(),
                habitacion.getEstado()
        );
    }

    public List<HabitacionDTO> toDTOList(List<Habitacion> habitaciones) {
        return habitaciones.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
