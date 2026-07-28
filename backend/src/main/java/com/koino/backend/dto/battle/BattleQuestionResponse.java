package com.koino.backend.dto.battle;

import java.util.List;

public record BattleQuestionResponse(
    Long questionId,
    int number,
    String prompt,
    List<String> options,
    int difficulty,
    String category
) {
}
