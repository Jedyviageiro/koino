package com.koino.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.BattleProfile;

public interface BattleProfileRepository
    extends JpaRepository<BattleProfile, Long> {

    Optional<BattleProfile> findByUserUserId(Long userId);
}
