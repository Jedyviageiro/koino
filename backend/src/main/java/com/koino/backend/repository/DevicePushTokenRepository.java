package com.koino.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.DevicePushToken;

public interface DevicePushTokenRepository extends JpaRepository<DevicePushToken, String> {
    List<DevicePushToken> findByUserUserId(Long userId);
    void deleteByTokenAndUserUserId(String token, Long userId);
}
