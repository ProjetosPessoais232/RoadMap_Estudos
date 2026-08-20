package com.roadmap.estudos.controller;

import com.roadmap.estudos.dto.ArchitectRequest;
import com.roadmap.estudos.dto.ArchitectResponse;
import com.roadmap.estudos.dto.CourseChatRequest;
import com.roadmap.estudos.dto.CourseChatResponse;
import com.roadmap.estudos.dto.HistoryResponse;
import com.roadmap.estudos.exception.ApiException;
import com.roadmap.estudos.service.GeminiArchitectService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final GeminiArchitectService geminiArchitectService;

    public AiController(GeminiArchitectService geminiArchitectService) {
        this.geminiArchitectService = geminiArchitectService;
    }

    @PostMapping("/recommend")
    public ArchitectResponse recommend(@Valid @RequestBody ArchitectRequest request) {
        return geminiArchitectService.recommend(request.idea());
    }

    @PostMapping("/chat")
    public CourseChatResponse chat(@Valid @RequestBody CourseChatRequest request) {
        return geminiArchitectService.chatCourses(request);
    }

    @PostMapping(value = "/recommend/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@Valid @RequestBody ArchitectRequest request) {
        SseEmitter emitter = new SseEmitter(60_000L);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CompletableFuture.runAsync(() -> {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            try {
                ArchitectResponse result = geminiArchitectService.recommend(request.idea(), message -> {
                    try {
                        emitter.send(SseEmitter.event().name("status").data(Map.of("message", message)));
                    } catch (Exception ignored) {
                        // cliente desconectou
                    }
                });
                emitter.send(SseEmitter.event().name("result").data(result));
                emitter.complete();
            } catch (ApiException ex) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(Map.of(
                            "error", ex.getMessage(),
                            "status", ex.getStatus().value()
                    )));
                } catch (Exception ignored) {
                    // ignore
                }
                emitter.complete();
            } catch (Exception ex) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(Map.of(
                            "error", "Falha inesperada ao arquitetar o projeto"
                    )));
                } catch (Exception ignored) {
                    // ignore
                }
                emitter.completeWithError(ex);
            } finally {
                SecurityContextHolder.clearContext();
            }
        });
        return emitter;
    }

    @GetMapping("/history")
    public List<HistoryResponse> history() {
        return geminiArchitectService.history();
    }
}
