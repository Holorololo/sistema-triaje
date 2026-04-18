package com.triaje.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.triaje.backend.entity.Paciente;
import com.triaje.backend.entity.Sexo;
import com.triaje.backend.exception.BadRequestException;
import com.triaje.backend.exception.ResourceNotFoundException;
import com.triaje.backend.repository.PacienteRepository;
import com.triaje.backend.repository.SexoRepository;

@Service
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final SexoRepository sexoRepository;

    public PacienteService(PacienteRepository pacienteRepository, SexoRepository sexoRepository) {
        this.pacienteRepository = pacienteRepository;
        this.sexoRepository = sexoRepository;
    }

    public List<Paciente> listarTodos() {
        return pacienteRepository.findAll();
    }

    public Paciente obtenerPorId(Integer id) {
        return pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado"));
    }

    public Paciente buscarPorDocumento(String documentoIdentidad) {
        return pacienteRepository.findByDocumentoIdentidad(documentoIdentidad)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado con ese documento"));
    }

    public Paciente crear(Paciente paciente) {
        validarDocumentoDuplicado(paciente.getDocumentoIdentidad(), null);
        paciente.setSexo(validarSexo(paciente.getSexo()));
        return pacienteRepository.save(paciente);
    }

    public Paciente actualizar(Integer id, Paciente pacienteActualizado) {
        Paciente pacienteExistente = obtenerPorId(id);
        validarDocumentoDuplicado(pacienteActualizado.getDocumentoIdentidad(), id);
        pacienteExistente.setNombres(pacienteActualizado.getNombres());
        pacienteExistente.setApellidos(pacienteActualizado.getApellidos());
        pacienteExistente.setDocumentoIdentidad(pacienteActualizado.getDocumentoIdentidad());
        pacienteExistente.setFechaNacimiento(pacienteActualizado.getFechaNacimiento());
        pacienteExistente.setSexo(validarSexo(pacienteActualizado.getSexo()));
        pacienteExistente.setTelefono(pacienteActualizado.getTelefono());
        pacienteExistente.setDireccion(pacienteActualizado.getDireccion());
        pacienteExistente.setContactoEmergenciaNombre(pacienteActualizado.getContactoEmergenciaNombre());
        pacienteExistente.setContactoEmergenciaTelefono(pacienteActualizado.getContactoEmergenciaTelefono());
        pacienteExistente.setActualizadoEn(LocalDateTime.now());

        return pacienteRepository.save(pacienteExistente);
    }

    public void eliminar(Integer id) {
        Paciente paciente = obtenerPorId(id);
        pacienteRepository.delete(paciente);
    }

    private void validarDocumentoDuplicado(String documentoIdentidad, Integer idActual) {
        if (documentoIdentidad == null || documentoIdentidad.isBlank()) {
            return;
        }

        Optional<Paciente> pacienteExistente = pacienteRepository.findByDocumentoIdentidad(documentoIdentidad);

        if (pacienteExistente.isPresent()) {
            if (idActual == null || !pacienteExistente.get().getId().equals(idActual)) {
                throw new BadRequestException("Ya existe un paciente con ese documento de identidad");
            }
        }
    }

    private Sexo validarSexo(Sexo sexo) {
        if (sexo == null || sexo.getId() == null) {
            return null;
        }

        return sexoRepository.findById(sexo.gwetId())
                .orElseThrow(() -> new BadRequestException("El sexo indicado no existe"));
    }
}
