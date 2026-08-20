package com.roadmap.estudos.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ArchitectResponse(
        @JsonProperty("arquitetura_resumo") String arquiteturaResumo,
        @JsonProperty("stack_recomendada") StackRecomendada stackRecomendada,
        @JsonProperty("nodes_para_ativar") List<String> nodesParaAtivar
) {
}
