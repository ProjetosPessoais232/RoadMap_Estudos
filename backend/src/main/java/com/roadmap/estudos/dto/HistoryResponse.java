package com.roadmap.estudos.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record HistoryResponse(
        UUID id,
        String idea,
        Instant createdAt,
        @JsonProperty("arquitetura_resumo") String arquiteturaResumo,
        @JsonProperty("stack_recomendada") StackRecomendada stackRecomendada,
        @JsonProperty("nodes_para_ativar") List<String> nodesParaAtivar
) {
}
