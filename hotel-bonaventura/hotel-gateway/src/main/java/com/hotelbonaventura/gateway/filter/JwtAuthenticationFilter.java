package com.hotelbonaventura.gateway.filter;

import com.hotelbonaventura.gateway.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Filtro global de autenticacion JWT.
 *
 * Se ejecuta con la prioridad mas alta (HIGHEST_PRECEDENCE) para interceptar
 * TODAS las peticiones antes de que lleguen a los microservicios.
 *
 * Flujo:
 *   1. Si la ruta es publica (/api/auth/login) -> deja pasar sin validar
 *   2. Extrae el token del header "Authorization: Bearer <token>"
 *   3. Valida firma y expiracion con JwtUtil
 *   4. Extrae claims (email, rol) e inyecta headers X-User-* en la peticion
 *   5. Si el token es invalido o ausente -> retorna 401 Unauthorized
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    /** Rutas que NO requieren token JWT. */
    private static final List<String> RUTAS_PUBLICAS = List.of(
            "/api/auth/login"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path   = exchange.getRequest().getURI().getPath();
        String metodo = exchange.getRequest().getMethod().name();

        log.debug("Peticion entrante: {} {}", metodo, path);

        // Preflight OPTIONS: dejar pasar para que CorsConfig lo maneje
        if ("OPTIONS".equalsIgnoreCase(metodo)) {
            return chain.filter(exchange);
        }

        // Rutas publicas: no requieren JWT
        if (esRutaPublica(path)) {
            log.debug("Ruta publica, omitiendo validacion JWT: {}", path);
            return chain.filter(exchange);
        }

        // Extraer header Authorization
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Peticion a ruta protegida sin header Authorization: {} {}", metodo, path);
            return rechazar(exchange);
        }

        // Quitar el prefijo "Bearer "
        String token = authHeader.substring(7);

        // Validar token (firma + expiracion)
        if (!jwtUtil.validateToken(token)) {
            log.warn("Token JWT invalido o expirado para ruta: {} {}", metodo, path);
            return rechazar(exchange);
        }

        // Extraer claims
        String email = jwtUtil.extractEmail(token);
        String rol   = jwtUtil.extractRole(token);

        log.debug("Usuario autenticado: {} | Rol: {} | Ruta: {}", email, rol, path);

        // Inyectar datos del usuario como headers hacia el microservicio destino
        ServerHttpRequest requestMutado = exchange.getRequest().mutate()
                .header("X-User-Email", email)
                .header("X-User-Role",  rol)
                .build();

        return chain.filter(exchange.mutate().request(requestMutado).build());
    }

    /** Este filtro se ejecuta antes que cualquier otro filtro del gateway. */
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    /** Retorna 401 Unauthorized y cierra la respuesta sin propagar la cadena. */
    private Mono<Void> rechazar(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    private boolean esRutaPublica(String path) {
        return RUTAS_PUBLICAS.stream().anyMatch(path::startsWith);
    }
}
