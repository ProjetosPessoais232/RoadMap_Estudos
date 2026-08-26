package com.roadmap.estudos.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationSummaryResponse(UUID id, String title, Instant updatedAt) { }
