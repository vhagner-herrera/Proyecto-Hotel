package com.hotelbonaventura.administracion.service;

import com.hotelbonaventura.administracion.dto.ParametroDTO;

import java.util.List;

public interface ParametroService {
    List<ParametroDTO> listarTodos();
    ParametroDTO obtenerPorClave(String clave);
    ParametroDTO actualizar(String clave, String nuevoValor);
}
