package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.BattleMode;
import com.koino.backend.model.BattleRating;

public interface BattleRatingRepository
    extends JpaRepository<BattleRating, Long> {

    Optional<BattleRating> findByProfileUserUserIdAndMode(
        Long userId,
        BattleMode mode
    );

    Optional<BattleRating> findByProfileBattleProfileIdAndMode(
        Long battleProfileId,
        BattleMode mode
    );

    List<BattleRating> findByProfileBattleProfileIdOrderByModeAsc(
        Long battleProfileId
    );

    List<BattleRating> findTop10ByModeOrderByEloDescWinsDesc(
        BattleMode mode
    );
}
