package com.koino.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.koino.backend.model.Verse;

public interface VerseRepository extends JpaRepository<Verse, Long>{
    List<Verse> findByChapter_ChapterId(Long chapterId);

    List<Verse> findByChapterChapterIdOrderByVerseNumber(Long chapterId);

    @Query("""
        select verse from Verse verse
        join fetch verse.chapter chapter
        join fetch chapter.book book
        order by book.orderIndex, chapter.chapterNumber, verse.verseNumber
        """)
    List<Verse> findAllWithReference();
}

    
