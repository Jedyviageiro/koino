package com.koino.backend.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.koino.backend.model.UserProgressLog;


@Repository
public interface UserProgressLogRepository extends JpaRepository<UserProgressLog, Long> {
    
}
