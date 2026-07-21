package com.koino.backend.model;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Data
@Table(name = "verses")
public class Verse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long verseId;

    // This links every verse back to its specific chapter (e.g., Matthew 5)
    @ManyToOne
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(nullable = false)
    private Integer verseNumber; // e.g., 3

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text; // The actual text of the verse
}
