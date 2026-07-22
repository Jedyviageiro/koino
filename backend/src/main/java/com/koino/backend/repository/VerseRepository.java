package com.koino.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.Verse;

public interface VerseRepository extends JpaRepository<Verse, Long>{
    List<Verse> findByChapter_ChapterId(Long chapterId);

    List<Verse> findByChapterChapterIdOrderByVerseNumber(Long chapterId);
}

    
