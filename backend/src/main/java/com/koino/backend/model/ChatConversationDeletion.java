package com.koino.backend.model;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
    name = "chat_conversation_deletions",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_chat_deletion_owner_friend",
        columnNames = {"owner_id", "friend_id"}
    )
)
public class ChatConversationDeletion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long deletionId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(optional = false)
    @JoinColumn(name = "friend_id", nullable = false)
    private User friend;

    private Instant hiddenBefore;

    @PrePersist
    void initialize() {
        if (hiddenBefore == null) hiddenBefore = Instant.now();
    }
}
