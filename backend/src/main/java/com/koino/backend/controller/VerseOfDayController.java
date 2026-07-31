package com.koino.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.bible.VerseOfDayResponse;
import com.koino.backend.model.User;
import com.koino.backend.service.VerseOfDayService;

@RestController
@RequestMapping("/api/verse-of-day")
public class VerseOfDayController {
    private final VerseOfDayService verseOfDayService;

    public VerseOfDayController(VerseOfDayService verseOfDayService) {
        this.verseOfDayService = verseOfDayService;
    }

    @GetMapping
    public VerseOfDayResponse today(@AuthenticationPrincipal User user) {
        return verseOfDayService.forUser(user);
    }
}
