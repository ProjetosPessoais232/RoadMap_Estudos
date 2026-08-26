package com.roadmap.estudos.dto;

import com.roadmap.estudos.domain.NoteTag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpsertStudyNoteRequest(
        String nodeId,
        @NotBlank @Size(max = 160) String title,
        @Size(max = 200000) String body,
        List<NoteTag> tags,
        Boolean reviewFlag
) {
}
