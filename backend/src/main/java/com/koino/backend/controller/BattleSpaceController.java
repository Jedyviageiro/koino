package com.koino.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.battle.BattleAnswerRequest;
import com.koino.backend.dto.battle.BattleAnswerResponse;
import com.koino.backend.dto.battle.BattleLobbyResponse;
import com.koino.backend.dto.battle.BattleStateResponse;
import com.koino.backend.dto.battle.CreateBattleRequest;
import com.koino.backend.model.User;
import com.koino.backend.service.BattleSpaceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/battles")
public class BattleSpaceController {
    private final BattleSpaceService battleSpaceService;

    public BattleSpaceController(BattleSpaceService battleSpaceService) {
        this.battleSpaceService = battleSpaceService;
    }

    @GetMapping("/lobby")
    public BattleLobbyResponse lobby(@AuthenticationPrincipal User user) {
        return battleSpaceService.getLobby(user.getUserId());
    }

    @PostMapping
    public BattleStateResponse create(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody CreateBattleRequest request
    ) {
        return battleSpaceService.createBattle(
            user.getUserId(),
            request.mode()
        );
    }

    @GetMapping("/{battleId}")
    public BattleStateResponse get(
        @AuthenticationPrincipal User user,
        @PathVariable String battleId
    ) {
        return battleSpaceService.getBattle(user.getUserId(), battleId);
    }

    @PostMapping("/{battleId}/answers")
    public BattleAnswerResponse answer(
        @AuthenticationPrincipal User user,
        @PathVariable String battleId,
        @Valid @RequestBody BattleAnswerRequest request
    ) {
        return battleSpaceService.answer(
            user.getUserId(),
            battleId,
            request.questionId(),
            request.selectedOption()
        );
    }

    @PostMapping("/{battleId}/finish")
    public BattleStateResponse finish(
        @AuthenticationPrincipal User user,
        @PathVariable String battleId,
        @RequestParam(defaultValue = "false") boolean abandoned
    ) {
        return battleSpaceService.finish(
            user.getUserId(),
            battleId,
            abandoned
        );
    }
}
