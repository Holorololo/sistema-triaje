package com.triaje.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triaje.backend.entity.Triaje;
import com.triaje.backend.service.TriajeService;

@RestController
@RequestMapping("/api/triajes")
@CrossOrigin(origins = "*")
public class TriajeController {

    private final TriajeService triajeService;

    public TriajeController(TriajeService triajeService) {
        this.triajeService = triajeService;
    }

    @GetMapping
    public ResponseEntity<List<Triaje>> listar(@RequestParam(required = false) Integer ingresoId) {
        if (ingresoId != null) {
            return ResponseEntity.ok(List.of(triajeService.obtenerPorIngreso(ingresoId)));
        }
        return ResponseEntity.ok(triajeService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Triaje> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(triajeService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<Triaje> crear(@RequestBody Triaje triaje) {
        return ResponseEntity.status(201).body(triajeService.crear(triaje));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Triaje> actualizar(@PathVariable Integer id, @RequestBody Triaje triaje) {
        return ResponseEntity.ok(triajeService.actualizar(id, triaje));
    }
}
