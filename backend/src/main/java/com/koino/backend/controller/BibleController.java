package com.koino.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.model.Book;
import com.koino.backend.model.Chapter;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.BookRepository;
import com.koino.backend.repository.ChapterRepository;
import com.koino.backend.repository.VerseRepository;

@RestController
@RequestMapping("/api/bible")
public class BibleController {
    private final BookRepository bookRepository;
    private final VerseRepository verseRepository;
    private final ChapterRepository chapterRepository;

    public BibleController(
        BookRepository bookRepository,
        VerseRepository verseRepository,
        ChapterRepository chapterRepository
    ) {
        this.bookRepository = bookRepository;
        this.verseRepository = verseRepository;
        this.chapterRepository = chapterRepository;
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
    public List<Verse> getChapterByReference(
        @PathVariable String bookTitle,
        @PathVariable Integer chapterNumber
    ) {
        return chapterRepository
            .findByBookTitleIgnoreCaseAndChapterNumber(bookTitle, chapterNumber)
            .map(chapter -> verseRepository
                .findByChapterChapterIdOrderByVerseNumber(chapter.getChapterId()))
            .orElseGet(List::of);
    }

    // Get all verses for a specific chapter (e.g., to render a chapter page verse-by-verse)
    @GetMapping("/chapters/{chapterId}/verses")
    public List<Verse> getVersesByChapter(@PathVariable Long chapterId) {
        return verseRepository.findByChapterChapterIdOrderByVerseNumber(chapterId);
    }
}
