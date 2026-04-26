package com.triaje.backend.dto;

import com.triaje.backend.entity.Rol;

public record AuthUserDto(
        Integer id,
        String username,
        String nombreCompleto,
        String email,
        Rol rol,
        Boolean activo) {
}
