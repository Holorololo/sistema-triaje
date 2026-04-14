package com.triaje.backend.service;

import org.springframework.stereotype.Service;

import com.triaje.backend.entity.Auditoria;
import com.triaje.backend.entity.Usuario;
import com.triaje.backend.repository.AuditoriaRepository;

@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    public void registrar(Usuario usuario, String tablaAfectada, Integer registroId, String accion, String descripcion) {
        Auditoria auditoria = new Auditoria();
        auditoria.setUsuario(usuario);
        auditoria.setTablaAfectada(tablaAfectada);
        auditoria.setRegistroId(registroId);
        auditoria.setAccion(accion);
        auditoria.setDescripcion(descripcion);
        auditoriaRepository.save(auditoria);
    }
}
