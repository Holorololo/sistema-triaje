package com.triaje.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.triaje.backend.dto.CambioEstadoRequest;
import com.triaje.backend.entity.EstadoCaso;
import com.triaje.backend.entity.Ingreso;
import com.triaje.backend.entity.Paciente;
import com.triaje.backend.entity.TipoIngreso;
import com.triaje.backend.entity.Usuario;
import com.triaje.backend.exception.BadRequestException;
import com.triaje.backend.exception.ResourceNotFoundException;
import com.triaje.backend.repository.EstadoCasoRepository;
import com.triaje.backend.repository.IngresoRepository;
import com.triaje.backend.repository.PacienteRepository;
import com.triaje.backend.repository.TipoIngresoRepository;
import com.triaje.backend.repository.UsuarioRepository;

@Service
public class IngresoService {

    private final IngresoRepository ingresoRepository;
    private final PacienteRepository pacienteRepository;
    private final TipoIngresoRepository tipoIngresoRepository;
    private final EstadoCasoRepository estadoCasoRepository;
    private final UsuarioRepository usuarioRepository;
    private final HistorialEstadoService historialEstadoService;
    private final AuditoriaService auditoriaService;

    public IngresoService(IngresoRepository ingresoRepository, PacienteRepository pacienteRepository,
            TipoIngresoRepository tipoIngresoRepository, EstadoCasoRepository estadoCasoRepository,
            UsuarioRepository usuarioRepository, HistorialEstadoService historialEstadoService,
            AuditoriaService auditoriaService) {
        this.ingresoRepository = ingresoRepository;
        this.pacienteRepository = pacienteRepository;
        this.tipoIngresoRepository = tipoIngresoRepository;
        this.estadoCasoRepository = estadoCasoRepository;
        this.usuarioRepository = usuarioRepository;
        this.historialEstadoService = historialEstadoService;
        this.auditoriaService = auditoriaService;
    }

    public List<Ingreso> listarTodos() {
        return ingresoRepository.findAll();
    }

    public List<Ingreso> listarPorPaciente(Integer pacienteId) {
        return ingresoRepository.findByPacienteId(pacienteId);
    }

    public Ingreso obtenerPorId(Integer id) {
        return ingresoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ingreso no encontrado"));
    }

    public Ingreso crear(Ingreso ingreso) {
        Paciente paciente = obtenerPaciente(ingreso.getPaciente());
        TipoIngreso tipoIngreso = obtenerTipoIngreso(ingreso.getTipoIngreso());
        EstadoCaso estadoActual = obtenerEstado(ingreso.getEstadoActual(), "El estado inicial es obligatorio");
        Usuario usuarioRegistro = obtenerUsuario(ingreso.getUsuarioRegistro(), "El usuario de registro es obligatorio");

        ingreso.setPaciente(paciente);
        ingreso.setTipoIngreso(tipoIngreso);
        ingreso.setEstadoActual(estadoActual);
        ingreso.setUsuarioRegistro(usuarioRegistro);

        Ingreso guardado = ingresoRepository.save(ingreso);
        historialEstadoService.registrar(guardado, null, estadoActual, usuarioRegistro, "Estado inicial del caso");
        auditoriaService.registrar(usuarioRegistro, "ingresos", guardado.getId(), "CREATE",
                "Registro de ingreso para paciente " + paciente.getId());
        return guardado;
    }

    public Ingreso actualizar(Integer id, Ingreso ingresoActualizado) {
        Ingreso ingreso = obtenerPorId(id);
        ingreso.setPaciente(obtenerPaciente(ingresoActualizado.getPaciente()));
        ingreso.setMotivoConsulta(ingresoActualizado.getMotivoConsulta());
        ingreso.setTipoIngreso(obtenerTipoIngreso(ingresoActualizado.getTipoIngreso()));
        ingreso.setObservacionesRecepcion(ingresoActualizado.getObservacionesRecepcion());
        if (ingresoActualizado.getUsuarioRegistro() != null) {
            ingreso.setUsuarioRegistro(obtenerUsuario(ingresoActualizado.getUsuarioRegistro(), "El usuario de registro es obligatorio"));
        }
        if (ingresoActualizado.getEstadoActual() != null && ingresoActualizado.getEstadoActual().getId() != null) {
            EstadoCaso nuevoEstado = obtenerEstado(ingresoActualizado.getEstadoActual(), "El estado indicado no existe");
            if (!nuevoEstado.getId().equals(ingreso.getEstadoActual().getId())) {
                historialEstadoService.registrar(ingreso, ingreso.getEstadoActual(), nuevoEstado, ingreso.getUsuarioRegistro(),
                        "Cambio de estado desde actualizacion de ingreso");
                ingreso.setEstadoActual(nuevoEstado);
            }
        }
        Ingreso guardado = ingresoRepository.save(ingreso);
        auditoriaService.registrar(guardado.getUsuarioRegistro(), "ingresos", guardado.getId(), "UPDATE",
                "Actualizacion de ingreso");
        return guardado;
    }

    public Ingreso cambiarEstado(Integer ingresoId, CambioEstadoRequest request) {
        Ingreso ingreso = obtenerPorId(ingresoId);
        EstadoCaso nuevoEstado = estadoCasoRepository.findById(request.getEstadoNuevoId())
                .orElseThrow(() -> new BadRequestException("El estado nuevo no existe"));
        Usuario usuario = usuarioRepository.findById(request.getCambiadoPorId())
                .orElseThrow(() -> new BadRequestException("El usuario que cambia el estado no existe"));

        historialEstadoService.registrar(ingreso, ingreso.getEstadoActual(), nuevoEstado, usuario, request.getObservacion());
        ingreso.setEstadoActual(nuevoEstado);
        Ingreso guardado = ingresoRepository.save(ingreso);
        auditoriaService.registrar(usuario, "ingresos", guardado.getId(), "UPDATE",
                "Cambio de estado a " + nuevoEstado.getCodigo());
        return guardado;
    }

    private Paciente obtenerPaciente(Paciente paciente) {
        if (paciente == null || paciente.getId() == null) {
            throw new BadRequestException("El paciente es obligatorio");
        }
        return pacienteRepository.findById(paciente.getId())
                .orElseThrow(() -> new BadRequestException("El paciente indicado no existe"));
    }

    private TipoIngreso obtenerTipoIngreso(TipoIngreso tipoIngreso) {
        if (tipoIngreso == null || tipoIngreso.getId() == null) {
            return null;
        }
        return tipoIngresoRepository.findById(tipoIngreso.getId())
                .orElseThrow(() -> new BadRequestException("El tipo de ingreso no existe"));
    }

    private EstadoCaso obtenerEstado(EstadoCaso estado, String mensajeSiFalta) {
        if (estado == null || estado.getId() == null) {
            throw new BadRequestException(mensajeSiFalta);
        }
        return estadoCasoRepository.findById(estado.getId())
                .orElseThrow(() -> new BadRequestException("El estado indicado no existe"));
    }

    private Usuario obtenerUsuario(Usuario usuario, String mensajeSiFalta) {
        if (usuario == null || usuario.getId() == null) {
            throw new BadRequestException(mensajeSiFalta);
        }
        return usuarioRepository.findById(usuario.getId())
                .orElseThrow(() -> new BadRequestException("El usuario indicado no existe"));
    }
}
