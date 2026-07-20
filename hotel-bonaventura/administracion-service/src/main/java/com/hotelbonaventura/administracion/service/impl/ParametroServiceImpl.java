package com.hotelbonaventura.administracion.service.impl;

import com.hotelbonaventura.administracion.dto.ParametroDTO;
import com.hotelbonaventura.administracion.entity.ParametroGlobal;
import com.hotelbonaventura.administracion.exception.ParametroNoEncontradoException;
import com.hotelbonaventura.administracion.repository.ParametroRepository;
import com.hotelbonaventura.administracion.service.ParametroService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ParametroServiceImpl implements ParametroService {

    private final ParametroRepository parametroRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void inicializarParametrosDefault() {
        Map<String, String> defaults = new LinkedHashMap<>();
        defaults.put("IGV_PORCENTAJE", "18");
        defaults.put("RUC_EMPRESA", "20601234567");
        defaults.put("RAZON_SOCIAL", "HOTEL BONAVENTURA S.A.C.");
        defaults.put("MONEDA_SIMBOLO", "S/");
        defaults.put("HORA_CHECKIN_ESTANDAR", "14:00");
        defaults.put("HORA_CHECKOUT_ESTANDAR", "12:00");
        defaults.put("MINUTOS_TOLERANCIA_SALIDA", "15");
        defaults.put("DURACION_ESTADIA_HORAS_ESTANDAR", "4");
        defaults.put("TARIFA_HORA_ADICIONAL", "15.00");
        defaults.put("MINUTOS_EXPIRACION_RESERVA", "30");
        defaults.put("DIRECCION_HOTEL", "Av. Principal 123, Lima");
        defaults.put("TELEFONO_RECEPCION", "+51 987 654 321");

        defaults.forEach((clave, valor) -> {
            if (!parametroRepository.existsById(clave)) {
                ParametroGlobal p = new ParametroGlobal(clave, valor, LocalDateTime.now());
                parametroRepository.save(p);
                log.info("⚙️ Parámetro por defecto registrado: {} = {}", clave, valor);
            }
        });
    }

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
