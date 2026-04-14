package com.triaje.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.TipoIngreso;

public interface TipoIngresoRepository extends JpaRepository<TipoIngreso, Integer> {
}
