package com.roadmap.estudos.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChatMessageResponse(UUID id, String role, String content, List<SuggestedCourse> cursosSugeridos, Instant createdAt) { }
