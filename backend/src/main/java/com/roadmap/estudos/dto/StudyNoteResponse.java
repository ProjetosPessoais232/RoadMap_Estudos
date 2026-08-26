package com.roadmap.estudos.dto;

import com.roadmap.estudos.domain.NoteTag;
import com.roadmap.estudos.domain.StudyNote;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StudyNoteResponse(
        UUID id,
        String nodeId,
        String nodeTitle,
        String title,
        String body,
        List<NoteTag> tags,
        boolean reviewFlag,
        Instant createdAt,
        Instant updatedAt
) {
    public static StudyNoteResponse from(StudyNote note) {
        return new StudyNoteResponse(
                note.getId(),
                note.getNode().getId(),
                note.getNode().getTitle(),
                note.getTitle(),
                note.getBody(),
                note.getTags(),
                note.isReviewFlag(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
