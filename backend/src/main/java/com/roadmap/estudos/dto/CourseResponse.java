package com.roadmap.estudos.dto;

import com.roadmap.estudos.domain.Course;

import java.util.UUID;

public record CourseResponse(
        UUID id,
        String name,
        String platform,
        String url,
        String nodeId
) {
    public static CourseResponse from(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getPlatform(),
                course.getUrl(),
                course.getNode().getId()
        );
    }
}
