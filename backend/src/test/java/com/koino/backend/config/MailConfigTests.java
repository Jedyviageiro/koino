package com.koino.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class MailConfigTests {

    @Test
    void removesDisplayWhitespaceFromGmailAppPassword() {
        assertEquals(
            "abcdefghijklmnop",
            MailConfig.normalizeAppPassword("abcd efgh ijkl mnop")
        );
    }
}
