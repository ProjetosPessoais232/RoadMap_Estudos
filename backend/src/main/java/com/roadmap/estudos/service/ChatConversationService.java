package com.roadmap.estudos.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roadmap.estudos.domain.ChatConversation;
import com.roadmap.estudos.domain.ChatMessage;
import com.roadmap.estudos.domain.UserAccount;
import com.roadmap.estudos.dto.ChatMessageResponse;
import com.roadmap.estudos.dto.ChatTurn;
import com.roadmap.estudos.dto.ConversationResponse;
import com.roadmap.estudos.dto.ConversationSummaryResponse;
import com.roadmap.estudos.dto.SuggestedCourse;
import com.roadmap.estudos.exception.ApiException;
import com.roadmap.estudos.repository.ChatConversationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ChatConversationService {
    private final ChatConversationRepository repository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    public ChatConversationService(ChatConversationRepository repository, CurrentUserService currentUserService, ObjectMapper objectMapper) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> list() {
        return repository.findByOwnerOrderByUpdatedAtDesc(currentUserService.require()).stream().map(this::summary).toList();
    }

    @Transactional
    public ConversationSummaryResponse create(String title) {
        UserAccount owner = currentUserService.require();
        ChatConversation conversation = new ChatConversation();
        conversation.setOwner(owner);
        conversation.setTitle(normalizeTitle(title, "Nova conversa"));
        return summary(repository.save(conversation));
    }

    @Transactional(readOnly = true)
    public ConversationResponse get(UUID id) {
        return detail(requireOwned(id, currentUserService.require()));
    }

    @Transactional
    public ConversationSummaryResponse rename(UUID id, String title) {
        ChatConversation conversation = requireOwned(id, currentUserService.require());
        conversation.setTitle(normalizeTitle(title, null));
        return summary(repository.save(conversation));
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(requireOwned(id, currentUserService.require()));
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> search(String query) {
        if (query == null || query.isBlank()) return list();
        return repository.search(currentUserService.require(), query.trim()).stream().map(this::summary).toList();
    }

    @Transactional
    public ChatConversation openForMessage(UUID id, String firstMessage) {
        UserAccount owner = currentUserService.require();
        if (id != null) return requireOwned(id, owner);
        ChatConversation conversation = new ChatConversation();
        conversation.setOwner(owner);
        conversation.setTitle(titleFrom(firstMessage));
        return repository.save(conversation);
    }

    @Transactional
    public void append(ChatConversation conversation, ChatMessage.Role role, String content, List<SuggestedCourse> courses) {
        ChatMessage message = new ChatMessage();
        message.setRole(role);
        message.setContent(content);
        if (courses != null && !courses.isEmpty()) {
            try { message.setSuggestedCoursesJson(objectMapper.writeValueAsString(courses)); } catch (Exception ignored) { }
        }
        conversation.addMessage(message);
        repository.save(conversation);
    }

    public List<ChatTurn> history(ChatConversation conversation) {
        return conversation.getMessages().stream()
                .map(message -> new ChatTurn(message.getRole() == ChatMessage.Role.ASSISTANT ? "assistant" : "user", message.getContent()))
                .toList();
    }

    private ChatConversation requireOwned(UUID id, UserAccount owner) {
        return repository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Conversa nao encontrada"));
    }

    private ConversationSummaryResponse summary(ChatConversation conversation) {
        return new ConversationSummaryResponse(conversation.getId(), conversation.getTitle(), conversation.getUpdatedAt());
    }

    private ConversationResponse detail(ChatConversation conversation) {
        return new ConversationResponse(conversation.getId(), conversation.getTitle(), conversation.getCreatedAt(), conversation.getUpdatedAt(),
                conversation.getMessages().stream().map(this::message).toList());
    }

    private ChatMessageResponse message(ChatMessage message) {
        List<SuggestedCourse> courses = List.of();
        if (message.getSuggestedCoursesJson() != null && !message.getSuggestedCoursesJson().isBlank()) {
            try { courses = objectMapper.readValue(message.getSuggestedCoursesJson(), new TypeReference<>() { }); } catch (Exception ignored) { }
        }
        return new ChatMessageResponse(message.getId(), message.getRole() == ChatMessage.Role.ASSISTANT ? "assistant" : "user", message.getContent(), courses, message.getCreatedAt());
    }

    private String titleFrom(String message) {
        String compact = message == null ? "" : message.trim().replaceAll("\\s+", " ");
        if (compact.length() <= 40) return compact.isBlank() ? "Nova conversa" : compact;
        return compact.substring(0, 37).trim() + "...";
    }

    private String normalizeTitle(String title, String fallback) {
        String value = title == null ? "" : title.trim().replaceAll("\\s+", " ");
        if (value.isBlank()) {
            if (fallback == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Titulo da conversa e obrigatorio");
            return fallback;
        }
        return value.length() > 120 ? value.substring(0, 120) : value;
    }
}
