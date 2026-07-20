package com.hotelbonaventura.administracion.controller;

import com.hotelbonaventura.administracion.dto.ActualizarUsuarioDTO;
import com.hotelbonaventura.administracion.dto.CrearUsuarioDTO;
import com.hotelbonaventura.administracion.dto.UsuarioDTO;
import com.hotelbonaventura.administracion.service.UsuarioAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * El rol ADMINISTRADOR lo valida AdminRoleInterceptor para todo /api/admin/**.
 */
@RestController
@RequestMapping("/api/admin/usuarios")
@Slf4j
@RequiredArgsConstructor
public class UsuarioAdminController {

    private final UsuarioAdminService usuarioService;

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@Valid @RequestBody CrearUsuarioDTO dto) {
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
            @Valid @RequestBody ActualizarUsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> desactivar(@PathVariable UUID id) {
        usuarioService.desactivar(id);
        return ResponseEntity.ok(Map.of("message", "Usuario desactivado correctamente"));
    }
}
