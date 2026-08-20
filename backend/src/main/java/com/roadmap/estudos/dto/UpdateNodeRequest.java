package com.roadmap.estudos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateNodeRequest(
        @NotBlank
        @Size(max = 120)
        String title,
        String description,
        String parentId,
        Double posX,
        Double posY
) {
}
