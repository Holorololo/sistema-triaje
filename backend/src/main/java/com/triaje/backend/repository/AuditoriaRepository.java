package com.triaje.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triaje.backend.entity.Auditoria;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Integer> {
}
