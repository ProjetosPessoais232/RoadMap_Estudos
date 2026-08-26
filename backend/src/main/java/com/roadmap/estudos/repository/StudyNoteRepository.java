package com.roadmap.estudos.repository;

import com.roadmap.estudos.domain.StudyNote;
import com.roadmap.estudos.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudyNoteRepository extends JpaRepository<StudyNote, UUID> {

    @Query("SELECT n FROM StudyNote n JOIN FETCH n.node WHERE n.owner = :owner ORDER BY n.updatedAt DESC")
    List<StudyNote> findByOwner(@Param("owner") UserAccount owner);

    @Query("SELECT n FROM StudyNote n JOIN FETCH n.node WHERE n.owner = :owner AND n.node.id = :nodeId ORDER BY n.updatedAt DESC")
    List<StudyNote> findByOwnerAndNode(@Param("owner") UserAccount owner, @Param("nodeId") String nodeId);

    Optional<StudyNote> findByIdAndOwner(UUID id, UserAccount owner);

    long countByOwnerAndNode_Id(UserAccount owner, String nodeId);
}
