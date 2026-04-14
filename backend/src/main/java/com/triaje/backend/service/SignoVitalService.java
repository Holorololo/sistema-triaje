package com.triaje.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.triaje.backend.entity.SignoVital;
import com.triaje.backend.entity.Triaje;
import com.triaje.backend.exception.BadRequestException;
import com.triaje.backend.exception.ResourceNotFoundException;
import com.triaje.backend.repository.SignoVitalRepository;
import com.triaje.backend.repository.TriajeRepository;

@Service
public class SignoVitalService {

    private final SignoVitalRepository signoVitalRepository;
    private final TriajeRepository triajeRepository;
    private final AuditoriaService auditoriaService;

    public SignoVitalService(SignoVitalRepository signoVitalRepository, TriajeRepository triajeRepository,
            AuditoriaService auditoriaService) {
        this.signoVitalRepository = signoVitalRepository;
        this.triajeRepository = triajeRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<SignoVital> listarTodos() {
        return signoVitalRepository.findAll();
    }

    public SignoVital obtenerPorId(Integer id) {
        return signoVitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de signos vitales no encontrado"));
    }

    public SignoVital obtenerPorTriaje(Integer triajeId) {
        return signoVitalRepository.findByTriajeId(triajeId)
                .orElseThrow(() -> new ResourceNotFoundException("No existen signos vitales para ese triaje"));
    }

    public SignoVital guardar(SignoVital signoVital) {
        Triaje triaje = obtenerTriaje(signoVital.getTriaje());
        SignoVital existente = signoVitalRepository.findByTriajeId(triaje.getId()).orElse(null);
        SignoVital objetivo = existente != null ? existente : new SignoVital();

        objetivo.setTriaje(triaje);
        objetivo.setTemperatura(signoVital.getTemperatura());
        objetivo.setPresionSistolica(signoVital.getPresionSistolica());
        objetivo.setPresionDiastolica(signoVital.getPresionDiastolica());
        objetivo.setFrecuenciaCardiaca(signoVital.getFrecuenciaCardiaca());
        objetivo.setFrecuenciaRespiratoria(signoVital.getFrecuenciaRespiratoria());
        objetivo.setSaturacionOxigeno(signoVital.getSaturacionOxigeno());
        objetivo.setPesoKg(signoVital.getPesoKg());
        objetivo.setTallaM(signoVital.getTallaM());
        objetivo.setGlucemia(signoVital.getGlucemia());

        SignoVital guardado = signoVitalRepository.save(objetivo);
        auditoriaService.registrar(triaje.getClasificadoPor(), "signos_vitales", guardado.getId(),
                existente == null ? "CREATE" : "UPDATE", "Registro de signos vitales");
        return guardado;
    }

    private Triaje obtenerTriaje(Triaje triaje) {
        if (triaje == null || triaje.getId() == null) {
            throw new BadRequestException("El triaje es obligatorio");
        }
        return triajeRepository.findById(triaje.getId())
                .orElseThrow(() -> new BadRequestException("El triaje indicado no existe"));
    }
}
