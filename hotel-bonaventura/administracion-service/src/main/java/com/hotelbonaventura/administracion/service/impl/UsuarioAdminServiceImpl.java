package com.hotelbonaventura.administracion.service.impl;

import com.hotelbonaventura.administracion.dto.ActualizarUsuarioDTO;
import com.hotelbonaventura.administracion.dto.CrearUsuarioDTO;
import com.hotelbonaventura.administracion.dto.UsuarioDTO;
import com.hotelbonaventura.administracion.entity.Usuario;
import com.hotelbonaventura.administracion.exception.CorreoDuplicadoException;
import com.hotelbonaventura.administracion.exception.UsuarioNoEncontradoException;
import com.hotelbonaventura.administracion.repository.UsuarioRepository;
import com.hotelbonaventura.administracion.service.UsuarioAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class UsuarioAdminServiceImpl implements UsuarioAdminService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    @Transactional
    public UsuarioDTO crear(CrearUsuarioDTO dto) {
        if (usuarioRepository.existsByCorreo(dto.getCorreo())) {
            throw new CorreoDuplicadoException("El correo ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setCorreo(dto.getCorreo());
        usuario.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        usuario.setRol(dto.getRol());
        usuario.setEstado("ACTIVO");

        Usuario guardado = usuarioRepository.save(usuario);
        log.info("✅ Usuario creado: {} - {}", guardado.getCorreo(), guardado.getRol());

        return toDTO(guardado);
    }

    @Override
    @Transactional
    public UsuarioDTO actualizar(UUID id, ActualizarUsuarioDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con id: " + id));

        if (dto.getNombre() != null) {
            usuario.setNombre(dto.getNombre());
        }
        if (dto.getRol() != null) {
            usuario.setRol(dto.getRol());
        }

        Usuario guardado = usuarioRepository.save(usuario);
        log.info("✅ Usuario actualizado: {}", guardado.getCorreo());

        return toDTO(guardado);
    }

    @Override
    @Transactional
    public void desactivar(UUID id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con id: " + id));

        usuario.setEstado("INACTIVO");
        usuarioRepository.save(usuario);

        log.info("✅ Usuario desactivado: {}", usuario.getCorreo());
    }

    private UsuarioDTO toDTO(Usuario usuario) {
        return new UsuarioDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getRol(),
                usuario.getEstado(),
                usuario.getCreatedAt()
        );
    }
}
