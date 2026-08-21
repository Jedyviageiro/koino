package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.ChatConversationDeletion;

public interface ChatConversationDeletionRepository extends JpaRepository<ChatConversationDeletion, Long> {
    Optional<ChatConversationDeletion> findByOwnerUserIdAndFriendUserId(Long ownerId, Long friendId);
    List<ChatConversationDeletion> findByOwnerUserId(Long ownerId);
}
