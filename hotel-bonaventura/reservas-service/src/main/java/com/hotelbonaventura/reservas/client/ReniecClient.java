package com.hotelbonaventura.reservas.client;

import com.hotelbonaventura.reservas.dto.ReniecResponseDTO;
import com.hotelbonaventura.reservas.exception.DniNoEncontradoException;
import com.hotelbonaventura.reservas.exception.ReservaException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;

/**
 * Cliente de la API de PeruDevs para consultar DNI en RENIEC.
 *
 * GET {apiUrl}/api/v1/dni/simple?document={dni}&key={apiKey}
 *
 * Respuesta:
 * {
 *   "estado": true,
 *   "mensaje": "Encontrado",
 *   "resultado": {
 *     "id": "12345678",
 *     "nombres": "MARIA ISABEL",
 *     "apellido_paterno": "JIMENEZ",
 *     "apellido_materno": "DIAZ",
 *     "nombre_completo": "MARIA ISABEL JIMENEZ DIAZ",
 *     "codigo_verificacion": "8"
 *   }
 * }
 */
@Component
@Slf4j
public class ReniecClient {

    private static final ParameterizedTypeReference<Map<String, Object>> RESPONSE_TYPE =
            new ParameterizedTypeReference<>() {};

    private final RestTemplate restTemplate;
    private final String apiUrl;
    private final String apiKey;

    public ReniecClient(RestTemplate restTemplate,
                        @Value("${reniec.api.url}") String apiUrl,
                        @Value("${reniec.api.key}") String apiKey) {
        this.restTemplate = restTemplate;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
    }

    public ReniecResponseDTO consultarDni(String dni) {
        // La key va como query param; no loguear la URI completa para no exponerla
        URI uri = UriComponentsBuilder.fromUriString(apiUrl)
                .path("/api/v1/dni/simple")
                .queryParam("document", dni)
                .queryParam("key", apiKey)
                .build()
                .toUri();

        try {
            log.info("🔍 Consultando DNI {} en RENIEC (PeruDevs)...", dni);

            ResponseEntity<Map<String, Object>> response =
                    restTemplate.exchange(uri, HttpMethod.GET, null, RESPONSE_TYPE);

            Map<String, Object> body = response.getBody();

            if (body == null) {
                throw new DniNoEncontradoException("Respuesta vacía de RENIEC");
            }

            boolean encontrado = Boolean.TRUE.equals(body.get("estado"));
            if (!encontrado) {
                String mensaje = body.get("mensaje") != null
                        ? body.get("mensaje").toString()
                        : "DNI no encontrado en RENIEC";
                log.warn("❌ RENIEC sin resultado para DNI {}: {}", dni, mensaje);
                throw new DniNoEncontradoException(mensaje);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> resultado = (Map<String, Object>) body.get("resultado");
            if (resultado == null) {
                throw new DniNoEncontradoException("Respuesta de RENIEC sin datos del titular");
            }

            String nombreCompleto = str(resultado.get("nombre_completo"));
            log.info("✅ DNI encontrado: {}", nombreCompleto);

            return new ReniecResponseDTO(
                    str(resultado.get("id")),
                    nombreCompleto,
                    str(resultado.get("nombres")),
                    str(resultado.get("apellido_paterno")),
                    str(resultado.get("apellido_materno"))
            );

        } catch (HttpClientErrorException.NotFound e) {
            log.warn("❌ DNI {} no encontrado en RENIEC", dni);
            throw new DniNoEncontradoException("DNI no encontrado en RENIEC");
        } catch (DniNoEncontradoException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Error al consultar RENIEC: {}", e.getMessage());
            throw new ReservaException("Error al consultar DNI: " + e.getMessage());
        }
    }

    private static String str(Object value) {
        return value != null ? value.toString() : null;
    }
}
