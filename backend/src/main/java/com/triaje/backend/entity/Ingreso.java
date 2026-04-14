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
@Table(name = "ingresos")
@Getter
@Setter
public class Ingreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "paciente_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Paciente paciente;

    @Column(name = "fecha_hora_ingreso", insertable = false, updatable = false)
    private LocalDateTime fechaHoraIngreso;

    @Column(name = "motivo_consulta", nullable = false)
    private String motivoConsulta;

    @ManyToOne
    @JoinColumn(name = "tipo_ingreso_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private TipoIngreso tipoIngreso;

    @ManyToOne
    @JoinColumn(name = "estado_actual_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EstadoCaso estadoActual;

    @ManyToOne
    @JoinColumn(name = "usuario_registro_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "passwordHash" })
    private Usuario usuarioRegistro;

    @Column(name = "observaciones_recepcion")
    private String observacionesRecepcion;
}
