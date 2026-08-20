package com.roadmap.estudos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CourseRequest(
        @NotBlank
        @Size(max = 160)
        String name,

        @NotBlank
        @Size(max = 80)
        String platform,

        @NotBlank
        @Size(max = 1000)
        @Pattern(regexp = "^https?://\\S+$", message = "informe uma URL http ou https válida")
        String url,

        @NotBlank
        String nodeId
) {
}
