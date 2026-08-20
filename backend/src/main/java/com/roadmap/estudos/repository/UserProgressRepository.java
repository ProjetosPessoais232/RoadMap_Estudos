package com.roadmap.estudos.repository;

import com.roadmap.estudos.domain.UserAccount;
import com.roadmap.estudos.domain.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserProgressRepository extends JpaRepository<UserProgress, UUID> {

    @Query("SELECT p FROM UserProgress p JOIN FETCH p.node WHERE p.user = :user")
    List<UserProgress> findByUser(@Param("user") UserAccount user);

    Optional<UserProgress> findByUserAndNode_Id(UserAccount user, String nodeId);

    void deleteByNode_Id(String nodeId);
}
