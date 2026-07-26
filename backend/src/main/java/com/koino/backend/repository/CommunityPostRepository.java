package com.koino.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.CommunityPost;
import com.koino.backend.model.CommunityPostType;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    @EntityGraph(attributePaths = {
        "author",
        "verse",
        "verse.chapter",
        "verse.chapter.book"
    })
    List<CommunityPost> findTop50ByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {
        "author",
        "verse",
        "verse.chapter",
        "verse.chapter.book"
    })
    List<CommunityPost> findTop50ByPostTypeOrderByCreatedAtDesc(
        CommunityPostType postType
    );
}
