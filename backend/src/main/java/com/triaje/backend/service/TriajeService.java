package com.triaje.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.triaje.backend.entity.EstadoCaso;
import com.triaje.backend.entity.Ingreso;
import com.triaje.backend.entity.NivelPrioridad;
import com.triaje.backend.entity.Triaje;
import com.triaje.backend.entity.Usuario;
import com.triaje.backend.exception.BadRequestException;
import com.triaje.backend.exception.ResourceNotFoundException;
import com.triaje.backend.repository.EstadoCasoRepository;
import com.triaje.backend.repository.IngresoRepository;
import com.triaje.backend.repository.NivelPrioridadRepository;
import com.triaje.backend.repository.TriajeRepository;
import com.triaje.backend.repository.UsuarioRepository;

@Service
public class TriajeService {

    private final TriajeRepository triajeRepository;
    private final IngresoRepository ingresoRepository;
    private final NivelPrioridadRepository nivelPrioridadRepository;
    private final EstadoCasoRepository estadoCasoRepository;
    private final UsuarioRepository usuarioRepository;
    private final HistorialEstadoService historialEstadoService;
    private final AuditoriaService auditoriaService;

    public TriajeService(TriajeRepository triajeRepository, IngresoRepository ingresoRepository,
            NivelPrioridadRepository nivelPrioridadRepository, EstadoCasoRepository estadoCasoRepository,
            UsuarioRepository usuarioRepository, HistorialEstadoService historialEstadoService,
            AuditoriaService auditoriaService) {
        this.triajeRepository = triajeRepository;
        this.ingresoRepository = ingresoRepository;
        this.nivelPrioridadRepository = nivelPrioridadRepository;
        this.estadoCasoRepository = estadoCasoRepository;
        this.usuarioRepository = usuarioRepository;
        this.historialEstadoService = historialEstadoService;
        this.auditoriaService = auditoriaService;
    }

    public List<Triaje> listarTodos() {
        return triajeRepository.findAll();
    }

    public Triaje obtenerPorId(Integer id) {
        return triajeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Triaje no encontrado"));
    }

    public Triaje obtenerPorIngreso(Integer ingresoId) {
        return triajeRepository.findByIngresoId(ingresoId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe triaje para ese ingreso"));
    }

    public Triaje crear(Triaje triaje) {
        Ingreso ingreso = obtenerIngreso(triaje.getIngreso());
        triajeRepository.findByIngresoId(ingreso.getId()).ifPresent(existente -> {
            throw new BadRequestException("Ese ingreso ya tiene un triaje registrado");
        });

        NivelPrioridad prioridad = obtenerPrioridad(triaje.getPrioridad());
        EstadoCaso estado = obtenerEstado(triaje.getEstado());
        Usuario usuario = obtenerUsuario(triaje.getClasificadoPor());
        validarNivelDolor(triaje.getNivelDolor());

        triaje.setIngreso(ingreso);
        triaje.setPrioridad(prioridad);
        triaje.setEstado(estado);
        triaje.setClasificadoPor(usuario);

        Triaje guardado = triajeRepository.save(triaje);
        historialEstadoService.registrar(ingreso, ingreso.getEstadoActual(), estado, usuario,
                "Clasificacion de triaje");
        ingreso.setEstadoActual(estado);
        ingresoRepository.save(ingreso);
        auditoriaService.registrar(usuario, "triajes", guardado.getId(), "CREATE",
                "Registro de triaje para ingreso " + ingreso.getId());
        return guardado;
    }

    public Triaje actualizar(Integer id, Triaje triajeActualizado) {
        Triaje triaje = obtenerPorId(id);
        Ingreso ingreso = obtenerIngreso(triajeActualizado.getIngreso() != null ? triajeActualizado.getIngreso() : triaje.getIngreso());
        NivelPrioridad prioridad = obtenerPrioridad(triajeActualizado.getPrioridad());
        EstadoCaso estado = obtenerEstado(triajeActualizado.getEstado());
        Usuario usuario = obtenerUsuario(triajeActualizado.getClasificadoPor());
        validarNivelDolor(triajeActualizado.getNivelDolor());

        triaje.setIngreso(ingreso);
        triaje.setPrioridad(prioridad);
        triaje.setEstado(estado);
        triaje.setSintomas(triajeActualizado.getSintomas());
        triaje.setObservaciones(triajeActualizado.getObservaciones());
        triaje.setAlergias(triajeActualizado.getAlergias());
        triaje.setAntecedentesRelevantes(triajeActualizado.getAntecedentesRelevantes());
        triaje.setEmbarazada(triajeActualizado.getEmbarazada());
        triaje.setDificultadRespiratoria(triajeActualizado.getDificultadRespiratoria());
        triaje.setSangradoActivo(triajeActualizado.getSangradoActivo());
        triaje.setFiebre(triajeActualizado.getFiebre());
        triaje.setNivelDolor(triajeActualizado.getNivelDolor());
        triaje.setClasificadoPor(usuario);

        if (!estado.getId().equals(ingreso.getEstadoActual().getId())) {
            historialEstadoService.registrar(ingreso, ingreso.getEstadoActual(), estado, usuario,
                    "Actualizacion de estado desde triaje");
            ingreso.setEstadoActual(estado);
            ingresoRepository.save(ingreso);
        }

        Triaje guardado = triajeRepository.save(triaje);
        auditoriaService.registrar(usuario, "triajes", guardado.getId(), "UPDATE", "Actualizacion de triaje");
        return guardado;
    }

    private Ingreso obtenerIngreso(Ingreso ingreso) {
        if (ingreso == null || ingreso.getId() == null) {
            throw new BadRequestException("El ingreso es obligatorio");
        }
        return ingresoRepository.findById(ingreso.getId())
                .orElseThrow(() -> new BadRequestException("El ingreso indicado no existe"));
    }

    private NivelPrioridad obtenerPrioridad(NivelPrioridad prioridad) {
        if (prioridad == null || prioridad.getId() == null) {
            throw new BadRequestException("La prioridad es obligatoria");
        }
        return nivelPrioridadRepository.findById(prioridad.getId())
                .orElseThrow(() -> new BadRequestException("La prioridad indicada no existe"));
    }

    private EstadoCaso obtenerEstado(EstadoCaso estado) {
        if (estado == null || estado.getId() == null) {
            throw new BadRequestException("El estado del triaje es obligatorio");
        }
        return estadoCasoRepository.findById(estado.getId())
                .orElseThrow(() -> new BadRequestException("El estado indicado no existe"));
    }

    private Usuario obtenerUsuario(Usuario usuario) {
        if (usuario == null || usuario.getId() == null) {
            throw new BadRequestException("El usuario clasificador es obligatorio");
        }
        return usuarioRepository.findById(usuario.getId())
                .orElseThrow(() -> new BadRequestException("El usuario clasificador no existe"));
    }

    private void validarNivelDolor(Integer nivelDolor) {
        if (nivelDolor != null && (nivelDolor < 0 || nivelDolor > 10)) {
            throw new BadRequestException("El nivel de dolor debe estar entre 0 y 10");
        }
    }
}
