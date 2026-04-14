package com.triaje.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.Paciente;

public interface PacienteRepository extends JpaRepository<Paciente, Integer> {
    Optional<Paciente> findByDocumentoIdentidad(String documentoIdentidad);
}