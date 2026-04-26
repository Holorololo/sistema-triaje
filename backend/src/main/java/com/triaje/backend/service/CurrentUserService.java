package com.triaje.backend.service;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.triaje.backend.entity.Usuario;
import com.triaje.backend.repository.UsuarioRepository;
import com.triaje.backend.security.AuthenticatedUserPrincipal;

@Service
public class CurrentUserService {

    private final UsuarioRepository usuarioRepository;

    public CurrentUserService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Usuario obtenerUsuarioActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUserPrincipal principal)) {
            throw new BadCredentialsException("Debes iniciar sesion para continuar");
        }

        return usuarioRepository.findById(principal.getUserId())
                .filter(usuario -> Boolean.TRUE.equals(usuario.getActivo()))
                .orElseThrow(() -> new BadCredentialsException("Debes iniciar sesion para continuar"));
    }
}
