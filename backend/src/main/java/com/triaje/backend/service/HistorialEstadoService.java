package com.triaje.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.triaje.backend.entity.EstadoCaso;
import com.triaje.backend.entity.HistorialEstado;
import com.triaje.backend.entity.Ingreso;
import com.triaje.backend.entity.Usuario;
import com.triaje.backend.repository.HistorialEstadoRepository;

@Service
public class HistorialEstadoService {

    private final HistorialEstadoRepository historialEstadoRepository;

    public HistorialEstadoService(HistorialEstadoRepository historialEstadoRepository) {
        this.historialEstadoRepository = historialEstadoRepository;
    }

    public HistorialEstado registrar(Ingreso ingreso, EstadoCaso estadoAnterior, EstadoCaso estadoNuevo, Usuario cambiadoPor,
            String observacion) {
        HistorialEstado historial = new HistorialEstado();
        historial.setIngreso(ingreso);
        historial.setEstadoAnterior(estadoAnterior);
        historial.setEstadoNuevo(estadoNuevo);
        historial.setCambiadoPor(cambiadoPor);
        historial.setObservacion(observacion);
        return historialEstadoRepository.save(historial);
    }

    public List<HistorialEstado> listarPorIngreso(Integer ingresoId) {
        return historialEstadoRepository.findByIngresoIdOrderByFechaCambioDesc(ingresoId);
    }
}
