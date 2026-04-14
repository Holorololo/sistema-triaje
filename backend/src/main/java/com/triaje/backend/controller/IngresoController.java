package com.triaje.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triaje.backend.dto.CambioEstadoRequest;
import com.triaje.backend.entity.HistorialEstado;
import com.triaje.backend.entity.Ingreso;
import com.triaje.backend.service.HistorialEstadoService;
import com.triaje.backend.service.IngresoService;

@RestController
@RequestMapping("/api/ingresos")
@CrossOrigin(origins = "*")
public class IngresoController {

    private final IngresoService ingresoService;
    private final HistorialEstadoService historialEstadoService;

    public IngresoController(IngresoService ingresoService, HistorialEstadoService historialEstadoService) {
        this.ingresoService = ingresoService;
        this.historialEstadoService = historialEstadoService;
    }

    @GetMapping
    public ResponseEntity<List<Ingreso>> listar(@RequestParam(required = false) Integer pacienteId) {
        if (pacienteId != null) {
            return ResponseEntity.ok(ingresoService.listarPorPaciente(pacienteId));
        }
        return ResponseEntity.ok(ingresoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ingreso> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(ingresoService.obtenerPorId(id));
    }

    @GetMapping("/{id}/historial-estados")
    public ResponseEntity<List<HistorialEstado>> historial(@PathVariable Integer id) {
        ingresoService.obtenerPorId(id);
        return ResponseEntity.ok(historialEstadoService.listarPorIngreso(id));
    }

    @PostMapping
    public ResponseEntity<Ingreso> crear(@RequestBody Ingreso ingreso) {
        return ResponseEntity.status(201).body(ingresoService.crear(ingreso));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ingreso> actualizar(@PathVariable Integer id, @RequestBody Ingreso ingreso) {
        return ResponseEntity.ok(ingresoService.actualizar(id, ingreso));
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<Ingreso> cambiarEstado(@PathVariable Integer id, @Validated @RequestBody CambioEstadoRequest request) {
        return ResponseEntity.ok(ingresoService.cambiarEstado(id, request));
    }
}
