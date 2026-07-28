package com.koino.backend.model;

public enum BattleMode {
    LIGHTNING(10, 60, "Lightning Rated"),
    RAPID(15, 90, "Rapid Rated"),
    CLASSICAL(20, 120, "Classical Rated");

    private final int questionCount;
    private final int durationSeconds;
    private final String displayName;

    BattleMode(int questionCount, int durationSeconds, String displayName) {
        this.questionCount = questionCount;
        this.durationSeconds = durationSeconds;
        this.displayName = displayName;
    }

    public int getQuestionCount() {
        return questionCount;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public String getDisplayName() {
        return displayName;
    }
}
