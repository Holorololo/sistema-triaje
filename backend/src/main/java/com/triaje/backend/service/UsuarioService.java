package com.triaje.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.triaje.backend.entity.Rol;
import com.triaje.backend.entity.Usuario;
import com.triaje.backend.exception.BadRequestException;
import com.triaje.backend.exception.ResourceNotFoundException;
import com.triaje.backend.repository.RolRepository;
import com.triaje.backend.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final AuditoriaService auditoriaService;
    private final PasswordService passwordService;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository,
            AuditoriaService auditoriaService, PasswordService passwordService) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.auditoriaService = auditoriaService;
        this.passwordService = passwordService;
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Usuario obtenerPorId(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    public List<Usuario> listarPorRol(Integer rolId) {
        return usuarioRepository.findByRolId(rolId);
    }

    public Usuario crear(Usuario usuario) {
        String username = normalizeRequired(usuario.getUsername(), "El username es obligatorio");
        String nombreCompleto = normalizeRequired(usuario.getNombreCompleto(), "El nombre completo es obligatorio");
        String password = normalizeRequired(usuario.getPasswordHash(), "La contrasena es obligatoria");
        String email = normalizeOptional(usuario.getEmail());

        validarUsername(username, null);
        validarEmail(email, null);

        usuario.setUsername(username);
        usuario.setNombreCompleto(nombreCompleto);
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordService.encodeIfNeeded(password));
        usuario.setRol(obtenerRol(usuario.getRol()));
        if (usuario.getActivo() == null) {
            usuario.setActivo(true);
        }
        Usuario guardado = usuarioRepository.save(usuario);
        auditoriaService.registrar(guardado, "usuarios", guardado.getId(), "CREATE",
                "Registro de usuario " + guardado.getUsername());
        return guardado;
    }

    public Usuario actualizar(Integer id, Usuario usuarioActualizado) {
        Usuario usuario = obtenerPorId(id);
        String username = normalizeRequired(usuarioActualizado.getUsername(), "El username es obligatorio");
        String nombreCompleto = normalizeRequired(usuarioActualizado.getNombreCompleto(),
                "El nombre completo es obligatorio");
        String email = normalizeOptional(usuarioActualizado.getEmail());

        validarUsername(username, id);
        validarEmail(email, id);

        usuario.setUsername(username);
        if (usuarioActualizado.getPasswordHash() != null && !usuarioActualizado.getPasswordHash().isBlank()) {
            usuario.setPasswordHash(passwordService.encodeIfNeeded(usuarioActualizado.getPasswordHash().trim()));
        }
        usuario.setNombreCompleto(nombreCompleto);
        usuario.setEmail(email);
        usuario.setRol(obtenerRol(usuarioActualizado.getRol()));
        usuario.setActivo(usuarioActualizado.getActivo() != null ? usuarioActualizado.getActivo() : usuario.getActivo());
        usuario.setActualizadoEn(LocalDateTime.now());

        Usuario guardado = usuarioRepository.save(usuario);
        auditoriaService.registrar(guardado, "usuarios", guardado.getId(), "UPDATE",
                "Actualizacion de usuario " + guardado.getUsername());
        return guardado;
    }

    public Usuario cambiarEstado(Integer id, Boolean activo) {
        Usuario usuario = obtenerPorId(id);
        usuario.setActivo(activo);
        usuario.setActualizadoEn(LocalDateTime.now());
        Usuario guardado = usuarioRepository.save(usuario);
        auditoriaService.registrar(guardado, "usuarios", guardado.getId(), "UPDATE",
                "Cambio de estado activo=" + activo);
        return guardado;
    }

    private void validarUsername(String username, Integer idActual) {
        usuarioRepository.findByUsernameIgnoreCase(username).ifPresent(existente -> {
            if (idActual == null || !existente.getId().equals(idActual)) {
                throw new BadRequestException("Ya existe un usuario con ese username");
            }
        });
    }

    private void validarEmail(String email, Integer idActual) {
        if (email == null) {
            return;
        }

        usuarioRepository.findByEmailIgnoreCase(email).ifPresent(existente -> {
            if (idActual == null || !existente.getId().equals(idActual)) {
                throw new BadRequestException("Ya existe un usuario con ese correo");
            }
        });
    }

    private Rol obtenerRol(Rol rol) {
        if (rol == null || rol.getId() == null) {
            throw new BadRequestException("El rol es obligatorio");
        }
        return rolRepository.findById(rol.getId())
                .orElseThrow(() -> new BadRequestException("El rol indicado no existe"));
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
