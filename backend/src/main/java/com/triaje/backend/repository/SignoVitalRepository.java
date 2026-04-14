package com.triaje.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.SignoVital;

public interface SignoVitalRepository extends JpaRepository<SignoVital, Integer> {
    Optional<SignoVital> findByTriajeId(Integer triajeId);
}
