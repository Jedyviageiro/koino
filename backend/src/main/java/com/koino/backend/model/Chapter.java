package com.koino.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Entity
@Data
@Table(
    name = "chapters",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_chapter_book_number",
        columnNames = {"book_id", "chapter_number"}
    )
)
public class Chapter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long chapterId;

    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(nullable = false)
    private Integer chapterNumber; // e.g., 5

    private Integer verseCount; // e.g., 48 (helpful for tracking length)
}
