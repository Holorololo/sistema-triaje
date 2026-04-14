package com.triaje.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triaje.backend.entity.SignoVital;
import com.triaje.backend.service.SignoVitalService;

@RestController
@RequestMapping("/api/signos-vitales")
@CrossOrigin(origins = "*")
public class SignoVitalController {

    private final SignoVitalService signoVitalService;

    public SignoVitalController(SignoVitalService signoVitalService) {
        this.signoVitalService = signoVitalService;
    }

    @GetMapping
    public ResponseEntity<List<SignoVital>> listar(@RequestParam(required = false) Integer triajeId) {
        if (triajeId != null) {
            return ResponseEntity.ok(List.of(signoVitalService.obtenerPorTriaje(triajeId)));
        }
        return ResponseEntity.ok(signoVitalService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SignoVital> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(signoVitalService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<SignoVital> guardar(@RequestBody SignoVital signoVital) {
        return ResponseEntity.status(201).body(signoVitalService.guardar(signoVital));
    }
}
