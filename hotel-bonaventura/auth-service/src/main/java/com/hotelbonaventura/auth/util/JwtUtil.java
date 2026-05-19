package com.hotelbonaventura.auth.util;

import com.hotelbonaventura.auth.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utilidad para generacion y validacion de tokens JWT.
 *
 * Usa JJWT 0.12.x. Cambios respecto a versiones anteriores:
 *   - Jwts.builder().subject() en lugar de setSubject()
 *   - Jwts.builder().expiration() en lugar de setExpiration()
 *   - Jwts.parser().verifyWith() en lugar de setSigningKey()
 *   - parseSignedClaims() en lugar de parseClaimsJws()
 *   - getPayload() en lugar de getBody()
 *
 * Algoritmo: HS256 (HMAC-SHA256). La clave debe tener minimo 256 bits (32 bytes).
 */
@Slf4j
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final Long expiration;

    public JwtUtil(
            @Value("${JWT_SECRET}") String secret,
            @Value("${JWT_EXPIRATION}") Long expiration) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    /**
     * Genera un token JWT con los datos del usuario.
     *
     * Claims incluidos:
     *   sub    → correo del usuario
     *   nombre → nombre completo
     *   rol    → ADMINISTRADOR o RECEPCIONISTA
     *   iat    → timestamp de creacion
     *   exp    → timestamp de expiracion
     */
    public String generateToken(Usuario usuario) {
        Date ahora     = new Date();
        Date expira    = new Date(ahora.getTime() + expiration);

        return Jwts.builder()
                .subject(usuario.getCorreo())
                .claim("nombre", usuario.getNombre())
                .claim("rol",    usuario.getRol())
                .issuedAt(ahora)
                .expiration(expira)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Extrae el correo del usuario (claim 'sub').
     */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Extrae el rol del usuario (claim 'rol').
     */
    public String extractRole(String token) {
        return extractAllClaims(token).get("rol", String.class);
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
     * Extrae todos los claims del token. Lanza excepcion si el token es invalido.
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
