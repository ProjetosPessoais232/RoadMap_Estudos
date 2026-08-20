package com.roadmap.estudos.repository;

import com.roadmap.estudos.domain.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    @Query("SELECT c FROM Course c JOIN FETCH c.node WHERE c.node.id = :nodeId AND c.owner.id = :userId ORDER BY c.name")
    List<Course> findByNodeAndOwner(@Param("nodeId") String nodeId, @Param("userId") UUID userId);

    void deleteByNode_Id(String nodeId);
}
