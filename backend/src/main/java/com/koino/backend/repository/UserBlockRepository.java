package com.koino.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.koino.backend.model.UserBlock;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    boolean existsByBlockerUserIdAndBlockedUserId(Long blockerId, Long blockedId);
    void deleteByBlockerUserIdAndBlockedUserId(Long blockerId, Long blockedId);
    List<UserBlock> findByBlockerUserIdOrBlockedUserId(Long blockerId, Long blockedId);
}
