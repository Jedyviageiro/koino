package com.koino.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.BattleSession;

public interface BattleSessionRepository
    extends JpaRepository<BattleSession, String> {

    Optional<BattleSession> findByBattleIdAndUserUserId(
        String battleId,
        Long userId
    );
}
