package com.koino.backend.repository;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.koino.backend.model.BattleChallenge;
import com.koino.backend.model.BattleChallengeStatus;

public interface BattleChallengeRepository
    extends JpaRepository<BattleChallenge, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select challenge from BattleChallenge challenge where challenge.challengeId = :challengeId")
    Optional<BattleChallenge> findByIdForUpdate(
        @Param("challengeId") String challengeId
    );

    Optional<BattleChallenge>
        findFirstByChallengerUserIdAndAddresseeUserIdAndStatus(
            Long challengerId,
            Long addresseeId,
            BattleChallengeStatus status
        );
}
