package com.triaje.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.EstadoCaso;

public interface EstadoCasoRepository extends JpaRepository<EstadoCaso, Integer> {
    Optional<EstadoCaso> findByCodigoIgnoreCase(String codigo);
}
