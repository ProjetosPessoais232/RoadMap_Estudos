package com.roadmap.estudos.dto;

import jakarta.validation.constraints.Size;

public record CreateConversationRequest(@Size(max = 120) String title) { }
