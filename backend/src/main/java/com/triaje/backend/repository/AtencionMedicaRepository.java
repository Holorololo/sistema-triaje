package com.triaje.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.AtencionMedica;

public interface AtencionMedicaRepository extends JpaRepository<AtencionMedica, Integer> {
    List<AtencionMedica> findByIngresoId(Integer ingresoId);
}
