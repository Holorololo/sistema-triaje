package com.triaje.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "niveles_prioridad")
@Getter
@Setter
public class NivelPrioridad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private Integer nivel;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String descripcion;

    @Column(nullable = false, length = 20)
    private String color;

    @Column(name = "tiempo_maximo_minutos")
    private Integer tiempoMaximoMinutos;
}
