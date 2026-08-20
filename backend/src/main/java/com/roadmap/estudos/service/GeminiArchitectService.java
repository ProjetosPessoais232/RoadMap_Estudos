package com.roadmap.estudos.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roadmap.estudos.domain.AiRecommendation;
import com.roadmap.estudos.domain.RoadmapNode;
import com.roadmap.estudos.domain.UserAccount;
import com.roadmap.estudos.dto.ArchitectResponse;
import com.roadmap.estudos.dto.ChatTurn;
import com.roadmap.estudos.dto.CourseChatRequest;
import com.roadmap.estudos.dto.CourseChatResponse;
import com.roadmap.estudos.dto.SuggestedCourse;
import com.roadmap.estudos.dto.HistoryResponse;
import com.roadmap.estudos.dto.StackRecomendada;
import com.roadmap.estudos.exception.ApiException;
import com.roadmap.estudos.repository.AiRecommendationRepository;
import com.roadmap.estudos.repository.NodeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Service
public class GeminiArchitectService {

    private final NodeRepository nodeRepository;
    private final AiRecommendationRepository recommendationRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final String systemPrompt;
    private final String chatPrompt;
    private final RestClient restClient;

    public GeminiArchitectService(
            NodeRepository nodeRepository,
            AiRecommendationRepository recommendationRepository,
            CurrentUserService currentUserService,
            ObjectMapper objectMapper,
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.model:gemini-2.5-flash}") String model,
            @Value("${gemini.timeout-seconds:30}") int timeoutSeconds,
            @Value("classpath:prompts/architect-system.txt") Resource promptResource,
            @Value("classpath:prompts/course-chat-system.txt") Resource chatPromptResource
    ) throws IOException {
        this.nodeRepository = nodeRepository;
        this.recommendationRepository = recommendationRepository;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.systemPrompt = promptResource.getContentAsString(StandardCharsets.UTF_8);
        this.chatPrompt = chatPromptResource.getContentAsString(StandardCharsets.UTF_8);
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(15));
        factory.setReadTimeout(Duration.ofSeconds(Math.max(timeoutSeconds, 45)));
        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(factory)
                .build();
    }

    @Transactional
    public ArchitectResponse recommend(String idea) {
        return recommend(idea, status -> { });
    }

    @Transactional
    public ArchitectResponse recommend(String idea, Consumer<String> status) {
        UserAccount user = currentUserService.require();
        status.accept("Carregando o catálogo do roadmap…");
        List<RoadmapNode> nodes = nodeRepository.findAll();
        if (nodes.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Cadastre nós no roadmap antes de consultar a IA");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GEMINI_API_KEY não configurada");
        }

        Set<String> validIds = nodes.stream()
                .map(RoadmapNode::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<Map<String, String>> catalog = nodes.stream()
                .map(node -> Map.of("id", node.getId(), "title", node.getTitle()))
                .toList();

        try {
            status.accept("Consultando Gemini Flash…");
            String raw = callGemini(idea.trim(), catalog);
            status.accept("Validando o JSON da arquitetura…");
            ArchitectResponse parsed = objectMapper.readValue(stripFences(raw), ArchitectResponse.class);
            ArchitectResponse sanitized = sanitize(parsed, validIds);
            saveHistory(user, idea.trim(), sanitized);
            return sanitized;
        } catch (ApiException ex) {
            throw ex;
        } catch (RestClientResponseException ex) {
            throw mapGeminiHttp(ex);
        } catch (ResourceAccessException ex) {
            String cause = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Falha de rede ao consultar o Gemini Flash (" + cause + ")"
            );
        } catch (RestClientException ex) {
            throw mapGeminiHttpOrNetwork(ex);
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "A IA não devolveu um JSON válido. Tente novamente com uma ideia mais objetiva.");
        }
    }

    @Transactional(readOnly = true)
    public CourseChatResponse chatCourses(CourseChatRequest request) {
        currentUserService.require();
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GEMINI_API_KEY não configurada");
        }
        List<RoadmapNode> nodes = nodeRepository.findAll();
        Set<String> validIds = nodes.stream()
                .map(RoadmapNode::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<Map<String, String>> catalog = nodes.stream()
                .map(node -> Map.of("id", node.getId(), "title", node.getTitle()))
                .toList();

        List<Map<String, Object>> contents = new ArrayList<>();
        List<ChatTurn> history = request.history() == null ? List.of() : request.history();
        int start = Math.max(0, history.size() - 12);
        for (ChatTurn turn : history.subList(start, history.size())) {
            appendTurn(contents, turn.role(), turn.content());
        }
        appendTurn(contents, "user", request.message().trim());
        if (contents.isEmpty()) {
            contents.add(userPart(request.message().trim()));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("system_instruction", Map.of("parts", List.of(Map.of(
                "text", chatPrompt + "\n\nCatálogo de nós do roadmap (id e título):\n" + writeJson(catalog)
        ))));
        body.put("contents", contents);
        body.put("generationConfig", Map.of(
                "temperature", 0.4,
                "responseMimeType", "application/json",
                "responseSchema", chatSchema()
        ));

        try {
            String raw = generateJson(body);
            CourseChatResponse parsed = objectMapper.readValue(stripFences(raw), CourseChatResponse.class);
            return sanitizeChat(parsed, validIds);
        } catch (ApiException ex) {
            throw ex;
        } catch (RestClientResponseException ex) {
            throw mapGeminiHttp(ex);
        } catch (ResourceAccessException ex) {
            String cause = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Falha de rede ao consultar o Gemini Flash (" + cause + ")");
        } catch (RestClientException ex) {
            throw mapGeminiHttpOrNetwork(ex);
        } catch (Exception ex) {
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "A IA não devolveu um JSON válido no chat de cursos (" + ex.getClass().getSimpleName() + ")."
            );
        }
    }

    private void appendTurn(List<Map<String, Object>> contents, String role, String content) {
        if (content == null || content.isBlank()) {
            return;
        }
        String geminiRole = "assistant".equals(role) ? "model" : "user";
        if (contents.isEmpty() && "model".equals(geminiRole)) {
            return;
        }
        if (!contents.isEmpty() && geminiRole.equals(contents.getLast().get("role"))) {
            @SuppressWarnings("unchecked")
            List<Map<String, String>> parts = (List<Map<String, String>>) contents.getLast().get("parts");
            String previous = parts.getFirst().get("text");
            contents.set(contents.size() - 1, Map.of(
                    "role", geminiRole,
                    "parts", List.of(Map.of("text", previous + "\n" + content.trim()))
            ));
            return;
        }
        contents.add(Map.of(
                "role", geminiRole,
                "parts", List.of(Map.of("text", content.trim()))
        ));
    }

    private Map<String, Object> userPart(String text) {
        return Map.of("role", "user", "parts", List.of(Map.of("text", text)));
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private CourseChatResponse sanitizeChat(CourseChatResponse parsed, Set<String> validIds) {
        String reply = parsed.resposta() == null || parsed.resposta().isBlank()
                ? "Não consegui montar uma resposta agora. Tente perguntar de outro jeito."
                : parsed.resposta();
        List<SuggestedCourse> filtered = new ArrayList<>();
        if (parsed.cursosSugeridos() != null) {
            for (SuggestedCourse course : parsed.cursosSugeridos()) {
                if (course == null || course.nome() == null || course.url() == null) {
                    continue;
                }
                String url = course.url().trim();
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    continue;
                }
                String nodeId = course.nodeId() == null ? null : course.nodeId().trim().toLowerCase();
                if (nodeId != null && (nodeId.isBlank() || !validIds.contains(nodeId))) {
                    nodeId = null;
                }
                String platform = course.plataforma() == null || course.plataforma().isBlank() ? "Outra" : course.plataforma();
                String name = course.nome().trim();
                if (name.length() > 160) {
                    name = name.substring(0, 160);
                }
                if (platform.length() > 80) {
                    platform = platform.substring(0, 80);
                }
                if (url.length() > 1000) {
                    continue;
                }
                filtered.add(new SuggestedCourse(name, platform, url, nodeId));
                if (filtered.size() == 4) {
                    break;
                }
            }
        }
        return new CourseChatResponse(reply, filtered);
    }

    private Map<String, Object> chatSchema() {
        Map<String, Object> course = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "nome", Map.of("type", "STRING"),
                        "plataforma", Map.of("type", "STRING"),
                        "url", Map.of("type", "STRING"),
                        "node_id", Map.of("type", "STRING")
                ),
                "required", List.of("nome", "plataforma", "url")
        );
        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "resposta", Map.of("type", "STRING"),
                        "cursos_sugeridos", Map.of("type", "ARRAY", "items", course)
                ),
                "required", List.of("resposta", "cursos_sugeridos")
        );
    }

    @Transactional(readOnly = true)
    public List<HistoryResponse> history() {
        UserAccount user = currentUserService.require();
        return recommendationRepository.findByOwnerOrderByCreatedAtDesc(user).stream()
                .map(this::toHistory)
                .toList();
    }

    private void saveHistory(UserAccount user, String idea, ArchitectResponse response) {
        try {
            AiRecommendation row = new AiRecommendation();
            row.setOwner(user);
            row.setIdea(idea);
            row.setArquiteturaResumo(response.arquiteturaResumo());
            row.setStackJson(objectMapper.writeValueAsString(response.stackRecomendada()));
            row.setNodesJson(objectMapper.writeValueAsString(response.nodesParaAtivar()));
            recommendationRepository.save(row);
        } catch (Exception ignored) {
            // histórico não deve derrubar a recomendação
        }
    }

    private HistoryResponse toHistory(AiRecommendation row) {
        try {
            StackRecomendada stack = objectMapper.readValue(row.getStackJson(), StackRecomendada.class);
            List<String> nodes = objectMapper.readValue(row.getNodesJson(), new TypeReference<>() { });
            return new HistoryResponse(
                    row.getId(),
                    row.getIdea(),
                    row.getCreatedAt(),
                    row.getArquiteturaResumo(),
                    stack,
                    nodes
            );
        } catch (Exception ex) {
            return new HistoryResponse(
                    row.getId(),
                    row.getIdea(),
                    row.getCreatedAt(),
                    row.getArquiteturaResumo(),
                    new StackRecomendada("—", "—", "—", List.of()),
                    List.of()
            );
        }
    }

    private ApiException mapGeminiHttpOrNetwork(RestClientException ex) {
        if (ex instanceof RestClientResponseException responseException) {
            return mapGeminiHttp(responseException);
        }
        return new ApiException(HttpStatus.BAD_GATEWAY, "Falha de rede ao consultar o Gemini Flash");
    }

    private ApiException mapGeminiHttp(RestClientResponseException ex) {
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

    private String callGemini(String idea, List<Map<String, String>> catalog) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
        body.put("contents", List.of(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text",
                        "Ideia: " + idea + "\nCatálogo de nós: " + objectMapper.writeValueAsString(catalog)))
        )));
        body.put("generationConfig", Map.of(
                "temperature", 0.2,
                "responseMimeType", "application/json",
                "responseSchema", responseSchema()
        ));
        return generateJson(body);
    }

    private String generateJson(Map<String, Object> body) {
        List<String> models = List.of(
                model,
                "gemini-2.5-flash",
                "gemini-3.5-flash",
                "gemini-flash-latest"
        );

        RestClientResponseException lastHttp = null;
        for (String candidate : models.stream().distinct().toList()) {
            try {
                return invokeGemini(candidate, body);
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

    private String invokeGemini(String candidate, Map<String, Object> body) {
        String payload = restClient.post()
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

    private Map<String, Object> responseSchema() {
        Map<String, Object> stack = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "frontend", Map.of("type", "STRING"),
                        "backend", Map.of("type", "STRING"),
                        "database", Map.of("type", "STRING"),
                        "outros", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"))
                ),
                "required", List.of("frontend", "backend", "database", "outros")
        );
        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "arquitetura_resumo", Map.of("type", "STRING"),
                        "stack_recomendada", stack,
                        "nodes_para_ativar", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"))
                ),
                "required", List.of("arquitetura_resumo", "stack_recomendada", "nodes_para_ativar")
        );
    }

    private ArchitectResponse sanitize(ArchitectResponse parsed, Set<String> validIds) {
        if (parsed.arquiteturaResumo() == null || parsed.stackRecomendada() == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "A IA não devolveu um JSON válido");
        }
        StackRecomendada stack = parsed.stackRecomendada();
        List<String> outros = stack.outros() == null ? List.of() : stack.outros();
        List<String> filtered = new ArrayList<>();
        if (parsed.nodesParaAtivar() != null) {
            for (String id : parsed.nodesParaAtivar()) {
                if (id == null) {
                    continue;
                }
                String normalized = id.trim().toLowerCase();
                if (validIds.contains(normalized) && !filtered.contains(normalized)) {
                    filtered.add(normalized);
                }
            }
        }
        return new ArchitectResponse(
                parsed.arquiteturaResumo(),
                new StackRecomendada(stack.frontend(), stack.backend(), stack.database(), outros),
                filtered
        );
    }

    private String stripFences(String raw) {
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
}
