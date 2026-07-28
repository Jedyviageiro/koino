package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.koino.backend.model.BattleQuestion;

public interface BattleQuestionRepository
    extends JpaRepository<BattleQuestion, Long> {

    Optional<BattleQuestion> findByCatalogKey(String catalogKey);

    long countByDifficulty(int difficulty);

    @Query("""
        select question from BattleQuestion question
        where question.difficulty between :minimum and :maximum
        order by function('random')
        """)
    List<BattleQuestion> findRandomForDifficulty(
        @Param("minimum") int minimum,
        @Param("maximum") int maximum
    );
}
