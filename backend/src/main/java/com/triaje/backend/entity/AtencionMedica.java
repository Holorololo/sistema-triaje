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
@Table(name = "atenciones_medicas")
@Getter
@Setter
public class AtencionMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ingreso_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Ingreso ingreso;

    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "passwordHash" })
    private Usuario medico;

    @Column(name = "fecha_hora_atencion", insertable = false, updatable = false)
    private LocalDateTime fechaHoraAtencion;

    @Column(name = "diagnostico_presuntivo", columnDefinition = "TEXT")
    private String diagnosticoPresuntivo;

    @Column(name = "conducta_medica", columnDefinition = "TEXT")
    private String conductaMedica;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne
    @JoinColumn(name = "estado_resultante_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EstadoCaso estadoResultante;
}
