package com.koino.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.koino.backend.model.ChatMessage;

public interface ChatMessageRepository
    extends JpaRepository<ChatMessage, Long> {

    @EntityGraph(attributePaths = {"sender", "recipient"})
    @Query("""
        select message from ChatMessage message
        where (message.sender.userId = :firstId
            and message.recipient.userId = :secondId)
           or (message.sender.userId = :secondId
            and message.recipient.userId = :firstId)
        order by message.sentAt asc, message.messageId asc
        """)
    List<ChatMessage> findConversation(
        @Param("firstId") Long firstId,
        @Param("secondId") Long secondId
    );

    @EntityGraph(attributePaths = {"sender", "recipient"})
    @Query("""
        select message from ChatMessage message
        where message.sender.userId = :userId
           or message.recipient.userId = :userId
        order by message.sentAt desc, message.messageId desc
        """)
    List<ChatMessage> findAllForUser(@Param("userId") Long userId);
}
