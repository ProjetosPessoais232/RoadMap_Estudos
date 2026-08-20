package com.roadmap.estudos.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.util.UUID;

@Entity
@Table(name = "user_progress", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "node_id"}))
public class UserProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "node_id", nullable = false)
    private RoadmapNode node;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProgressStatus status = ProgressStatus.NOT_STARTED;

    public UUID getId() {
        return id;
    }

    public UserAccount getUser() {
        return user;
    }

    public void setUser(UserAccount user) {
        this.user = user;
    }

    public RoadmapNode getNode() {
        return node;
    }

    public void setNode(RoadmapNode node) {
        this.node = node;
    }

    public ProgressStatus getStatus() {
        return status;
    }

    public void setStatus(ProgressStatus status) {
        this.status = status;
    }
}
