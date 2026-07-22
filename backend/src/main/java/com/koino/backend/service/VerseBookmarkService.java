package com.koino.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.user.VerseBookmarkResponse;
import com.koino.backend.model.User;
import com.koino.backend.model.Verse;
import com.koino.backend.model.VerseBookmark;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.repository.VerseBookmarkRepository;
import com.koino.backend.repository.VerseRepository;

@Service
public class VerseBookmarkService {
    private final VerseBookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final VerseRepository verseRepository;

    public VerseBookmarkService(
        VerseBookmarkRepository bookmarkRepository,
        UserRepository userRepository,
        VerseRepository verseRepository
    ) {
        this.bookmarkRepository = bookmarkRepository;
        this.userRepository = userRepository;
        this.verseRepository = verseRepository;
    }

    @Transactional
    public VerseBookmarkResponse addBookmark(Long userId, Long verseId) {
        return bookmarkRepository.findByUserUserIdAndVerseVerseId(userId, verseId)
            .map(this::toResponse)
            .orElseGet(() -> createBookmark(userId, verseId));
    }

    @Transactional(readOnly = true)
    public List<VerseBookmarkResponse> getBookmarks(Long userId) {
        return bookmarkRepository.findByUserUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public void removeBookmark(Long userId, Long verseId) {
        bookmarkRepository.findByUserUserIdAndVerseVerseId(userId, verseId)
            .ifPresent(bookmarkRepository::delete);
    }

    private VerseBookmarkResponse createBookmark(Long userId, Long verseId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("No user found"));
        Verse verse = verseRepository.findById(verseId)
            .orElseThrow(() -> new IllegalArgumentException("No verse found"));

        VerseBookmark bookmark = new VerseBookmark();
        bookmark.setUser(user);
        bookmark.setVerse(verse);
        bookmark.setCreatedAt(Instant.now());
        return toResponse(bookmarkRepository.save(bookmark));
    }

    private VerseBookmarkResponse toResponse(VerseBookmark bookmark) {
        Verse verse = bookmark.getVerse();
        return new VerseBookmarkResponse(
            bookmark.getBookmarkId(),
            verse.getVerseId(),
            verse.getChapter().getBook().getTitle(),
            verse.getChapter().getChapterId(),
            verse.getChapter().getChapterNumber(),
            verse.getVerseNumber(),
            verse.getText(),
            bookmark.getCreatedAt()
        );
    }
}
