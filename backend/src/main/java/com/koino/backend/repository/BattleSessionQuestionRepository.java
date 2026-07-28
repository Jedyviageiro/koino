package com.koino.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.BattleSessionQuestion;

public interface BattleSessionQuestionRepository
    extends JpaRepository<BattleSessionQuestion, Long> {
}
