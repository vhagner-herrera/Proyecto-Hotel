package com.hotelbonaventura.administracion.controller;

import com.hotelbonaventura.administracion.dto.ParametroDTO;
import com.hotelbonaventura.administracion.service.ParametroService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * El rol ADMINISTRADOR lo valida AdminRoleInterceptor para todo /api/admin/**.
 */
@RestController
@RequestMapping("/api/admin/parametros")
@Slf4j
@RequiredArgsConstructor
public class ParametroController {

    private final ParametroService parametroService;

    @GetMapping
    public ResponseEntity<List<ParametroDTO>> listarTodos() {
        return ResponseEntity.ok(parametroService.listarTodos());
    }

    @PutMapping("/{clave}")
    public ResponseEntity<Map<String, Object>> actualizar(
            @PathVariable String clave,
            @RequestBody Map<String, String> request
    ) {
        String nuevoValor = request.get("valor");
        ParametroDTO actualizado = parametroService.actualizar(clave, nuevoValor);

        Map<String, Object> response = new HashMap<>();
        response.put("clave", actualizado.getClave());
        response.put("valor", actualizado.getValor());
        response.put("message", "Parámetro actualizado correctamente");

        return ResponseEntity.ok(response);
    }
}
