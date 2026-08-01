package com.koino.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class LocaleControllerTest {
    @Test
    void resolvesBrazilianPortuguese() {
        assertEquals(
            "pt-BR",
            LocaleController.resolveLocale("pt-BR,pt;q=0.9,en;q=0.8")
        );
    }

    @Test
    void defaultsOtherLanguagesToEnglish() {
        assertEquals("en", LocaleController.resolveLocale("fr-FR,en;q=0.8"));
        assertEquals("en", LocaleController.resolveLocale(null));
    }
}
