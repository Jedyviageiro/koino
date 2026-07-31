package com.koino.backend.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
    name = "chat_messages",
    indexes = {
        @Index(
            name = "idx_chat_sender_recipient_sent",
            columnList = "sender_id,recipient_id,sent_at"
        ),
        @Index(
            name = "idx_chat_recipient_read",
            columnList = "recipient_id,read_at"
        )
    }
)
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(nullable = false, updatable = false)
    private Instant sentAt;

    private Instant readAt;

    private Instant deliveredAt;

    @PrePersist
    void initialize() {
        if (sentAt == null) {
            sentAt = Instant.now();
        }
    }
}
