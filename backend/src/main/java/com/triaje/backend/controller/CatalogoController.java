package com.triaje.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triaje.backend.entity.EstadoCaso;
import com.triaje.backend.entity.NivelPrioridad;
import com.triaje.backend.entity.Sexo;
import com.triaje.backend.entity.TipoIngreso;
import com.triaje.backend.repository.EstadoCasoRepository;
import com.triaje.backend.repository.NivelPrioridadRepository;
import com.triaje.backend.repository.SexoRepository;
import com.triaje.backend.repository.TipoIngresoRepository;

@RestController
@RequestMapping("/api/catalogos")
@CrossOrigin(origins = "*")
public class CatalogoController {

    private final SexoRepository sexoRepository;
    private final TipoIngresoRepository tipoIngresoRepository;
    private final EstadoCasoRepository estadoCasoRepository;
    private final NivelPrioridadRepository nivelPrioridadRepository;

    public CatalogoController(SexoRepository sexoRepository, TipoIngresoRepository tipoIngresoRepository,
            EstadoCasoRepository estadoCasoRepository, NivelPrioridadRepository nivelPrioridadRepository) {
        this.sexoRepository = sexoRepository;
        this.tipoIngresoRepository = tipoIngresoRepository;
        this.estadoCasoRepository = estadoCasoRepository;
        this.nivelPrioridadRepository = nivelPrioridadRepository;
    }

    @GetMapping("/sexos")
    public ResponseEntity<List<Sexo>> sexos() {
        return ResponseEntity.ok(sexoRepository.findAll());
    }

    @GetMapping("/tipos-ingreso")
    public ResponseEntity<List<TipoIngreso>> tiposIngreso() {
        return ResponseEntity.ok(tipoIngresoRepository.findAll());
    }

    @GetMapping("/estados-caso")
    public ResponseEntity<List<EstadoCaso>> estadosCaso() {
        return ResponseEntity.ok(estadoCasoRepository.findAll());
    }

    @GetMapping("/niveles-prioridad")
    public ResponseEntity<List<NivelPrioridad>> nivelesPrioridad() {
        return ResponseEntity.ok(nivelPrioridadRepository.findAll());
    }
}
