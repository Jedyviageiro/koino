package com.koino.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.CommunityComment;

public interface CommunityCommentRepository
    extends JpaRepository<CommunityComment, Long> {

    @EntityGraph(attributePaths = "author")
    List<CommunityComment> findByPostPostIdOrderByCreatedAtAsc(Long postId);

    @EntityGraph(attributePaths = "author")
    List<CommunityComment> findByPostPostIdInOrderByCreatedAtAsc(
        List<Long> postIds
    );
}
