package com.koino.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.model.Book;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.BookRepository;
import com.koino.backend.repository.VerseRepository;

@RestController
@RequestMapping("/api/bible")
public class BibleController {
    private final BookRepository bookRepository;
    private final VerseRepository verseRepository;

    public BibleController(BookRepository bookRepository, VerseRepository verseRepository) {
        this.bookRepository = bookRepository;
        this.verseRepository = verseRepository;
    }

    @GetMapping("/books")
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // Get all verses for a specific chapter (e.g., to render a chapter page verse-by-verse)
    @GetMapping("/chapters/{chapterId}/verses")
    public List<Verse> getVersesByChapter(@PathVariable Long chapterId) {
        return verseRepository.findByChapter_ChapterId(chapterId);
    }
}
