package com.koino.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "watch_videos",
    indexes = @Index(
        name = "idx_watch_videos_category_order",
        columnList = "category, sort_order"
    )
)
@Getter
@Setter
public class WatchVideo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long videoId;

    @Column(nullable = false, unique = true, length = 100)
    private String catalogKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private WatchCategory category;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 100)
    private String creator;

    @Column(nullable = false, length = 2048)
    private String youtubeUrl;

    @Column(length = 32)
    private String youtubeVideoId;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean featured;
}
