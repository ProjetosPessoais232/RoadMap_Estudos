package com.roadmap.estudos.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roadmap.estudos.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class GeminiClient {

    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final RestClient restClient;
    private final RestClient longRestClient;

    public GeminiClient(
            ObjectMapper objectMapper,
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.model:gemini-2.5-flash}") String model,
            @Value("${gemini.timeout-seconds:30}") int timeoutSeconds
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = buildClient(15, Math.max(timeoutSeconds, 45));
        this.longRestClient = buildClient(15, 90);
    }

    public void requireKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GEMINI_API_KEY não configurada");
        }
    }

    public String generateJson(Map<String, Object> body) {
        return generateJson(body, restClient);
    }

    public String generateJsonLong(Map<String, Object> body) {
        return generateJson(body, longRestClient);
    }

    public String stripFences(String raw) {
        if (raw == null) {
            return "";
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('\n');
            int end = trimmed.lastIndexOf("```");
            if (start > 0 && end > start) {
                return trimmed.substring(start + 1, end).trim();
            }
        }
        return trimmed;
    }

    public ApiException mapGeminiHttpOrNetwork(RestClientException ex) {
        if (ex instanceof RestClientResponseException responseException) {
            return mapGeminiHttp(responseException);
        }
        return new ApiException(HttpStatus.BAD_GATEWAY, "Falha de rede ao consultar o Gemini Flash");
    }

    public ApiException mapGeminiHttp(RestClientResponseException ex) {
        int code = ex.getStatusCode().value();
        String body = ex.getResponseBodyAsString();
        if (code == 404) {
            return new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Modelo Gemini indisponível. O app agora usa gemini-2.5-flash; reinicie o backend."
            );
        }
        if (code == 429 || (body != null && body.contains("RESOURCE_EXHAUSTED"))) {
            return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Cota do Gemini esgotada. Aguarde ou verifique o plano da API.");
        }
        if (code == 400 && body != null && body.contains("API_KEY")) {
            return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Chave do Gemini inválida.");
        }
        if (code == 400) {
            return new ApiException(HttpStatus.BAD_GATEWAY, geminiClientMessage(body, code));
        }
        if (code == 401 || code == 403) {
            return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Chave do Gemini inválida ou sem permissão.");
        }
        return new ApiException(HttpStatus.BAD_GATEWAY, "O Gemini recusou a requisição (HTTP " + code + ").");
    }

    private String generateJson(Map<String, Object> body, RestClient client) {
        List<String> models = List.of(
                model,
                "gemini-2.5-flash",
                "gemini-3.5-flash",
                "gemini-flash-latest"
        );

        RestClientResponseException lastHttp = null;
        for (String candidate : models.stream().distinct().toList()) {
            try {
                return invokeGemini(client, candidate, body);
            } catch (RestClientResponseException ex) {
                lastHttp = ex;
                int code = ex.getStatusCode().value();
                if (code == 404 || code == 400) {
                    continue;
                }
                throw ex;
            }
        }
        if (lastHttp != null) {
            throw lastHttp;
        }
        throw new ApiException(HttpStatus.BAD_GATEWAY, "Nenhum modelo Gemini Flash disponível para esta chave");
    }

    private String invokeGemini(RestClient client, String candidate, Map<String, Object> body) {
        String payload = client.post()
                .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/" + candidate + ":generateContent"))
                .header("x-goog-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode first = root.path("candidates").path(0);
            JsonNode text = first.path("content").path("parts").path(0).path("text");
            if (text.isMissingNode() || text.asText().isBlank()) {
                String reason = first.path("finishReason").asText("sem texto");
                throw new ApiException(HttpStatus.BAD_GATEWAY, "A IA não devolveu um JSON válido (" + reason + ")");
            }
            return text.asText();
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "A IA não devolveu um JSON válido");
        }
    }

    private String geminiClientMessage(String body, int code) {
        if (body == null || body.isBlank()) {
            return "O Gemini recusou a requisição (HTTP " + code + ").";
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            String message = root.path("error").path("message").asText("");
            if (!message.isBlank()) {
                String shortMessage = message.length() > 180 ? message.substring(0, 180) + "…" : message;
                return "O Gemini recusou a requisição: " + shortMessage;
            }
        } catch (Exception ignored) {
            // usa a mensagem padrão
        }
        return "O Gemini recusou a requisição (HTTP " + code + ").";
    }

    private static RestClient buildClient(int connectSeconds, int readSeconds) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(connectSeconds));
        factory.setReadTimeout(Duration.ofSeconds(readSeconds));
        return RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(factory)
                .build();
    }
}
