package com.koino.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.bible.BibleVersionResponse;
import com.koino.backend.dto.bible.BibleVerseResponse;
import com.koino.backend.model.Book;
import com.koino.backend.model.Chapter;
import com.koino.backend.repository.BookRepository;
import com.koino.backend.repository.ChapterRepository;
import com.koino.backend.service.BibleVersionService;

@RestController
@RequestMapping("/api/bible")
public class BibleController {
    private final BookRepository bookRepository;
    private final ChapterRepository chapterRepository;
    private final BibleVersionService bibleVersionService;

    public BibleController(
        BookRepository bookRepository,
        ChapterRepository chapterRepository,
        BibleVersionService bibleVersionService
    ) {
        this.bookRepository = bookRepository;
        this.chapterRepository = chapterRepository;
        this.bibleVersionService = bibleVersionService;
    }

    @GetMapping("/versions")
    public List<BibleVersionResponse> getVersions() {
        return bibleVersionService.getEnabledVersions();
    }

    @GetMapping("/books")
    public List<Book> getAllBooks() {
        return bookRepository.findAllByOrderByOrderIndexAsc();
    }

    @GetMapping("/books/{bookId}/chapters")
    public List<Chapter> getChaptersByBook(@PathVariable Integer bookId) {
        return chapterRepository.findByBookBookIdOrderByChapterNumber(bookId);
    }

    @GetMapping("/books/{bookTitle}/chapters/{chapterNumber}/verses")
    public List<BibleVerseResponse> getChapterByReference(
        @PathVariable String bookTitle,
        @PathVariable Integer chapterNumber,
        @RequestParam(defaultValue = "KJV") String version
    ) {
        return chapterRepository
            .findByBookTitleIgnoreCaseAndChapterNumber(bookTitle, chapterNumber)
            .map(chapter -> bibleVersionService.getChapter(
                chapter.getChapterId(),
                version
            ))
            .orElseGet(List::of);
    }

    // Get all verses for a specific chapter (e.g., to render a chapter page verse-by-verse)
    @GetMapping("/chapters/{chapterId}/verses")
    public List<BibleVerseResponse> getVersesByChapter(
        @PathVariable Long chapterId,
        @RequestParam(defaultValue = "KJV") String version
    ) {
        return bibleVersionService.getChapter(chapterId, version);
    }
}
