package com.triaje.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.triaje.backend.entity.AtencionMedica;
import com.triaje.backend.entity.EstadoCaso;
import com.triaje.backend.entity.Ingreso;
import com.triaje.backend.entity.Usuario;
import com.triaje.backend.exception.BadRequestException;
import com.triaje.backend.exception.ResourceNotFoundException;
import com.triaje.backend.repository.AtencionMedicaRepository;
import com.triaje.backend.repository.EstadoCasoRepository;
import com.triaje.backend.repository.IngresoRepository;
import com.triaje.backend.repository.UsuarioRepository;

@Service
public class AtencionMedicaService {

    private final AtencionMedicaRepository atencionMedicaRepository;
    private final IngresoRepository ingresoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EstadoCasoRepository estadoCasoRepository;
    private final HistorialEstadoService historialEstadoService;
    private final AuditoriaService auditoriaService;

    public AtencionMedicaService(AtencionMedicaRepository atencionMedicaRepository, IngresoRepository ingresoRepository,
            UsuarioRepository usuarioRepository, EstadoCasoRepository estadoCasoRepository,
            HistorialEstadoService historialEstadoService, AuditoriaService auditoriaService) {
        this.atencionMedicaRepository = atencionMedicaRepository;
        this.ingresoRepository = ingresoRepository;
        this.usuarioRepository = usuarioRepository;
        this.estadoCasoRepository = estadoCasoRepository;
        this.historialEstadoService = historialEstadoService;
        this.auditoriaService = auditoriaService;
    }

    public List<AtencionMedica> listarTodas() {
        return atencionMedicaRepository.findAll();
    }

    public List<AtencionMedica> listarPorIngreso(Integer ingresoId) {
        return atencionMedicaRepository.findByIngresoId(ingresoId);
    }

    public AtencionMedica obtenerPorId(Integer id) {
        return atencionMedicaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Atencion medica no encontrada"));
    }

    public AtencionMedica crear(AtencionMedica atencion) {
        Ingreso ingreso = obtenerIngreso(atencion.getIngreso());
        Usuario medico = obtenerUsuario(atencion.getMedico());
        EstadoCaso estadoResultante = obtenerEstadoOpcional(atencion.getEstadoResultante());

        atencion.setIngreso(ingreso);
        atencion.setMedico(medico);
        atencion.setEstadoResultante(estadoResultante);

        AtencionMedica guardada = atencionMedicaRepository.save(atencion);

        if (estadoResultante != null && !estadoResultante.getId().equals(ingreso.getEstadoActual().getId())) {
            historialEstadoService.registrar(ingreso, ingreso.getEstadoActual(), estadoResultante, medico,
                    "Cambio de estado desde atencion medica");
            ingreso.setEstadoActual(estadoResultante);
            ingresoRepository.save(ingreso);
        }

        auditoriaService.registrar(medico, "atenciones_medicas", guardada.getId(), "CREATE",
                "Registro de atencion medica");
        return guardada;
    }

    public AtencionMedica actualizar(Integer id, AtencionMedica actualizada) {
        AtencionMedica atencion = obtenerPorId(id);
        Ingreso ingreso = obtenerIngreso(actualizada.getIngreso() != null ? actualizada.getIngreso() : atencion.getIngreso());
        Usuario medico = obtenerUsuario(actualizada.getMedico() != null ? actualizada.getMedico() : atencion.getMedico());
        EstadoCaso estadoResultante = obtenerEstadoOpcional(actualizada.getEstadoResultante());

        atencion.setIngreso(ingreso);
        atencion.setMedico(medico);
        atencion.setDiagnosticoPresuntivo(actualizada.getDiagnosticoPresuntivo());
        atencion.setConductaMedica(actualizada.getConductaMedica());
        atencion.setObservaciones(actualizada.getObservaciones());
        atencion.setEstadoResultante(estadoResultante);

        if (estadoResultante != null && !estadoResultante.getId().equals(ingreso.getEstadoActual().getId())) {
            historialEstadoService.registrar(ingreso, ingreso.getEstadoActual(), estadoResultante, medico,
                    "Actualizacion de estado desde atencion medica");
            ingreso.setEstadoActual(estadoResultante);
            ingresoRepository.save(ingreso);
        }

        AtencionMedica guardada = atencionMedicaRepository.save(atencion);
        auditoriaService.registrar(medico, "atenciones_medicas", guardada.getId(), "UPDATE",
                "Actualizacion de atencion medica");
        return guardada;
    }

    private Ingreso obtenerIngreso(Ingreso ingreso) {
        if (ingreso == null || ingreso.getId() == null) {
            throw new BadRequestException("El ingreso es obligatorio");
        }
        return ingresoRepository.findById(ingreso.getId())
                .orElseThrow(() -> new BadRequestException("El ingreso indicado no existe"));
    }

    private Usuario obtenerUsuario(Usuario usuario) {
        if (usuario == null || usuario.getId() == null) {
            throw new BadRequestException("El medico es obligatorio");
        }
        return usuarioRepository.findById(usuario.getId())
                .orElseThrow(() -> new BadRequestException("El medico indicado no existe"));
    }

    private EstadoCaso obtenerEstadoOpcional(EstadoCaso estadoCaso) {
        if (estadoCaso == null || estadoCaso.getId() == null) {
            return null;
        }
        return estadoCasoRepository.findById(estadoCaso.getId())
                .orElseThrow(() -> new BadRequestException("El estado resultante no existe"));
    }
}
