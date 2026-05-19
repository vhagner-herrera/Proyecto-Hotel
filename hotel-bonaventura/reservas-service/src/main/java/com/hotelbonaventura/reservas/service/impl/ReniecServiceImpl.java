package com.hotelbonaventura.reservas.service.impl;

import com.hotelbonaventura.reservas.client.ReniecClient;
import com.hotelbonaventura.reservas.dto.ReniecResponseDTO;
import com.hotelbonaventura.reservas.exception.ReservaException;
import com.hotelbonaventura.reservas.service.ReniecService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReniecServiceImpl implements ReniecService {

    private final ReniecClient reniecClient;

    @Override
    public ReniecResponseDTO consultarDni(String dni) {
        if (!dni.matches("^[0-9]{8}$")) {
            throw new ReservaException("DNI debe tener exactamente 8 dígitos numéricos");
        }

        return reniecClient.consultarDni(dni);
    }
}
