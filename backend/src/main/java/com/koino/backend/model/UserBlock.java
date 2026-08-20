package com.koino.backend.model;

import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_blocks", uniqueConstraints = @UniqueConstraint(name = "uk_user_block_pair", columnNames = { "blocker_id", "blocked_id" }))
@Getter
@Setter
public class UserBlock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long blockId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
