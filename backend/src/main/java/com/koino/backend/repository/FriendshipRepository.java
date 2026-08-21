package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.koino.backend.model.Friendship;
import com.koino.backend.model.FriendshipStatus;
import com.koino.backend.model.AccountStatus;

public interface FriendshipRepository
    extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByLowerUserIdAndHigherUserId(
        Long lowerUserId,
        Long higherUserId
    );

    @EntityGraph(attributePaths = {"requester", "addressee"})
    @Query("""
        select friendship from Friendship friendship
        where (friendship.requester.userId = :userId
            or friendship.addressee.userId = :userId)
          and friendship.status = :status
        order by friendship.createdAt desc
        """)
    List<Friendship> findForUserByStatus(
        @Param("userId") Long userId,
        @Param("status") FriendshipStatus status
    );

    long countByStatusAndLowerUserIdOrStatusAndHigherUserId(
        FriendshipStatus lowerStatus,
        Long lowerUserId,
        FriendshipStatus higherStatus,
        Long higherUserId
    );

    @Query("""
        select count(friendship) from Friendship friendship
        where friendship.status = :status
          and (friendship.requester.userId = :userId or friendship.addressee.userId = :userId)
          and friendship.requester.active = true
          and friendship.addressee.active = true
          and friendship.requester.accountStatus <> :banned
          and friendship.addressee.accountStatus <> :banned
        """)
    long countActiveForUser(
        @Param("userId") Long userId,
        @Param("status") FriendshipStatus status,
        @Param("banned") AccountStatus banned
    );
}
