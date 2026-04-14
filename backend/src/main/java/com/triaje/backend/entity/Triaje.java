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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "triajes")
@Getter
@Setter
public class Triaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "ingreso_id", nullable = false, unique = true)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Ingreso ingreso;

    @ManyToOne
    @JoinColumn(name = "prioridad_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private NivelPrioridad prioridad;

    @ManyToOne
    @JoinColumn(name = "estado_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EstadoCaso estado;

    @Column(columnDefinition = "TEXT")
    private String sintomas;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(columnDefinition = "TEXT")
    private String alergias;

    @Column(name = "antecedentes_relevantes", columnDefinition = "TEXT")
    private String antecedentesRelevantes;

    private Boolean embarazada;

    @Column(name = "dificultad_respiratoria")
    private Boolean dificultadRespiratoria;

    @Column(name = "sangrado_activo")
    private Boolean sangradoActivo;

    private Boolean fiebre;

    @Column(name = "nivel_dolor")
    private Integer nivelDolor;

    @ManyToOne
    @JoinColumn(name = "clasificado_por", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "passwordHash" })
    private Usuario clasificadoPor;

    @Column(name = "fecha_triaje", insertable = false, updatable = false)
    private LocalDateTime fechaTriaje;
}
