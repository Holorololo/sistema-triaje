package com.triaje.backend.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "historial_estados")
@Getter
@Setter
public class HistorialEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ingreso_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Ingreso ingreso;

    @ManyToOne
    @JoinColumn(name = "estado_anterior_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EstadoCaso estadoAnterior;

    @ManyToOne
    @JoinColumn(name = "estado_nuevo_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EstadoCaso estadoNuevo;

    @ManyToOne
    @JoinColumn(name = "cambiado_por", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "passwordHash" })
    private Usuario cambiadoPor;

    @Column(name = "fecha_cambio", insertable = false, updatable = false)
    private LocalDateTime fechaCambio;

    @Column(columnDefinition = "TEXT")
    private String observacion;
}
