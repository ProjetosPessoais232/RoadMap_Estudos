package com.roadmap.estudos.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roadmap.estudos.dto.NoteRewriteRequest;
import com.roadmap.estudos.dto.NoteRewriteResponse;
import com.roadmap.estudos.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class NoteAssistantService {

    private final GeminiClient geminiClient;
    private final StudyNoteService studyNoteService;
    private final ObjectMapper objectMapper;
    private final String systemPrompt;

    public NoteAssistantService(
            GeminiClient geminiClient,
            StudyNoteService studyNoteService,
            ObjectMapper objectMapper,
            @Value("classpath:prompts/note-assistant-system.txt") Resource promptResource
    ) throws IOException {
        this.geminiClient = geminiClient;
        this.studyNoteService = studyNoteService;
        this.objectMapper = objectMapper;
        this.systemPrompt = promptResource.getContentAsString(StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public NoteRewriteResponse rewrite(NoteRewriteRequest request) {
        geminiClient.requireKey();
        studyNoteService.requireOwned(request.noteId());

        String selection = request.selectionMarkdown() == null ? "" : request.selectionMarkdown().trim();
        StringBuilder user = new StringBuilder();
        user.append("Instrução:\n").append(request.instruction().trim()).append("\n\n");
        user.append("Nota completa (markdown):\n").append(request.sourceMarkdown().trim()).append("\n");
        user.append("\nCumpra a instrução no markdown da resposta. ");
        user.append("Se ela pedir para explicar ou adicionar um conceito, inclua essa explicação no markdown; não devolva a nota original intacta.\n");
        if (!selection.isBlank()) {
            user.append("\nReformule SOMENTE este trecho (o markdown da resposta deve ser só o trecho, não a nota inteira):\n");
            user.append(selection).append("\n");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
        body.put("contents", List.of(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", user.toString()))
        )));
        body.put("generationConfig", Map.of(
                "temperature", 0.45,
                "responseMimeType", "application/json",
                "responseSchema", responseSchema()
        ));

        try {
            String raw = geminiClient.generateJsonLong(body);
            NoteRewriteResponse parsed = objectMapper.readValue(geminiClient.stripFences(raw), NoteRewriteResponse.class);
            return sanitize(parsed);
        } catch (ApiException ex) {
            throw ex;
        } catch (RestClientResponseException ex) {
            throw geminiClient.mapGeminiHttp(ex);
        } catch (ResourceAccessException ex) {
            String cause = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Falha de rede ao consultar o Gemini Flash (" + cause + ")");
        } catch (RestClientException ex) {
            throw geminiClient.mapGeminiHttpOrNetwork(ex);
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "A IA não devolveu um JSON válido.");
        }
    }

    private NoteRewriteResponse sanitize(NoteRewriteResponse parsed) {
        if (parsed == null || parsed.markdown() == null || parsed.markdown().isBlank()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "A IA não devolveu um JSON válido.");
        }
        String title = parsed.title() == null || parsed.title().isBlank() ? "Nova anotação" : parsed.title().trim();
        if (title.length() > 160) {
            title = title.substring(0, 160);
        }
        String markdown = parsed.markdown().trim();
        if (markdown.length() > 200_000) {
            markdown = markdown.substring(0, 200_000);
        }
        String aviso = parsed.aviso() == null || parsed.aviso().isBlank() ? null : parsed.aviso().trim();
        return new NoteRewriteResponse(title, markdown, aviso);
    }

    private Map<String, Object> responseSchema() {
        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "title", Map.of("type", "STRING"),
                        "markdown", Map.of("type", "STRING"),
                        "aviso", Map.of("type", "STRING")
                ),
                "required", List.of("title", "markdown", "aviso")
        );
    }
}
