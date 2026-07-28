package com.koino.backend.utils;

import java.util.regex.Pattern;

public final class PasswordPolicy {
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern NUMBER = Pattern.compile("\\d");
    private static final Pattern SYMBOL = Pattern.compile("[^A-Za-z0-9\\s]");

    private PasswordPolicy() {
    }

    public static void requireStrong(String password) {
        if (password == null
            || password.length() < 8
            || password.length() > 72
            || !UPPERCASE.matcher(password).find()
            || !LOWERCASE.matcher(password).find()
            || !NUMBER.matcher(password).find()
            || !SYMBOL.matcher(password).find()) {
            throw new IllegalArgumentException(
                "Password must be 8-72 characters and include uppercase, "
                    + "lowercase, a number, and a symbol"
            );
        }
    }
}
