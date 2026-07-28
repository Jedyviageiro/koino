package com.koino.backend.repository;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.koino.backend.model.BattleSession;

public interface BattleSessionRepository
    extends JpaRepository<BattleSession, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select battle from BattleSession battle
        where battle.battleId = :battleId
          and battle.user.userId = :userId
        """)
    Optional<BattleSession> findOwnedForUpdate(
        @Param("battleId") String battleId,
        @Param("userId") Long userId
    );
}
