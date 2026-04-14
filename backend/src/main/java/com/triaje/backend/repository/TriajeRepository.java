package com.triaje.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.Triaje;

public interface TriajeRepository extends JpaRepository<Triaje, Integer> {
    Optional<Triaje> findByIngresoId(Integer ingresoId);
}
