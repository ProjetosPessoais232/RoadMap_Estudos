package com.roadmap.estudos.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SuggestedCourse(
        @JsonProperty("nome") String nome,
        @JsonProperty("plataforma") String plataforma,
        @JsonProperty("url") String url,
        @JsonProperty("node_id") String nodeId
) {
}
