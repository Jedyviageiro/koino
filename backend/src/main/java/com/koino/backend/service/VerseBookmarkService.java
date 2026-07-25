package com.koino.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.Set;

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
    private static final String DEFAULT_HIGHLIGHT_COLOR = "#CFE0FF";
    private static final Set<String> ALLOWED_HIGHLIGHT_COLORS = Set.of(
        "#FFF1A8",
        "#FFD0C7",
        "#FFD6A1",
        "#CDECCF",
        "#BFE7E1",
        "#CFE0FF",
        "#DDD4FF",
        "#F5CFE1"
    );

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
        return addBookmark(userId, verseId, null);
    }

    @Transactional
    public VerseBookmarkResponse addBookmark(
        Long userId,
        Long verseId,
        String highlightColor
    ) {
        String color = validateColor(highlightColor);
        return bookmarkRepository.findByUserUserIdAndVerseVerseId(userId, verseId)
            .map(bookmark -> updateBookmarkColor(bookmark, color))
            .orElseGet(() -> createBookmark(userId, verseId, color));
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

    private VerseBookmarkResponse createBookmark(
        Long userId,
        Long verseId,
        String highlightColor
    ) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("No user found"));
        Verse verse = verseRepository.findById(verseId)
            .orElseThrow(() -> new IllegalArgumentException("No verse found"));

        VerseBookmark bookmark = new VerseBookmark();
        bookmark.setUser(user);
        bookmark.setVerse(verse);
        bookmark.setHighlightColor(highlightColor);
        bookmark.setCreatedAt(Instant.now());
        return toResponse(bookmarkRepository.save(bookmark));
    }

    private VerseBookmarkResponse updateBookmarkColor(
        VerseBookmark bookmark,
        String highlightColor
    ) {
        bookmark.setHighlightColor(highlightColor);
        return toResponse(bookmarkRepository.save(bookmark));
    }

    private String validateColor(String highlightColor) {
        String color = highlightColor == null
            ? DEFAULT_HIGHLIGHT_COLOR
            : highlightColor.toUpperCase();
        if (!ALLOWED_HIGHLIGHT_COLORS.contains(color)) {
            throw new IllegalArgumentException("Unsupported bookmark highlight color");
        }
        return color;
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
            bookmark.getHighlightColor(),
            bookmark.getCreatedAt()
        );
    }
}
