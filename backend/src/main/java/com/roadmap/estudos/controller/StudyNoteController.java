package com.roadmap.estudos.controller;

import com.roadmap.estudos.dto.StudyNoteResponse;
import com.roadmap.estudos.dto.UpsertStudyNoteRequest;
import com.roadmap.estudos.service.StudyNoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
public class StudyNoteController {

    private final StudyNoteService service;

    public StudyNoteController(StudyNoteService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudyNoteResponse> list(@RequestParam(required = false) String nodeId) {
        return service.list(nodeId);
    }

    @GetMapping("/{id}")
    public StudyNoteResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudyNoteResponse create(@Valid @RequestBody UpsertStudyNoteRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public StudyNoteResponse update(@PathVariable UUID id, @Valid @RequestBody UpsertStudyNoteRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
