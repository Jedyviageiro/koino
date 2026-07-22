package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.koino.backend.service.BibleTextCleaner;

class BibleTextCleanerTests {

    @Test
    void removesBracesWithoutRemovingTheirText() {
        String text = "darkness {was} upon the deep. {deep: source note}";

        assertThat(BibleTextCleaner.clean(text))
            .isEqualTo("darkness was upon the deep. deep: source note");
    }

    @Test
    void acceptsTextWithoutBraces() {
        assertThat(BibleTextCleaner.clean("Blessed are the pure in heart."))
            .isEqualTo("Blessed are the pure in heart.");
    }
}
