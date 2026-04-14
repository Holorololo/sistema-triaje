package com.triaje.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CambioEstadoRequest {

    @NotNull(message = "El estado nuevo es obligatorio")
    private Integer estadoNuevoId;

    @NotNull(message = "El usuario que realiza el cambio es obligatorio")
    private Integer cambiadoPorId;

    private String observacion;
}
