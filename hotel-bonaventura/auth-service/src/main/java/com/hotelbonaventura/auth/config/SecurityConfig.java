package com.hotelbonaventura.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuracion de Spring Security para el auth-service.
 *
 * Este servicio es STATELESS: no usa sesiones HTTP ni cookies de sesion.
 * La validacion de JWT la hace el Gateway; aqui solo se expone el endpoint de login.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${CORS_ALLOWED_ORIGIN:http://localhost:3000}")
    private String allowedOrigin;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF deshabilitado: la API es stateless (usa JWT, no cookies de sesion)
            .csrf(AbstractHttpConfigurer::disable)

            // Sin sesiones: cada peticion es independiente
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // CORS: permite peticiones del frontend React
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Autorizacion de rutas
            .authorizeHttpRequests(auth -> auth
                // Login es publico (sin token)
                .requestMatchers("/api/auth/login").permitAll()
                // Actuator: health e info accesibles para monitoreo
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                // Todo lo demas requiere autenticacion
                .anyRequest().authenticated()
            );

        return http.build();
    }

    /**
     * BCrypt con strength 10 (2^10 = 1024 iteraciones).
     * Suficientemente seguro y con tiempo de hashing aceptable (~100ms).
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    /**
     * CORS: permite al frontend llamar a este servicio.
     * El origen se configura con la variable de entorno CORS_ALLOWED_ORIGIN.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
