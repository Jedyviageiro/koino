package com.koino.backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.koino.backend.model.BattleMatchmakingStatus;
import com.koino.backend.model.BattleMatchmakingTicket;
import com.koino.backend.model.BattleMode;

import jakarta.persistence.LockModeType;

public interface BattleMatchmakingTicketRepository
    extends JpaRepository<BattleMatchmakingTicket, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select ticket from BattleMatchmakingTicket ticket
        where ticket.ticketId = :ticketId
          and ticket.user.userId = :userId
        """)
    Optional<BattleMatchmakingTicket> findOwnedForUpdate(
        @Param("ticketId") String ticketId,
        @Param("userId") Long userId
    );

    List<BattleMatchmakingTicket> findByUserUserIdAndStatus(
        Long userId,
        BattleMatchmakingStatus status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select ticket from BattleMatchmakingTicket ticket
        where ticket.mode = :mode
          and ticket.status = :status
          and ticket.user.userId <> :userId
          and ticket.heartbeatAt >= :activeSince
        order by ticket.createdAt asc
        """)
    List<BattleMatchmakingTicket> findActiveOpponent(
        @Param("mode") BattleMode mode,
        @Param("status") BattleMatchmakingStatus status,
        @Param("userId") Long userId,
        @Param("activeSince") Instant activeSince,
        Pageable pageable
    );
}
