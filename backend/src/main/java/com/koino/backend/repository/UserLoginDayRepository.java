package com.koino.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.UserLoginDay;

public interface UserLoginDayRepository
    extends JpaRepository<UserLoginDay, Long> {

    boolean existsByUserUserIdAndLoginDate(Long userId, LocalDate loginDate);

    List<UserLoginDay>
        findByUserUserIdAndLoginDateBetweenOrderByLoginDateAsc(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
        );
}
