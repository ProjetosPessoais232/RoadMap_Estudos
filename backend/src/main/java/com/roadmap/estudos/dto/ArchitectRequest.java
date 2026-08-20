package com.roadmap.estudos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ArchitectRequest(
        @NotBlank
        @Size(min = 20, max = 4000, message = "descreva a ideia com pelo menos 20 caracteres")
        String idea
) {
}
