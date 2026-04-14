package com.triaje.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.HistorialEstado;

public interface HistorialEstadoRepository extends JpaRepository<HistorialEstado, Integer> {
    List<HistorialEstado> findByIngresoIdOrderByFechaCambioDesc(Integer ingresoId);
}
