package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.koino.backend.model.VerseBookmark;

@Repository
public interface VerseBookmarkRepository extends JpaRepository<VerseBookmark, Long> {
    Optional<VerseBookmark> findByUserUserIdAndVerseVerseId(Long userId, Long verseId);

    List<VerseBookmark> findByUserUserIdOrderByCreatedAtDesc(Long userId);
}
