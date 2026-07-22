package com.koino.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import com.koino.backend.model.UserProfile;

@Repository
public interface  UserProfileRepository extends JpaRepository<UserProfile, Long> {

    boolean existsByUserUserId(Long userId);

    Optional<UserProfile> findByUserUserId(Long userId);
}
