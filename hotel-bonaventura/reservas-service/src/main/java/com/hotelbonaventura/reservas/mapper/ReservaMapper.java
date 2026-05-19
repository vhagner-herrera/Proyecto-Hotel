package com.hotelbonaventura.reservas.mapper;

import com.hotelbonaventura.reservas.dto.ReservaDTO;
import com.hotelbonaventura.reservas.entity.Reserva;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ReservaMapper {

    public ReservaDTO toDTO(Reserva entity) {
        if (entity == null) {
            return null;
        }

        return new ReservaDTO(
            entity.getId(),
            entity.getIdHabitacion(),
            entity.getCodigoReserva(),
            entity.getClienteDni(),
            entity.getClienteNombreCompleto(),
            entity.getNumeroHabitacion(),
            entity.getFechaCheckin(),
            entity.getFechaCheckout(),
            entity.getCantidadNoches(),
            entity.getEstado()
        );
    }

    public List<ReservaDTO> toDTOList(List<Reserva> entities) {
        return entities.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
}
