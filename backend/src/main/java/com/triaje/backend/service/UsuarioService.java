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

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository,
            AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.auditoriaService = auditoriaService;
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
        validarUsername(usuario.getUsername(), null);
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
        validarUsername(usuarioActualizado.getUsername(), id);

        usuario.setUsername(usuarioActualizado.getUsername());
        if (usuarioActualizado.getPasswordHash() != null && !usuarioActualizado.getPasswordHash().isBlank()) {
            usuario.setPasswordHash(usuarioActualizado.getPasswordHash());
        }
        usuario.setNombreCompleto(usuarioActualizado.getNombreCompleto());
        usuario.setEmail(usuarioActualizado.getEmail());
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
        usuarioRepository.findByUsername(username).ifPresent(existente -> {
            if (idActual == null || !existente.getId().equals(idActual)) {
                throw new BadRequestException("Ya existe un usuario con ese username");
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
}
