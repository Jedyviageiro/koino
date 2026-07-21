package com.koino.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.ResetPasswordToken;

public interface ResetPasswordTokenRepository extends JpaRepository<ResetPasswordToken, Long> {}
    

