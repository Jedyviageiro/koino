package com.koino.backend.model;

public enum BattleMode {
    LIGHTNING(60, 2600, "Lightning Rated"),
    RAPID(90, 3300, "Rapid Rated"),
    CLASSICAL(120, 3900, "Classical Rated");

    private final int durationSeconds;
    private final int opponentAttemptIntervalMs;
    private final String displayName;

    BattleMode(
        int durationSeconds,
        int opponentAttemptIntervalMs,
        String displayName
    ) {
        this.durationSeconds = durationSeconds;
        this.opponentAttemptIntervalMs = opponentAttemptIntervalMs;
        this.displayName = displayName;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public int getOpponentAttemptIntervalMs() {
        return opponentAttemptIntervalMs;
    }

    public String getDisplayName() {
        return displayName;
    }
}
