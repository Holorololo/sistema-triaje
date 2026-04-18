package com.triaje.backend.service;

import java.math.BigDecimal;
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
        validarSignosVitales(signoVital);

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

    private void validarSignosVitales(SignoVital signoVital) {
        validarRangoDecimal(signoVital.getTemperatura(), "La temperatura", "30", "45");
        validarRangoEntero(signoVital.getPresionSistolica(), "La presión sistólica", 50, 300);
        validarRangoEntero(signoVital.getPresionDiastolica(), "La presión diastólica", 30, 200);
        validarRangoEntero(signoVital.getFrecuenciaCardiaca(), "La frecuencia cardíaca", 20, 250);
        validarRangoEntero(signoVital.getFrecuenciaRespiratoria(), "La frecuencia respiratoria", 5, 80);
        validarRangoDecimal(signoVital.getSaturacionOxigeno(), "La saturación de oxígeno", "0", "100");
        validarRangoDecimal(signoVital.getPesoKg(), "El peso", "0", "500");
        validarRangoDecimal(signoVital.getTallaM(), "La talla", "0.30", "2.50");
        validarRangoDecimal(signoVital.getGlucemia(), "La glucemia", "0", "1000");

        if (signoVital.getPresionSistolica() != null && signoVital.getPresionDiastolica() != null
                && signoVital.getPresionSistolica() < signoVital.getPresionDiastolica()) {
            throw new BadRequestException("La presión sistólica no puede ser menor que la diastólica");
        }
    }

    private void validarRangoEntero(Integer valor, String campo, int min, int max) {
        if (valor == null) {
            return;
        }
        if (valor < min || valor > max) {
            throw new BadRequestException(campo + " debe estar entre " + min + " y " + max);
        }
    }

    private void validarRangoDecimal(BigDecimal valor, String campo, String min, String max) {
        if (valor == null) {
            return;
        }

        BigDecimal minimo = new BigDecimal(min);
        BigDecimal maximo = new BigDecimal(max);
        if (valor.compareTo(minimo) < 0 || valor.compareTo(maximo) > 0) {
            throw new BadRequestException(campo + " debe estar entre " + min + " y " + max);
        }
    }
}
