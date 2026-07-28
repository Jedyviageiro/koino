package com.koino.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
    name = "bible_verse_texts",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_bible_version_verse",
        columnNames = {"version_code", "verse_id"}
    )
)
public class BibleVerseText {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bibleVerseTextId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_code", nullable = false)
    private BibleVersion version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "verse_id", nullable = false)
    private Verse verse;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;
}
