package com.hotelbonaventura.administracion.config;

import com.hotelbonaventura.administracion.exception.AccesoNoAutorizadoException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Valida el rol ADMINISTRADOR o RECEPCIONISTA para las rutas de administracion/dashboard.
 * El header X-User-Role lo inyecta el Gateway tras validar el JWT.
 */
@Component
public class AdminRoleInterceptor implements HandlerInterceptor {

    private static final String HEADER_ROL = "X-User-Role";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String rol = request.getHeader(HEADER_ROL);
        if (!"ADMINISTRADOR".equals(rol) && !"RECEPCIONISTA".equals(rol)) {
            throw new AccesoNoAutorizadoException("Acceso denegado. Se requiere rol autorizado");
        }
        return true;
    }
}
