package com.roadmap.estudos.controller;

import com.roadmap.estudos.dto.ConversationResponse;
import com.roadmap.estudos.dto.ConversationSummaryResponse;
import com.roadmap.estudos.dto.CreateConversationRequest;
import com.roadmap.estudos.dto.RenameConversationRequest;
import com.roadmap.estudos.service.ChatConversationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat/conversations")
public class ChatConversationController {
    private final ChatConversationService service;
    public ChatConversationController(ChatConversationService service) { this.service = service; }

    @GetMapping public List<ConversationSummaryResponse> list() { return service.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ConversationSummaryResponse create(@Valid @RequestBody(required = false) CreateConversationRequest request) {
        return service.create(request == null ? null : request.title());
    }
    @GetMapping("/{id}") public ConversationResponse get(@PathVariable UUID id) { return service.get(id); }
    @PatchMapping("/{id}") public ConversationSummaryResponse rename(@PathVariable UUID id, @Valid @RequestBody RenameConversationRequest request) { return service.rename(id, request.title()); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable UUID id) { service.delete(id); }
    @GetMapping("/search") public List<ConversationSummaryResponse> search(@RequestParam @Size(max = 120) String q) { return service.search(q); }
}
