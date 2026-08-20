package com.roadmap.estudos.repository;

import com.roadmap.estudos.domain.AiRecommendation;
import com.roadmap.estudos.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AiRecommendationRepository extends JpaRepository<AiRecommendation, UUID> {

    List<AiRecommendation> findByOwnerOrderByCreatedAtDesc(UserAccount owner);
}
