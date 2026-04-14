package com.triaje.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.Ingreso;

public interface IngresoRepository extends JpaRepository<Ingreso, Integer> {
    List<Ingreso> findByPacienteId(Integer pacienteId);
    List<Ingreso> findByEstadoActualId(Integer estadoId);
}
