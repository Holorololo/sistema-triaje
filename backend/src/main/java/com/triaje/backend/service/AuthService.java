package com.triaje.backend.service;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import com.triaje.backend.dto.AuthResponse;
import com.triaje.backend.dto.AuthUserDto;
import com.triaje.backend.dto.LoginRequest;
import com.triaje.backend.entity.Usuario;
import com.triaje.backend.repository.UsuarioRepository;
import com.triaje.backend.security.TokenService;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordService passwordService;
    private final TokenService tokenService;
    private final CurrentUserService currentUserService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordService passwordService,
            TokenService tokenService, CurrentUserService currentUserService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
        this.currentUserService = currentUserService;
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.identifier().trim();
        Usuario usuario = usuarioRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier, identifier)
                .orElseThrow(() -> new BadCredentialsException("Usuario, correo o contrasena incorrectos"));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new BadCredentialsException("Tu usuario esta inactivo. Contacta al administrador");
        }

        if (!passwordService.matches(request.password(), usuario.getPasswordHash())) {
            throw new BadCredentialsException("Usuario, correo o contrasena incorrectos");
        }

        return new AuthResponse(tokenService.createToken(usuario), mapUser(usuario));
    }

    public AuthUserDto obtenerSesionActual() {
        return mapUser(currentUserService.obtenerUsuarioActual());
    }

    private AuthUserDto mapUser(Usuario usuario) {
        return new AuthUserDto(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getNombreCompleto(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.getActivo());
    }
}
