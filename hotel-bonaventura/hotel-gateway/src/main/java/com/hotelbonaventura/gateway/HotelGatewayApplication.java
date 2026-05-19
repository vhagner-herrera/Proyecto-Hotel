package com.hotelbonaventura.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada del API Gateway de Hotel BonAventura.
 *
 * Responsabilidades:
 *   - Enrutar peticiones a los microservicios
 *   - Validar tokens JWT (via JwtAuthenticationFilter)
 *   - Inyectar headers con datos del usuario autenticado
 *   - Gestionar CORS para el frontend React
 *
 * Tecnologia: Spring Cloud Gateway (reactivo / WebFlux)
 * Puerto: 8080
 */
@SpringBootApplication
public class HotelGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(HotelGatewayApplication.class, args);
    }
}