package com.hotelbonaventura.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Value("${services.auth-url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${services.habitaciones-url:http://localhost:8082}")
    private String habitacionesServiceUrl;

    @Value("${services.reservas-url:http://localhost:8083}")
    private String reservasServiceUrl;

    @Value("${services.pagos-url:http://localhost:8084}")
    private String pagosServiceUrl;

    @Value("${services.admin-url:http://localhost:8085}")
    private String adminServiceUrl;

    @Bean
    public RouteLocator hotelRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service", r -> r
                        .path("/api/auth/**")
                        .uri(authServiceUrl))
                .route("habitaciones-service", r -> r
                        .path("/api/habitaciones/**")
                        .uri(habitacionesServiceUrl))
                .route("reservas-service", r -> r
                        .path("/api/reservas/**")
                        .uri(reservasServiceUrl))
                .route("pagos-service", r -> r
                        .path("/api/pagos/**")
                        .uri(pagosServiceUrl))
                .route("administracion-service", r -> r
                        .path("/api/admin/**")
                        .uri(adminServiceUrl))
                .build();
    }
}
