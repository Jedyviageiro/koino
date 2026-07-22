package com.koino.backend.service;

public final class BibleTextCleaner {

    private BibleTextCleaner() {
    }

    public static String clean(String text) {
        if (text == null) {
            return null;
        }

        return text.replace("{", "").replace("}", "");
    }
}
