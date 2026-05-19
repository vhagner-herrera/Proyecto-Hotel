package com.hotelbonaventura.auth.repository;

import com.hotelbonaventura.auth.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA para la tabla hotel_auth.usuarios.
 * Spring Data genera las queries automaticamente a partir del nombre del metodo.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    /** Busca un usuario por correo electronico independientemente de su estado. */
    Optional<Usuario> findByCorreo(String correo);

    /** Busca un usuario activo por correo (atajo para validacion directa). */
    Optional<Usuario> findByCorreoAndEstado(String correo, String estado);
}
