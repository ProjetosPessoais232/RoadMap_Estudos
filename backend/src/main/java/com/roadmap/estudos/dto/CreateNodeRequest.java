package com.roadmap.estudos.dto;

import com.roadmap.estudos.domain.NodeStyle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateNodeRequest(
        @Pattern(regexp = "^$|^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "use slug minúsculo, ex: spring-boot")
        String id,

        @NotBlank
        @Size(max = 120)
        String title,

        String description,
        String parentId,
        Double posX,
        Double posY,
        NodeStyle style
) {
}
