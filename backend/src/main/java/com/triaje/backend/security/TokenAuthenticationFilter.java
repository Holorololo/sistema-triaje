package com.triaje.backend.security;

import java.io.IOException;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.triaje.backend.repository.UsuarioRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UsuarioRepository usuarioRepository;

    public TokenAuthenticationFilter(TokenService tokenService, UsuarioRepository usuarioRepository) {
        this.tokenService = tokenService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");

        if (authorization != null && authorization.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = authorization.substring(7).trim();
            Integer userId = tokenService.extractValidUserId(token);

            if (userId != null) {
                usuarioRepository.findById(userId)
                        .filter(usuario -> Boolean.TRUE.equals(usuario.getActivo()))
                        .ifPresent(usuario -> {
                            String roleName = usuario.getRol() != null ? usuario.getRol().getNombre() : null;
                            String normalizedRole = normalizeRoleName(roleName);
                            List<SimpleGrantedAuthority> authorities = normalizedRole == null
                                    ? List.<SimpleGrantedAuthority>of()
                                    : List.of(new SimpleGrantedAuthority("ROLE_" + normalizedRole));
                            AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                                    usuario.getId(),
                                    usuario.getUsername(),
                                    roleName,
                                    authorities);
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(principal, null, authorities);
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        });
            }
        }

        filterChain.doFilter(request, response);
    }

    private String normalizeRoleName(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toUpperCase(Locale.ROOT);
    }
}
