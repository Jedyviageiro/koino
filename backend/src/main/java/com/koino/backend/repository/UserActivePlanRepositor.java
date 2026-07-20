package com.koino.backend.repository;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.koino.backend.model.UserActivePlan;

@Repository
public interface UserActivePlanRepositor extends JpaRepository<UserActivePlan, Long> {
    
}
