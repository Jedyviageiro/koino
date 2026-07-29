package com.koino.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.BattleChallenge;
import com.koino.backend.model.BattleChallengeStatus;

public interface BattleChallengeRepository
    extends JpaRepository<BattleChallenge, String> {

    Optional<BattleChallenge>
        findFirstByChallengerUserIdAndAddresseeUserIdAndStatus(
            Long challengerId,
            Long addresseeId,
            BattleChallengeStatus status
        );
}
