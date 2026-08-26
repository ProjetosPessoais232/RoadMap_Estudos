package com.roadmap.estudos.service;

import com.roadmap.estudos.domain.NodeStyle;
import com.roadmap.estudos.domain.ProgressStatus;
import com.roadmap.estudos.domain.RoadmapNode;
import com.roadmap.estudos.domain.UserAccount;
import com.roadmap.estudos.domain.UserProgress;
import com.roadmap.estudos.dto.CreateNodeRequest;
import com.roadmap.estudos.dto.ImportNodesRequest;
import com.roadmap.estudos.dto.ImportNodesResponse;
import com.roadmap.estudos.dto.NodeResponse;
import com.roadmap.estudos.dto.UpdateNodeRequest;
import com.roadmap.estudos.dto.UpdateStatusRequest;
import com.roadmap.estudos.exception.ApiException;
import com.roadmap.estudos.repository.CourseRepository;
import com.roadmap.estudos.repository.NodeRepository;
import com.roadmap.estudos.repository.UserProgressRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NodeService {

    private final NodeRepository nodeRepository;
    private final CourseRepository courseRepository;
    private final UserProgressRepository userProgressRepository;
    private final CurrentUserService currentUserService;

    public NodeService(
            NodeRepository nodeRepository,
            CourseRepository courseRepository,
            UserProgressRepository userProgressRepository,
            CurrentUserService currentUserService
    ) {
        this.nodeRepository = nodeRepository;
        this.courseRepository = courseRepository;
        this.userProgressRepository = userProgressRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<NodeResponse> list() {
        UserAccount user = currentUserService.require();
        Map<String, ProgressStatus> progress = progressMap(user);
        return nodeRepository.findAllWithParent().stream()
                .map(node -> NodeResponse.from(node, progress.getOrDefault(node.getId(), ProgressStatus.NOT_STARTED)))
                .toList();
    }

    @Transactional(readOnly = true)
    public NodeResponse getById(String id) {
        UserAccount user = currentUserService.require();
        RoadmapNode node = findOrThrow(id);
        ProgressStatus status = userProgressRepository.findByUserAndNode_Id(user, id)
                .map(UserProgress::getStatus)
                .orElse(ProgressStatus.NOT_STARTED);
        return NodeResponse.from(node, status);
    }

    @Transactional
    public NodeResponse create(CreateNodeRequest request) {
        currentUserService.require();
        String id = resolveId(request.id());
        if (nodeRepository.existsById(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Já existe um nó com o id " + id);
        }

        RoadmapNode node = new RoadmapNode();
        node.setId(id);
        node.setTitle(request.title());
        node.setDescription(request.description());
        node.setParent(resolveParent(request.parentId()));
        node.setPosX(request.posX() != null ? request.posX() : 0.0);
        node.setPosY(request.posY() != null ? request.posY() : 0.0);
        node.setStyle(request.style() != null ? request.style().validated() : null);
        return NodeResponse.from(nodeRepository.save(node), ProgressStatus.NOT_STARTED);
    }

    @Transactional
    public ImportNodesResponse importNodes(ImportNodesRequest request) {
        currentUserService.require();
        int created = 0;
        int skipped = 0;
        List<CreateNodeRequest> pending = new ArrayList<>(request.nodes());
        Set<String> existing = nodeRepository.findAll().stream()
                .map(RoadmapNode::getId)
                .collect(Collectors.toCollection(HashSet::new));

        boolean progress = true;
        while (progress && !pending.isEmpty()) {
            progress = false;
            List<CreateNodeRequest> next = new ArrayList<>();
            for (CreateNodeRequest item : pending) {
                String id = resolveId(item.id());
                if (existing.contains(id)) {
                    skipped++;
                    progress = true;
                    continue;
                }
                String parentId = item.parentId();
                if (parentId != null && !parentId.isBlank() && !existing.contains(parentId)) {
                    next.add(item);
                    continue;
                }
                RoadmapNode node = new RoadmapNode();
                node.setId(id);
                node.setTitle(item.title());
                node.setDescription(item.description());
                node.setParent(resolveParent(parentId));
                node.setPosX(item.posX() != null ? item.posX() : 0.0);
                node.setPosY(item.posY() != null ? item.posY() : 0.0);
                node.setStyle(item.style() != null ? item.style().validated() : null);
                nodeRepository.save(node);
                existing.add(id);
                created++;
                progress = true;
            }
            pending = next;
        }
        skipped += pending.size();
        return new ImportNodesResponse(created, skipped);
    }

    @Transactional
    public NodeResponse update(String id, UpdateNodeRequest request) {
        RoadmapNode node = findOrThrow(id);
        node.setTitle(request.title());
        node.setDescription(request.description());
        if (request.posX() != null) {
            node.setPosX(request.posX());
        }
        if (request.posY() != null) {
            node.setPosY(request.posY());
        }
        node.setParent(resolveParentAvoidingCycle(id, request.parentId()));
        return getById(id);
    }

    @Transactional
    public NodeResponse updateStyle(String id, NodeStyle style) {
        currentUserService.require();
        RoadmapNode node = findOrThrow(id);
        node.setStyle(style != null ? style.validated() : null);
        return getById(id);
    }

    @Transactional
    public NodeResponse updateStatus(String id, UpdateStatusRequest request) {
        UserAccount user = currentUserService.require();
        RoadmapNode node = findOrThrow(id);
        UserProgress progress = userProgressRepository.findByUserAndNode_Id(user, id)
                .orElseGet(() -> {
                    UserProgress created = new UserProgress();
                    created.setUser(user);
                    created.setNode(node);
                    return created;
                });
        progress.setStatus(request.status());
        userProgressRepository.save(progress);
        return NodeResponse.from(node, request.status());
    }

    @Transactional
    public void delete(String id) {
        findOrThrow(id);
        if (nodeRepository.existsByParent_Id(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Não é possível remover um nó que possui filhos");
        }
        courseRepository.deleteByNode_Id(id);
        userProgressRepository.deleteByNode_Id(id);
        nodeRepository.deleteById(id);
    }

    private Map<String, ProgressStatus> progressMap(UserAccount user) {
        Map<String, ProgressStatus> map = new HashMap<>();
        for (UserProgress row : userProgressRepository.findByUser(user)) {
            map.put(row.getNode().getId(), row.getStatus());
        }
        return map;
    }

    private RoadmapNode findOrThrow(String id) {
        return nodeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nó não encontrado: " + id));
    }

    private RoadmapNode resolveParent(String parentId) {
        if (parentId == null || parentId.isBlank()) {
            return null;
        }
        return findOrThrow(parentId);
    }

    private RoadmapNode resolveParentAvoidingCycle(String nodeId, String parentId) {
        if (parentId == null || parentId.isBlank()) {
            return null;
        }
        if (nodeId.equals(parentId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Um nó não pode ser pai de si mesmo");
        }
        RoadmapNode parent = findOrThrow(parentId);
        RoadmapNode cursor = parent;
        while (cursor != null) {
            if (nodeId.equals(cursor.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Essa alteração criaria um ciclo na árvore");
            }
            cursor = cursor.getParent();
        }
        return parent;
    }

    private String resolveId(String requested) {
        if (requested != null && !requested.isBlank()) {
            return requested.trim().toLowerCase();
        }
        String id;
        do {
            id = "n-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        } while (nodeRepository.existsById(id));
        return id;
    }
}
