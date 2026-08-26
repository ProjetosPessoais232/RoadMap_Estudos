package com.roadmap.estudos.service;

import com.roadmap.estudos.domain.RoadmapNode;
import com.roadmap.estudos.domain.StudyNote;
import com.roadmap.estudos.domain.UserAccount;
import com.roadmap.estudos.dto.StudyNoteResponse;
import com.roadmap.estudos.dto.UpsertStudyNoteRequest;
import com.roadmap.estudos.exception.ApiException;
import com.roadmap.estudos.repository.NodeRepository;
import com.roadmap.estudos.repository.StudyNoteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class StudyNoteService {

    private final StudyNoteRepository studyNoteRepository;
    private final NodeRepository nodeRepository;
    private final CurrentUserService currentUserService;

    public StudyNoteService(
            StudyNoteRepository studyNoteRepository,
            NodeRepository nodeRepository,
            CurrentUserService currentUserService
    ) {
        this.studyNoteRepository = studyNoteRepository;
        this.nodeRepository = nodeRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<StudyNoteResponse> list(String nodeId) {
        UserAccount owner = currentUserService.require();
        List<StudyNote> notes = nodeId == null || nodeId.isBlank()
                ? studyNoteRepository.findByOwner(owner)
                : studyNoteRepository.findByOwnerAndNode(owner, nodeId);
        return notes.stream().map(StudyNoteResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public StudyNoteResponse get(UUID id) {
        return StudyNoteResponse.from(requireOwned(id));
    }

    @Transactional
    public StudyNoteResponse create(UpsertStudyNoteRequest request) {
        UserAccount owner = currentUserService.require();
        if (request.nodeId() == null || request.nodeId().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Escolha a tecnologia desta anotação.");
        }
        RoadmapNode node = nodeRepository.findById(request.nodeId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tecnologia não encontrada no roadmap."));
        StudyNote note = new StudyNote();
        note.setOwner(owner);
        note.setNode(node);
        note.setTitle(request.title().trim());
        note.setBody(request.body() == null ? "" : request.body());
        note.setTags(request.tags());
        note.setReviewFlag(Boolean.TRUE.equals(request.reviewFlag()));
        return StudyNoteResponse.from(studyNoteRepository.save(note));
    }

    @Transactional
    public StudyNoteResponse update(UUID id, UpsertStudyNoteRequest request) {
        StudyNote note = requireOwned(id);
        note.setTitle(request.title().trim());
        note.setBody(request.body() == null ? "" : request.body());
        if (request.tags() != null) {
            note.setTags(request.tags());
        }
        if (request.reviewFlag() != null) {
            note.setReviewFlag(request.reviewFlag());
        }
        if (request.nodeId() != null && !request.nodeId().isBlank() && !request.nodeId().equals(note.getNode().getId())) {
            RoadmapNode node = nodeRepository.findById(request.nodeId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tecnologia não encontrada no roadmap."));
            note.setNode(node);
        }
        return StudyNoteResponse.from(note);
    }

    @Transactional
    public void delete(UUID id) {
        studyNoteRepository.delete(requireOwned(id));
    }

    public StudyNote requireOwned(UUID id) {
        UserAccount owner = currentUserService.require();
        return studyNoteRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Anotação não encontrada."));
    }
}
