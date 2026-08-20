package com.roadmap.estudos.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_recommendations")
public class AiRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount owner;

    @Column(nullable = false, columnDefinition = "text")
    private String idea;

    @Column(name = "arquitetura_resumo", nullable = false, columnDefinition = "text")
    private String arquiteturaResumo;

    @Column(name = "stack_json", nullable = false, columnDefinition = "text")
    private String stackJson;

    @Column(name = "nodes_json", nullable = false, columnDefinition = "text")
    private String nodesJson;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UserAccount getOwner() {
        return owner;
    }

    public void setOwner(UserAccount owner) {
        this.owner = owner;
    }

    public String getIdea() {
        return idea;
    }

    public void setIdea(String idea) {
        this.idea = idea;
    }

    public String getArquiteturaResumo() {
        return arquiteturaResumo;
    }

    public void setArquiteturaResumo(String arquiteturaResumo) {
        this.arquiteturaResumo = arquiteturaResumo;
    }

    public String getStackJson() {
        return stackJson;
    }

    public void setStackJson(String stackJson) {
        this.stackJson = stackJson;
    }

    public String getNodesJson() {
        return nodesJson;
    }

    public void setNodesJson(String nodesJson) {
        this.nodesJson = nodesJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
