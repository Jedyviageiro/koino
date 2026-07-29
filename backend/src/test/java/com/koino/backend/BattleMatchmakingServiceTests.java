package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import com.koino.backend.model.BattleMatchmakingStatus;
import com.koino.backend.model.BattleMatchmakingTicket;
import com.koino.backend.model.BattleMode;
import com.koino.backend.model.User;
import com.koino.backend.repository.BattleMatchmakingTicketRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.BattleMatchmakingService;
import com.koino.backend.service.BattleSpaceService;

class BattleMatchmakingServiceTests {

    @Test
    void keepsFirstOnlineUserWaiting() {
        var tickets = mock(BattleMatchmakingTicketRepository.class);
        var users = mock(UserRepository.class);
        var battles = mock(BattleSpaceService.class);
        User user = user(1L, "Maria");
        stubTicketSave(tickets);
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(tickets.findByUserUserIdAndStatus(
            1L,
            BattleMatchmakingStatus.WAITING
        )).thenReturn(List.of());
        when(tickets.findActiveOpponent(
            eq(BattleMode.LIGHTNING),
            eq(BattleMatchmakingStatus.WAITING),
            eq(1L),
            any(Instant.class),
            any(Pageable.class)
        )).thenReturn(List.of());

        var response = service(tickets, users, battles)
            .enter(1L, BattleMode.LIGHTNING);

        assertThat(response.status()).isEqualTo("WAITING");
        assertThat(response.ticketId()).isNotBlank();
        assertThat(response.battleId()).isNull();
    }

    @Test
    void pairsSecondOnlineUserIntoMirroredHumanBattles() {
        var tickets = mock(BattleMatchmakingTicketRepository.class);
        var users = mock(UserRepository.class);
        var battles = mock(BattleSpaceService.class);
        User waitingUser = user(1L, "Maria");
        User joiningUser = user(2L, "Sarah");
        BattleMatchmakingTicket waiting = new BattleMatchmakingTicket();
        waiting.setTicketId("waiting-ticket");
        waiting.setUser(waitingUser);
        waiting.setMode(BattleMode.RAPID);
        waiting.setStatus(BattleMatchmakingStatus.WAITING);
        waiting.setHeartbeatAt(Instant.now());
        stubTicketSave(tickets);
        when(users.findById(2L)).thenReturn(Optional.of(joiningUser));
        when(tickets.findByUserUserIdAndStatus(
            2L,
            BattleMatchmakingStatus.WAITING
        )).thenReturn(List.of());
        when(tickets.findActiveOpponent(
            eq(BattleMode.RAPID),
            eq(BattleMatchmakingStatus.WAITING),
            eq(2L),
            any(Instant.class),
            any(Pageable.class)
        )).thenReturn(List.of(waiting));
        when(battles.createHumanBattle(1L, 2L, BattleMode.RAPID))
            .thenReturn(new BattleSpaceService.HumanBattlePair(
                "maria-battle",
                "sarah-battle"
            ));

        var response = service(tickets, users, battles)
            .enter(2L, BattleMode.RAPID);

        assertThat(response.status()).isEqualTo("MATCHED");
        assertThat(response.battleId()).isEqualTo("sarah-battle");
        assertThat(waiting.getStatus())
            .isEqualTo(BattleMatchmakingStatus.MATCHED);
        assertThat(waiting.getBattleId()).isEqualTo("maria-battle");
        verify(battles).createHumanBattle(1L, 2L, BattleMode.RAPID);
    }

    private BattleMatchmakingService service(
        BattleMatchmakingTicketRepository tickets,
        UserRepository users,
        BattleSpaceService battles
    ) {
        return new BattleMatchmakingService(tickets, users, battles);
    }

    private void stubTicketSave(
        BattleMatchmakingTicketRepository tickets
    ) {
        AtomicInteger sequence = new AtomicInteger();
        when(tickets.save(any(BattleMatchmakingTicket.class)))
            .thenAnswer(invocation -> {
                BattleMatchmakingTicket ticket = invocation.getArgument(0);
                if (ticket.getTicketId() == null) {
                    ticket.setTicketId(
                        "ticket-" + sequence.incrementAndGet()
                    );
                }
                return ticket;
            });
    }

    private User user(Long id, String fullname) {
        User user = new User();
        user.setUserId(id);
        user.setFullname(fullname);
        return user;
    }
}
