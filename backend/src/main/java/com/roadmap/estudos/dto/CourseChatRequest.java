package com.roadmap.estudos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CourseChatRequest(
        @NotBlank
        @Size(min = 2, max = 4000)
        String message,

        List<@Valid ChatTurn> history
) {
}
