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

import com.triaje.backend.entity.AtencionMedica;
import com.triaje.backend.service.AtencionMedicaService;

@RestController
@RequestMapping("/api/atenciones-medicas")
@CrossOrigin(origins = "*")
public class AtencionMedicaController {

    private final AtencionMedicaService atencionMedicaService;

    public AtencionMedicaController(AtencionMedicaService atencionMedicaService) {
        this.atencionMedicaService = atencionMedicaService;
    }

    @GetMapping
    public ResponseEntity<List<AtencionMedica>> listar(@RequestParam(required = false) Integer ingresoId) {
        if (ingresoId != null) {
            return ResponseEntity.ok(atencionMedicaService.listarPorIngreso(ingresoId));
        }
        return ResponseEntity.ok(atencionMedicaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtencionMedica> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(atencionMedicaService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<AtencionMedica> crear(@RequestBody AtencionMedica atencionMedica) {
        return ResponseEntity.status(201).body(atencionMedicaService.crear(atencionMedica));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AtencionMedica> actualizar(@PathVariable Integer id, @RequestBody AtencionMedica atencionMedica) {
        return ResponseEntity.ok(atencionMedicaService.actualizar(id, atencionMedica));
    }
}
