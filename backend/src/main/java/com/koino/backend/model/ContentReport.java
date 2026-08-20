package com.koino.backend.model;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "content_reports", indexes = {
    @Index(name = "idx_reports_target_status", columnList = "reported_user_id,status"),
    @Index(name = "idx_reports_created_at", columnList = "created_at")
})
@Getter
@Setter
public class ContentReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reported_user_id", nullable = false)
    private User reportedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private CommunityPost post;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReportReason reason;

    @Column(length = 600)
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ReportStatus status = ReportStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReportSource source = ReportSource.USER;

    @Column(nullable = false)
    private double riskScore;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
