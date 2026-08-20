package com.roadmap.estudos.service;

import com.roadmap.estudos.domain.Course;
import com.roadmap.estudos.domain.RoadmapNode;
import com.roadmap.estudos.domain.UserAccount;
import com.roadmap.estudos.dto.CourseRequest;
import com.roadmap.estudos.dto.CourseResponse;
import com.roadmap.estudos.exception.ApiException;
import com.roadmap.estudos.repository.CourseRepository;
import com.roadmap.estudos.repository.NodeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final NodeRepository nodeRepository;
    private final CurrentUserService currentUserService;

    public CourseService(
            CourseRepository courseRepository,
            NodeRepository nodeRepository,
            CurrentUserService currentUserService
    ) {
        this.courseRepository = courseRepository;
        this.nodeRepository = nodeRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> listByNode(String nodeId) {
        findNode(nodeId);
        UserAccount user = currentUserService.require();
        return courseRepository.findByNodeAndOwner(nodeId, user.getId()).stream()
                .map(CourseResponse::from)
                .toList();
    }

    @Transactional
    public CourseResponse create(CourseRequest request) {
        Course course = new Course();
        apply(course, request);
        course.setOwner(currentUserService.require());
        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse update(UUID id, CourseRequest request) {
        Course course = owned(id);
        apply(course, request);
        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional
    public void delete(UUID id) {
        courseRepository.delete(owned(id));
    }

    private Course owned(UUID id) {
        UserAccount user = currentUserService.require();
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Curso não encontrado"));
        if (course.getOwner() == null || !course.getOwner().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Este curso pertence a outro usuário");
        }
        return course;
    }

    private void apply(Course course, CourseRequest request) {
        course.setName(request.name().trim());
        course.setPlatform(request.platform().trim());
        course.setUrl(request.url().trim());
        course.setNode(findNode(request.nodeId()));
    }

    private RoadmapNode findNode(String nodeId) {
        return nodeRepository.findById(nodeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nó não encontrado: " + nodeId));
    }
}
