package com.roadmap.estudos.controller;

import com.roadmap.estudos.dto.CourseResponse;
import com.roadmap.estudos.dto.CreateNodeRequest;
import com.roadmap.estudos.dto.ImportNodesRequest;
import com.roadmap.estudos.dto.ImportNodesResponse;
import com.roadmap.estudos.dto.NodeResponse;
import com.roadmap.estudos.dto.UpdateNodeRequest;
import com.roadmap.estudos.dto.UpdateStatusRequest;
import com.roadmap.estudos.service.CourseService;
import com.roadmap.estudos.service.NodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/nodes")
public class NodeController {

    private final NodeService nodeService;
    private final CourseService courseService;

    public NodeController(NodeService nodeService, CourseService courseService) {
        this.nodeService = nodeService;
        this.courseService = courseService;
    }

    @GetMapping
    public List<NodeResponse> list() {
        return nodeService.list();
    }

    @GetMapping("/{id}")
    public NodeResponse getById(@PathVariable String id) {
        return nodeService.getById(id);
    }

    @GetMapping("/{id}/courses")
    public List<CourseResponse> listCourses(@PathVariable String id) {
        return courseService.listByNode(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NodeResponse create(@Valid @RequestBody CreateNodeRequest request) {
        return nodeService.create(request);
    }

    @PostMapping("/import")
    public ImportNodesResponse importNodes(@Valid @RequestBody ImportNodesRequest request) {
        return nodeService.importNodes(request);
    }

    @PutMapping("/{id}")
    public NodeResponse update(@PathVariable String id, @Valid @RequestBody UpdateNodeRequest request) {
        return nodeService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public NodeResponse updateStatus(@PathVariable String id, @Valid @RequestBody UpdateStatusRequest request) {
        return nodeService.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        nodeService.delete(id);
    }
}
