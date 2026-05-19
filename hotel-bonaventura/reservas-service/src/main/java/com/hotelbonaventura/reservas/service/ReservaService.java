package com.hotelbonaventura.reservas.service;

import com.hotelbonaventura.reservas.dto.CheckinRequestDTO;
import com.hotelbonaventura.reservas.dto.CheckinResponseDTO;
import com.hotelbonaventura.reservas.dto.ReservaDTO;

import java.util.List;
import java.util.UUID;

public interface ReservaService {

    CheckinResponseDTO procesarCheckin(CheckinRequestDTO request, String userEmail);

    ReservaDTO obtenerReserva(UUID id);

    List<ReservaDTO> listarReservasPorCliente(String clienteDni);

    List<ReservaDTO> listarTodas();
}
