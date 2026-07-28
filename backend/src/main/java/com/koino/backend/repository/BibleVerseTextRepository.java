package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.BibleVerseText;

public interface BibleVerseTextRepository
    extends JpaRepository<BibleVerseText, Long> {

    List<BibleVerseText>
        findByVersionCodeAndVerseChapterChapterIdOrderByVerseVerseNumber(
            String versionCode,
            Long chapterId
        );

    Optional<BibleVerseText> findByVersionCodeAndVerseVerseId(
        String versionCode,
        Long verseId
    );

    List<BibleVerseText> findByVersionCode(String versionCode);
}
