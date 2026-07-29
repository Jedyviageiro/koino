package com.koino.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.battle.BattleMatchmakingResponse;
import com.koino.backend.dto.battle.BattleStateResponse;
import com.koino.backend.model.BattleMatchmakingStatus;
import com.koino.backend.model.BattleMatchmakingTicket;
import com.koino.backend.model.BattleMode;
import com.koino.backend.model.User;
import com.koino.backend.repository.BattleMatchmakingTicketRepository;
import com.koino.backend.repository.UserRepository;

@Service
public class BattleMatchmakingService {
    private static final Duration ONLINE_WINDOW = Duration.ofSeconds(12);

    private final BattleMatchmakingTicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final BattleSpaceService battleSpaceService;

    public BattleMatchmakingService(
        BattleMatchmakingTicketRepository ticketRepository,
        UserRepository userRepository,
        BattleSpaceService battleSpaceService
    ) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.battleSpaceService = battleSpaceService;
    }

    @Transactional
    public BattleMatchmakingResponse enter(Long userId, BattleMode mode) {
        Instant now = Instant.now();
        cancelExistingTickets(userId);

        List<BattleMatchmakingTicket> opponents =
            ticketRepository.findActiveOpponent(
                mode,
                BattleMatchmakingStatus.WAITING,
                userId,
                now.minus(ONLINE_WINDOW),
                PageRequest.of(0, 1)
            );

        User user = requireUser(userId);
        BattleMatchmakingTicket ticket = waitingTicket(user, mode, now);
        if (opponents.isEmpty()) {
            return toResponse(ticketRepository.save(ticket));
        }

        BattleMatchmakingTicket opponent = opponents.getFirst();
        BattleSpaceService.HumanBattlePair pair =
            battleSpaceService.createHumanBattle(
                opponent.getUser().getUserId(),
                userId,
                mode
            );
        opponent.setStatus(BattleMatchmakingStatus.MATCHED);
        opponent.setBattleId(pair.challengerBattleId());
        opponent.setMatchedAt(now);
        ticket.setStatus(BattleMatchmakingStatus.MATCHED);
        ticket.setBattleId(pair.addresseeBattleId());
        ticket.setMatchedAt(now);
        ticketRepository.save(opponent);
        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public BattleMatchmakingResponse heartbeat(
        Long userId,
        String ticketId
    ) {
        BattleMatchmakingTicket ticket = requireOwned(userId, ticketId);
        if (ticket.getStatus() == BattleMatchmakingStatus.WAITING) {
            Instant now = Instant.now();
            if (ticket.getHeartbeatAt().isBefore(now.minus(ONLINE_WINDOW))) {
                ticket.setStatus(BattleMatchmakingStatus.EXPIRED);
            } else {
                ticket.setHeartbeatAt(now);
            }
            ticketRepository.save(ticket);
        }
        return toResponse(ticket);
    }

    @Transactional
    public BattleStateResponse useBot(Long userId, String ticketId) {
        BattleMatchmakingTicket ticket = requireOwned(userId, ticketId);
        if (ticket.getStatus() == BattleMatchmakingStatus.MATCHED) {
            return battleSpaceService.getBattle(userId, ticket.getBattleId());
        }
        if (ticket.getStatus() != BattleMatchmakingStatus.WAITING) {
            throw new IllegalStateException(
                "This matchmaking search is no longer active"
            );
        }
        ticket.setStatus(BattleMatchmakingStatus.CANCELLED);
        ticketRepository.save(ticket);
        return battleSpaceService.createBattle(userId, ticket.getMode());
    }

    @Transactional
    public BattleMatchmakingResponse cancel(Long userId, String ticketId) {
        BattleMatchmakingTicket ticket = requireOwned(userId, ticketId);
        if (ticket.getStatus() == BattleMatchmakingStatus.WAITING) {
            ticket.setStatus(BattleMatchmakingStatus.CANCELLED);
            ticketRepository.save(ticket);
        }
        return toResponse(ticket);
    }

    private void cancelExistingTickets(Long userId) {
        List<BattleMatchmakingTicket> existing =
            ticketRepository.findByUserUserIdAndStatus(
                userId,
                BattleMatchmakingStatus.WAITING
            );
        existing.forEach(ticket ->
            ticket.setStatus(BattleMatchmakingStatus.CANCELLED)
        );
        ticketRepository.saveAll(existing);
    }

    private BattleMatchmakingTicket waitingTicket(
        User user,
        BattleMode mode,
        Instant now
    ) {
        BattleMatchmakingTicket ticket = new BattleMatchmakingTicket();
        ticket.setUser(user);
        ticket.setMode(mode);
        ticket.setStatus(BattleMatchmakingStatus.WAITING);
        ticket.setHeartbeatAt(now);
        return ticket;
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private BattleMatchmakingTicket requireOwned(
        Long userId,
        String ticketId
    ) {
        return ticketRepository.findOwnedForUpdate(ticketId, userId)
            .orElseThrow(() ->
                new IllegalArgumentException("Matchmaking search not found")
            );
    }

    private BattleMatchmakingResponse toResponse(
        BattleMatchmakingTicket ticket
    ) {
        return new BattleMatchmakingResponse(
            ticket.getTicketId(),
            ticket.getStatus().name(),
            ticket.getBattleId()
        );
    }
}
