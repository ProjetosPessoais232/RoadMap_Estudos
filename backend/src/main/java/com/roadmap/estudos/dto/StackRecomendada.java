package com.roadmap.estudos.dto;

import java.util.List;

public record StackRecomendada(
        String frontend,
        String backend,
        String database,
        List<String> outros
) {
}
