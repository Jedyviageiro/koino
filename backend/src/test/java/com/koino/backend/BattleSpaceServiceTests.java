package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.koino.backend.service.BattleSpaceService;

class BattleSpaceServiceTests {
    @Test
    void mapsEloToProgressiveDifficultyAndRanks() {
        assertThat(BattleSpaceService.difficultyFor(200)).isEqualTo(1);
        assertThat(BattleSpaceService.rankFor(699)).isEqualTo("Novice");
        assertThat(BattleSpaceService.difficultyFor(700)).isEqualTo(2);
        assertThat(BattleSpaceService.rankFor(1200)).isEqualTo("Scribe");
        assertThat(BattleSpaceService.difficultyFor(1700)).isEqualTo(4);
        assertThat(BattleSpaceService.rankFor(2200))
            .isEqualTo("Grandmaster");
        assertThat(BattleSpaceService.difficultyFor(2600)).isEqualTo(6);
        assertThat(BattleSpaceService.rankFor(2600))
            .isEqualTo("Super Grandmaster");
    }

    @Test
    void eloChangesStayInsideConfiguredRanges() {
        assertRange(1200, 1200, 1, 8, 10);
        assertRange(1200, 1300, 1, 11, 14);
        assertRange(1200, 1500, 1, 18, 25);
        assertRange(1200, 1100, 1, 5, 7);
        assertRange(1200, 900, 1, 1, 3);

        assertRange(1200, 1200, -1, -10, -8);
        assertRange(1200, 1300, -1, -8, -6);
        assertRange(1200, 1500, -1, -4, -2);
        assertRange(1200, 1100, -1, -13, -11);
        assertRange(1200, 900, -1, -22, -18);
        assertThat(BattleSpaceService.calculateEloChange(
            1200,
            1500,
            0,
            "draw"
        )).isZero();
    }

    private void assertRange(
        int player,
        int opponent,
        int outcome,
        int minimum,
        int maximum
    ) {
        int change = BattleSpaceService.calculateEloChange(
            player,
            opponent,
            outcome,
            "stable-test-id"
        );
        assertThat(change).isBetween(minimum, maximum);
    }
}
