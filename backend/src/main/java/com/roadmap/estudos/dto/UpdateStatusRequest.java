package com.roadmap.estudos.dto;

import com.roadmap.estudos.domain.ProgressStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull ProgressStatus status) {
}
