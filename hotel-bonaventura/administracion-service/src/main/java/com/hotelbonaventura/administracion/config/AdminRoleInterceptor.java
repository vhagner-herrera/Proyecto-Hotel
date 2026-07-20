package com.hotelbonaventura.administracion.config;

import com.hotelbonaventura.administracion.exception.AccesoNoAutorizadoException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Valida el rol ADMINISTRADOR para todas las rutas /api/admin/**.
 * El header X-User-Role lo inyecta el Gateway tras validar el JWT.
 * Centraliza la validacion que antes estaba duplicada en cada controller.
 */
@Component
public class AdminRoleInterceptor implements HandlerInterceptor {

    private static final String HEADER_ROL = "X-User-Role";
    private static final String ROL_REQUERIDO = "ADMINISTRADOR";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!ROL_REQUERIDO.equals(request.getHeader(HEADER_ROL))) {
            throw new AccesoNoAutorizadoException("Acceso denegado. Se requiere rol ADMINISTRADOR");
        }
        return true;
    }
}
