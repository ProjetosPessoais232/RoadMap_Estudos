package com.roadmap.estudos.dto;

import com.roadmap.estudos.domain.ProgressStatus;
import com.roadmap.estudos.domain.RoadmapNode;

public record NodeResponse(
        String id,
        String title,
        String description,
        String parentId,
        ProgressStatus status,
        Double posX,
        Double posY
) {
    public static NodeResponse from(RoadmapNode node) {
        return from(node, node.getStatus() != null ? node.getStatus() : ProgressStatus.NOT_STARTED);
    }

    public static NodeResponse from(RoadmapNode node, ProgressStatus status) {
        String parentId = node.getParent() != null ? node.getParent().getId() : null;
        return new NodeResponse(
                node.getId(),
                node.getTitle(),
                node.getDescription(),
                parentId,
                status != null ? status : ProgressStatus.NOT_STARTED,
                node.getPosX(),
                node.getPosY()
        );
    }
}
