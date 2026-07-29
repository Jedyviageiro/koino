package com.koino.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.user.FriendUserResponse;
import com.koino.backend.dto.user.FriendshipResponse;
import com.koino.backend.dto.user.PublicUserProfileResponse;
import com.koino.backend.dto.user.PublicUserProfileResponse.PublicBattleResponse;
import com.koino.backend.dto.user.PublicUserProfileResponse.PublicPlanResponse;
import com.koino.backend.model.BattleProfile;
import com.koino.backend.model.Friendship;
import com.koino.backend.model.FriendshipStatus;
import com.koino.backend.model.User;
import com.koino.backend.model.UserActivePlan;
import com.koino.backend.model.UserProfile;
import com.koino.backend.repository.BattleProfileRepository;
import com.koino.backend.repository.CommunityPostRepository;
import com.koino.backend.repository.FriendshipRepository;
import com.koino.backend.repository.UserActivePlanRepositor;
import com.koino.backend.repository.UserProfileRepository;
import com.koino.backend.repository.UserRepository;

@Service
public class FriendshipService {
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserActivePlanRepositor activePlanRepository;
    private final BattleProfileRepository battleProfileRepository;
    private final CommunityPostRepository communityPostRepository;
    private final NotificationService notificationService;
    private final UserService userService;

    public FriendshipService(
        FriendshipRepository friendshipRepository,
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        UserActivePlanRepositor activePlanRepository,
        BattleProfileRepository battleProfileRepository,
        CommunityPostRepository communityPostRepository,
        NotificationService notificationService,
        UserService userService
    ) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.activePlanRepository = activePlanRepository;
        this.battleProfileRepository = battleProfileRepository;
        this.communityPostRepository = communityPostRepository;
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @Transactional
    public FriendshipResponse request(Long requesterId, Long addresseeId) {
        if (requesterId.equals(addresseeId)) {
            throw new IllegalArgumentException(
                "You cannot send yourself a friend request"
            );
        }
        User requester = findActiveUser(requesterId);
        User addressee = findActiveUser(addresseeId);
        long lower = Math.min(requesterId, addresseeId);
        long higher = Math.max(requesterId, addresseeId);
        Friendship existing = friendshipRepository
            .findByLowerUserIdAndHigherUserId(lower, higher)
            .orElse(null);
        if (existing != null) {
            if (existing.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new IllegalArgumentException(
                    "You are already friends"
                );
            }
            if (existing.getRequester().getUserId().equals(requesterId)) {
                return toResponse(existing, requesterId);
            }
            existing.setStatus(FriendshipStatus.ACCEPTED);
            existing.setRespondedAt(Instant.now());
            return toResponse(friendshipRepository.save(existing), requesterId);
        }

        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setAddressee(addressee);
        friendship.setLowerUserId(lower);
        friendship.setHigherUserId(higher);
        friendship.setStatus(FriendshipStatus.PENDING);
        friendship = friendshipRepository.save(friendship);
        notificationService.createFriendRequest(
            addressee,
            requester,
            friendship.getFriendshipId()
        );
        return toResponse(friendship, requesterId);
    }

    @Transactional
    public FriendshipResponse accept(Long userId, Long friendshipId) {
        Friendship friendship = find(friendshipId);
        if (!friendship.getAddressee().getUserId().equals(userId)) {
            throw new IllegalArgumentException(
                "This friend request is not addressed to you"
            );
        }
        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            friendship.setStatus(FriendshipStatus.ACCEPTED);
            friendship.setRespondedAt(Instant.now());
            friendship = friendshipRepository.save(friendship);
        }
        notificationService.resolve(
            friendship.getAddressee().getUserId(),
            "FRIEND_REQUEST",
            friendshipId.toString()
        );
        return toResponse(friendship, userId);
    }

    @Transactional
    public void rejectOrRemove(Long userId, Long friendshipId) {
        Friendship friendship = find(friendshipId);
        boolean participant =
            friendship.getRequester().getUserId().equals(userId)
                || friendship.getAddressee().getUserId().equals(userId);
        if (!participant) {
            throw new IllegalArgumentException("Friend request not found");
        }
        notificationService.resolve(
            friendship.getAddressee().getUserId(),
            "FRIEND_REQUEST",
            friendshipId.toString()
        );
        friendshipRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public List<FriendshipResponse> friends(Long userId) {
        return friendshipRepository.findForUserByStatus(
            userId,
            FriendshipStatus.ACCEPTED
        ).stream().map(item -> toResponse(item, userId)).toList();
    }

    @Transactional
    public PublicUserProfileResponse profileById(
        Long viewerId,
        Long profileUserId
    ) {
        return profile(viewerId, findActiveUser(profileUserId));
    }

    @Transactional
    public PublicUserProfileResponse profileByUsername(
        Long viewerId,
        String username
    ) {
        User profileUser = userRepository.findByUsernameIgnoreCase(username)
            .filter(User::isActive)
            .orElseThrow(() -> new IllegalArgumentException(
                "User profile not found"
            ));
        return profile(viewerId, profileUser);
    }

    private PublicUserProfileResponse profile(Long viewerId, User profileUser) {
        profileUser = userService.ensureUsername(profileUser);
        Long userId = profileUser.getUserId();
        UserProfile details = userProfileRepository
            .findByUserUserId(userId)
            .orElse(null);
        UserActivePlan activePlan = activePlanRepository
            .findTopByUserUserIdAndIsCompletedFalseOrderByPlanSequenceNumberDesc(
                userId
            ).orElse(null);
        BattleProfile battle = battleProfileRepository
            .findByUserUserId(userId)
            .orElse(null);
        Friendship friendship = viewerId == null || viewerId.equals(userId)
            ? null
            : friendshipRepository.findByLowerUserIdAndHigherUserId(
                Math.min(viewerId, userId),
                Math.max(viewerId, userId)
            ).orElse(null);

        return new PublicUserProfileResponse(
            userId,
            profileUser.getUsername(),
            profileUser.getFullname(),
            profileUser.getProfilePictureUrl(),
            profileUser.getCreatedAt(),
            details == null ? null : details.getBio(),
            details == null ? null : details.getLocation(),
            relationship(viewerId, profileUser, friendship),
            friendship == null ? null : friendship.getFriendshipId(),
            friendshipRepository
                .countByStatusAndLowerUserIdOrStatusAndHigherUserId(
                    FriendshipStatus.ACCEPTED,
                    userId,
                    FriendshipStatus.ACCEPTED,
                    userId
                ),
            communityPostRepository.countByAuthorUserId(userId),
            toPlan(activePlan),
            toBattle(battle)
        );
    }

    private PublicPlanResponse toPlan(UserActivePlan activePlan) {
        if (activePlan == null) {
            return null;
        }
        var plan = activePlan.getPlanTemplate();
        return new PublicPlanResponse(
            plan.getPlanCode(),
            plan.getName(),
            plan.getDescription(),
            plan.getDurationDays(),
            activePlan.getEstimatedMinutesPerDay()
        );
    }

    private PublicBattleResponse toBattle(BattleProfile battle) {
        if (battle == null) {
            return new PublicBattleResponse(200, "Novice", 0, 0, 0);
        }
        int winRate = battle.getBattles() == 0
            ? 0
            : Math.round(battle.getWins() * 100f / battle.getBattles());
        return new PublicBattleResponse(
            battle.getElo(),
            BattleSpaceService.rankFor(battle.getElo()),
            battle.getBattles(),
            battle.getWins(),
            winRate
        );
    }

    private String relationship(
        Long viewerId,
        User profileUser,
        Friendship friendship
    ) {
        if (viewerId == null) return "SIGNED_OUT";
        if (viewerId.equals(profileUser.getUserId())) return "SELF";
        if (friendship == null) return "NONE";
        if (friendship.getStatus() == FriendshipStatus.ACCEPTED) {
            return "FRIENDS";
        }
        return friendship.getRequester().getUserId().equals(viewerId)
            ? "PENDING_OUTGOING"
            : "PENDING_INCOMING";
    }

    private FriendshipResponse toResponse(
        Friendship friendship,
        Long viewerId
    ) {
        User other = friendship.getRequester().getUserId().equals(viewerId)
            ? friendship.getAddressee()
            : friendship.getRequester();
        other = userService.ensureUsername(other);
        return new FriendshipResponse(
            friendship.getFriendshipId(),
            new FriendUserResponse(
                other.getUserId(),
                other.getUsername(),
                other.getFullname(),
                other.getProfilePictureUrl()
            ),
            friendship.getStatus().name(),
            friendship.getRequester().getUserId().equals(viewerId)
                ? "OUTGOING"
                : "INCOMING",
            friendship.getCreatedAt()
        );
    }

    private Friendship find(Long friendshipId) {
        return friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Friend request not found"
            ));
    }

    private User findActiveUser(Long userId) {
        return userRepository.findById(userId)
            .filter(User::isActive)
            .orElseThrow(() -> new IllegalArgumentException(
                "User profile not found"
            ));
    }
}
