package com.roadmap.estudos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record NoteRewriteRequest(
        @NotNull
        UUID noteId,

        @NotBlank
        @Size(min = 2, max = 2000)
        String instruction,

        @NotBlank
        @Size(max = 80_000)
        String sourceMarkdown,

        @Size(max = 80_000)
        String selectionMarkdown
) {
}
