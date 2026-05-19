package com.hotelbonaventura.administracion.controller;

import com.hotelbonaventura.administracion.dto.ParametroDTO;
import com.hotelbonaventura.administracion.service.ParametroService;
import com.hotelbonaventura.administracion.exception.AccesoNoAutorizadoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/parametros")
@Slf4j
public class ParametroController {

    @Autowired
    private ParametroService parametroService;

    @GetMapping
    public ResponseEntity<List<ParametroDTO>> listarTodos(
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        validarRolAdministrador(userRole);
        return ResponseEntity.ok(parametroService.listarTodos());
    }

    @PutMapping("/{clave}")
    public ResponseEntity<Map<String, Object>> actualizar(
            @PathVariable String clave,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        validarRolAdministrador(userRole);

        String nuevoValor = request.get("valor");
        ParametroDTO actualizado = parametroService.actualizar(clave, nuevoValor);

        Map<String, Object> response = new HashMap<>();
        response.put("clave", actualizado.getClave());
        response.put("valor", actualizado.getValor());
        response.put("message", "Parámetro actualizado correctamente");

        return ResponseEntity.ok(response);
    }

    private void validarRolAdministrador(String userRole) {
        if (!"ADMINISTRADOR".equals(userRole)) {
            throw new AccesoNoAutorizadoException("Acceso denegado. Se requiere rol ADMINISTRADOR");
        }
    }
}
