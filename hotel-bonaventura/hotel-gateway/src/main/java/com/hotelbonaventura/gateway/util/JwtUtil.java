package com.hotelbonaventura.gateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Utilidad para operaciones con tokens JWT.
 *
 * Usa JJWT 0.12.x. El API cambio respecto a versiones anteriores:
 *   - Jwts.parser() en lugar de Jwts.parserBuilder()
 *   - verifyWith() en lugar de setSigningKey()
 *   - parseSignedClaims() en lugar de parseClaimsJws()
 *   - getPayload() en lugar de getBody()
 */
@Slf4j
@Component
public class JwtUtil {

    private final SecretKey secretKey;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        // La clave debe tener al menos 256 bits (32 bytes) para HS256
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Valida la firma y la expiracion del token.
     *
     * @param token JWT sin el prefijo "Bearer "
     * @return true si el token es valido y no ha expirado
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException e) {
            log.warn("Token JWT invalido: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            log.warn("Token JWT vacio o nulo: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extrae el email del usuario (claim 'sub').
     */
    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Extrae el rol del usuario (claim 'rol').
     * Valores esperados: ADMINISTRADOR, RECEPCIONISTA
     */
    public String extractRole(String token) {
        return getClaims(token).get("rol", String.class);
    }

    /**
     * Extrae el nombre del usuario (claim 'nombre').
     */
    public String extractNombre(String token) {
        return getClaims(token).get("nombre", String.class);
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}