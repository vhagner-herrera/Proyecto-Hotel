package com.hotelbonaventura.administracion.service;

import com.hotelbonaventura.administracion.dto.ActualizarUsuarioDTO;
import com.hotelbonaventura.administracion.dto.CrearUsuarioDTO;
import com.hotelbonaventura.administracion.dto.UsuarioDTO;

import java.util.List;
import java.util.UUID;

public interface UsuarioAdminService {
    List<UsuarioDTO> listarTodos();
    UsuarioDTO crear(CrearUsuarioDTO dto);
    UsuarioDTO actualizar(UUID id, ActualizarUsuarioDTO dto);
    void desactivar(UUID id);
}
