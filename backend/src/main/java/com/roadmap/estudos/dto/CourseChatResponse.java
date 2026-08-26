package com.roadmap.estudos.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CourseChatResponse(
        String resposta,
        @JsonProperty("cursos_sugeridos") List<SuggestedCourse> cursosSugeridos,
        UUID conversationId
) {
}
