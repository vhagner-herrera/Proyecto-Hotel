package com.hotelbonaventura.reservas.client;

import com.hotelbonaventura.reservas.dto.ReniecResponseDTO;
import com.hotelbonaventura.reservas.exception.DniNoEncontradoException;
import com.hotelbonaventura.reservas.exception.ReservaException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@Slf4j
public class ReniecClient {

    @Value("${reniec.api.url}")
    private String apiUrl;

    @Value("${reniec.api.key}")
    private String apiKey;

    @Autowired
    private RestTemplate restTemplate;

    public ReniecResponseDTO consultarDni(String dni) {
        String url = apiUrl + "/v1/reniec/dni?numero=" + dni;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", apiKey);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            log.info("🔍 Consultando DNI {} en RENIEC...", dni);

            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                Map.class
            );

            Map<String, String> body = response.getBody();

            if (body == null) {
                throw new DniNoEncontradoException("Respuesta vacía de RENIEC");
            }

            if (body.containsKey("error")) {
                log.error("❌ Error RENIEC: {}", body.get("error"));
                throw new DniNoEncontradoException(body.get("error"));
            }

            log.info("✅ DNI encontrado: {}", body.get("full_name"));

            return new ReniecResponseDTO(
                body.get("document_number"),
                body.get("full_name"),
                body.get("first_name"),
                body.get("first_last_name"),
                body.get("second_last_name")
            );

        } catch (HttpClientErrorException.NotFound e) {
            log.error("❌ DNI {} no encontrado en RENIEC", dni);
            throw new DniNoEncontradoException("DNI no encontrado en RENIEC");
        } catch (DniNoEncontradoException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Error al consultar RENIEC: {}", e.getMessage());
            throw new ReservaException("Error al consultar DNI: " + e.getMessage());
        }
    }
}
