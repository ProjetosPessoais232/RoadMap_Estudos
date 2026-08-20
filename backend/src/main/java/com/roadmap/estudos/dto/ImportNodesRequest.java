package com.roadmap.estudos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ImportNodesRequest(@NotEmpty List<@Valid CreateNodeRequest> nodes) {
}
