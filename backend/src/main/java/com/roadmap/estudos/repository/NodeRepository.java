package com.roadmap.estudos.repository;

import com.roadmap.estudos.domain.RoadmapNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NodeRepository extends JpaRepository<RoadmapNode, String> {

    boolean existsByParent_Id(String parentId);

    @Query("SELECT n FROM RoadmapNode n LEFT JOIN FETCH n.parent ORDER BY n.title")
    List<RoadmapNode> findAllWithParent();
}
