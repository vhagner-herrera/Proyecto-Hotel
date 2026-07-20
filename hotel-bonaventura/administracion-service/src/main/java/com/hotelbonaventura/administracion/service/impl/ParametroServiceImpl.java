package com.hotelbonaventura.administracion.service.impl;

import com.hotelbonaventura.administracion.dto.ParametroDTO;
import com.hotelbonaventura.administracion.entity.ParametroGlobal;
import com.hotelbonaventura.administracion.exception.ParametroNoEncontradoException;
import com.hotelbonaventura.administracion.repository.ParametroRepository;
import com.hotelbonaventura.administracion.service.ParametroService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ParametroServiceImpl implements ParametroService {

    private final ParametroRepository parametroRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ParametroDTO> listarTodos() {
        return parametroRepository.findAll().stream()
                .map(p -> new ParametroDTO(p.getClave(), p.getValor(), p.getUpdatedAt()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ParametroDTO obtenerPorClave(String clave) {
        ParametroGlobal param = parametroRepository.findById(clave)
                .orElseThrow(() -> new ParametroNoEncontradoException("Parámetro no encontrado: " + clave));
        return new ParametroDTO(param.getClave(), param.getValor(), param.getUpdatedAt());
    }

    @Override
    @Transactional
    public ParametroDTO actualizar(String clave, String nuevoValor) {
        ParametroGlobal param = parametroRepository.findById(clave)
                .orElseThrow(() -> new ParametroNoEncontradoException("Parámetro no encontrado: " + clave));

        param.setValor(nuevoValor);
        ParametroGlobal guardado = parametroRepository.save(param);

        log.info("✅ Parámetro actualizado: {} = {}", clave, nuevoValor);
        return new ParametroDTO(guardado.getClave(), guardado.getValor(), guardado.getUpdatedAt());
    }
}
