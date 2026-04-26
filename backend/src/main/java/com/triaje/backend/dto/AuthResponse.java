package com.triaje.backend.dto;

public record AuthResponse(String token, AuthUserDto usuario) {
}
