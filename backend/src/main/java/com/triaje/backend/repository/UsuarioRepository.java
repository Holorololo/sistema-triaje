package com.triaje.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByUsernameIgnoreCase(String username);
    Optional<Usuario> findByEmailIgnoreCase(String email);
    Optional<Usuario> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);
    List<Usuario> findByRolId(Integer rolId);
}
