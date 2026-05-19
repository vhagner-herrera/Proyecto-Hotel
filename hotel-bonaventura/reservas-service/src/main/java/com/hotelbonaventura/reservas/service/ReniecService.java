package com.hotelbonaventura.reservas.service;

import com.hotelbonaventura.reservas.dto.ReniecResponseDTO;

public interface ReniecService {

    ReniecResponseDTO consultarDni(String dni);
}
