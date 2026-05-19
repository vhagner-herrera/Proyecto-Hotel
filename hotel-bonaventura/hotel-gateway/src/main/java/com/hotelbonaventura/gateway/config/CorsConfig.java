package com.hotelbonaventura.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuracion global de CORS para el API Gateway reactivo.
 *
 * Usa CorsWebFilter (WebFlux) en lugar de WebMvcConfigurer,
 * ya que el gateway opera sobre Spring WebFlux, no Spring MVC.
 *
 * Permite al frontend React (localhost:3000) llamar al gateway
 * con el header Authorization (necesario para enviar el JWT).
 */
@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origin}")
    private String allowedOrigin;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Origen permitido: frontend React
        config.setAllowedOrigins(List.of(allowedOrigin));

        // Metodos HTTP permitidos
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Headers que el cliente puede enviar
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        // Necesario para enviar el header Authorization con credenciales
        config.setAllowCredentials(true);

        // Tiempo en segundos que el browser cachea el resultado del preflight
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
