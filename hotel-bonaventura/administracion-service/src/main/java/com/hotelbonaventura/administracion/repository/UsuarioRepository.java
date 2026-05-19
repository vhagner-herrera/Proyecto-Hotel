package com.hotelbonaventura.administracion.repository;

import com.hotelbonaventura.administracion.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByCorreo(String correo);
    List<Usuario> findByEstado(String estado);
    long countByEstado(String estado);
}
