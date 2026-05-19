package com.hotelbonaventura.administracion.controller;

import com.hotelbonaventura.administracion.dto.ActualizarUsuarioDTO;
import com.hotelbonaventura.administracion.dto.CrearUsuarioDTO;
import com.hotelbonaventura.administracion.dto.UsuarioDTO;
import com.hotelbonaventura.administracion.service.UsuarioAdminService;
import jakarta.validation.Valid;
import com.hotelbonaventura.administracion.exception.AccesoNoAutorizadoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/usuarios")
@Slf4j
public class UsuarioAdminController {

    @Autowired
    private UsuarioAdminService usuarioService;

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listarTodos(
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        validarRolAdministrador(userRole);
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(
            @Valid @RequestBody CrearUsuarioDTO dto,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        validarRolAdministrador(userRole);

        UsuarioDTO creado = usuarioService.crear(dto);

        Map<String, Object> response = new HashMap<>();
        response.put("id", creado.getId());
        response.put("nombre", creado.getNombre());
        response.put("correo", creado.getCorreo());
        response.put("rol", creado.getRol());
        response.put("estado", creado.getEstado());
        response.put("message", "Usuario creado exitosamente");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody ActualizarUsuarioDTO dto,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        validarRolAdministrador(userRole);
        return ResponseEntity.ok(usuarioService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> desactivar(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        validarRolAdministrador(userRole);

        usuarioService.desactivar(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Usuario desactivado correctamente");

        return ResponseEntity.ok(response);
    }

    private void validarRolAdministrador(String userRole) {
        if (!"ADMINISTRADOR".equals(userRole)) {
            throw new AccesoNoAutorizadoException("Acceso denegado. Se requiere rol ADMINISTRADOR");
        }
    }
}
