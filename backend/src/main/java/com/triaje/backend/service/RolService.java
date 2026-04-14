package com.triaje.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.triaje.backend.entity.Rol;
import com.triaje.backend.exception.BadRequestException;
import com.triaje.backend.exception.ResourceNotFoundException;
import com.triaje.backend.repository.RolRepository;

@Service
public class RolService {

    private final RolRepository rolRepository;

    public RolService(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    public List<Rol> listarTodos() {
        return rolRepository.findAll();
    }

    public Rol obtenerPorId(Integer id) {
        return rolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rol no encontrado"));
    }

    public Rol crear(Rol rol) {
        validarNombreUnico(rol.getNombre(), null);
        return rolRepository.save(rol);
    }

    public Rol actualizar(Integer id, Rol rolActualizado) {
        Rol rol = obtenerPorId(id);
        validarNombreUnico(rolActualizado.getNombre(), id);
        rol.setNombre(rolActualizado.getNombre());
        return rolRepository.save(rol);
    }

    public void eliminar(Integer id) {
        Rol rol = obtenerPorId(id);
        rolRepository.delete(rol);
    }

    private void validarNombreUnico(String nombre, Integer idActual) {
        rolRepository.findByNombreIgnoreCase(nombre).ifPresent(existente -> {
            if (idActual == null || !existente.getId().equals(idActual)) {
                throw new BadRequestException("Ya existe un rol con ese nombre");
            }
        });
    }
}
