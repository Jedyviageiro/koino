package com.koino.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.user.FriendUserResponse;
import com.koino.backend.dto.user.FriendshipResponse;
import com.koino.backend.dto.user.PublicUserProfileResponse;
import com.koino.backend.dto.user.PublicUserProfileResponse.PublicBattleResponse;
import com.koino.backend.dto.user.PublicUserProfileResponse.PublicModeRatingResponse;
import com.koino.backend.dto.user.PublicUserProfileResponse.PublicPlanResponse;
import com.koino.backend.model.BattleProfile;
import com.koino.backend.model.BattleMode;
import com.koino.backend.model.BattleRating;
import com.koino.backend.model.Friendship;
import com.koino.backend.model.FriendshipStatus;
import com.koino.backend.model.User;
import com.koino.backend.model.UserActivePlan;
import com.koino.backend.model.UserProfile;
import com.koino.backend.repository.BattleProfileRepository;
import com.koino.backend.repository.BattleRatingRepository;
import com.koino.backend.repository.CommunityPostRepository;
import com.koino.backend.repository.FriendshipRepository;
import com.koino.backend.repository.UserActivePlanRepositor;
import com.koino.backend.repository.UserProfileRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.GmailService.EmailService;

@Service
public class FriendshipService {
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserActivePlanRepositor activePlanRepository;
    private final BattleProfileRepository battleProfileRepository;
    private final BattleRatingRepository battleRatingRepository;
    private final CommunityPostRepository communityPostRepository;
    private final NotificationService notificationService;
    private final UserService userService;
    private final EmailService emailService;
    private final PlanLocalizationService planLocalizationService;

    public FriendshipService(
        FriendshipRepository friendshipRepository,
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        UserActivePlanRepositor activePlanRepository,
        BattleProfileRepository battleProfileRepository,
        BattleRatingRepository battleRatingRepository,
        CommunityPostRepository communityPostRepository,
        NotificationService notificationService,
        UserService userService,
        EmailService emailService,
        PlanLocalizationService planLocalizationService
    ) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.activePlanRepository = activePlanRepository;
        this.battleProfileRepository = battleProfileRepository;
        this.battleRatingRepository = battleRatingRepository;
        this.communityPostRepository = communityPostRepository;
        this.notificationService = notificationService;
        this.userService = userService;
        this.emailService = emailService;
        this.planLocalizationService = planLocalizationService;
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
        if (addressee.isEmailVerified()) {
            emailService.sendFriendRequestReminder(
                addressee,
                requester.getFullname()
            );
        }
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

    @Transactional
    public PublicUserProfileResponse profileByFriendCode(
        Long viewerId,
        String friendCode
    ) {
        String normalized = normalizeFriendCode(friendCode);
        User profileUser = userRepository.findByFriendCodeIgnoreCase(normalized)
            .filter(User::isActive)
            .orElseThrow(() -> new IllegalArgumentException(
                "Friend code not found"
            ));
        return profile(viewerId, profileUser);
    }

    private String normalizeFriendCode(String value) {
        String compact = value == null
            ? ""
            : value.trim().toUpperCase(java.util.Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (compact.length() != 8) {
            throw new IllegalArgumentException("Enter a valid friend code");
        }
        return compact.substring(0, 4) + "-" + compact.substring(4);
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
            details == null ? null : details.getCountryCode(),
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
            toPlan(
                activePlan,
                viewerId == null
                    ? profileUser.getLanguage()
                    : userRepository.findById(viewerId)
                        .map(User::getLanguage)
                        .orElse(profileUser.getLanguage())
            ),
            toBattle(battle)
        );
    }

    private PublicPlanResponse toPlan(UserActivePlan activePlan, String language) {
        if (activePlan == null) {
            return null;
        }
        var plan = activePlan.getPlanTemplate();
        return new PublicPlanResponse(
            plan.getPlanCode(),
            planLocalizationService.name(plan, language),
            planLocalizationService.description(plan, language),
            plan.getDurationDays(),
            activePlan.getEstimatedMinutesPerDay()
        );
    }

    private PublicBattleResponse toBattle(BattleProfile battle) {
        if (battle == null) {
            return new PublicBattleResponse(
                0,
                0,
                0,
                java.util.Arrays.stream(BattleMode.values())
                    .map(mode -> defaultModeRating(mode))
                    .toList()
            );
        }
        List<BattleRating> ratings = battleRatingRepository
            .findByProfileBattleProfileIdOrderByModeAsc(
                battle.getBattleProfileId()
            );
        int battles = ratings.isEmpty()
            ? battle.getBattles()
            : ratings.stream().mapToInt(BattleRating::getBattles).sum();
        int wins = ratings.isEmpty()
            ? battle.getWins()
            : ratings.stream().mapToInt(BattleRating::getWins).sum();
        int winRate = battles == 0
            ? 0
            : Math.round(wins * 100f / battles);
        return new PublicBattleResponse(
            battles,
            wins,
            winRate,
            java.util.Arrays.stream(BattleMode.values())
                .map(mode -> ratings.stream()
                    .filter(rating -> rating.getMode() == mode)
                    .findFirst()
                    .map(this::toPublicModeRating)
                    .orElseGet(() -> legacyModeRating(mode, battle)))
                .toList()
        );
    }

    private PublicModeRatingResponse toPublicModeRating(
        BattleRating rating
    ) {
        int winRate = rating.getBattles() == 0
            ? 0
            : Math.round(rating.getWins() * 100f / rating.getBattles());
        return new PublicModeRatingResponse(
            rating.getMode().name(),
            rating.getMode().getDisplayName(),
            rating.getElo(),
            BattleSpaceService.rankFor(rating.getElo()),
            rating.getBattles(),
            rating.getWins(),
            winRate
        );
    }

    private PublicModeRatingResponse legacyModeRating(
        BattleMode mode,
        BattleProfile battle
    ) {
        boolean legacyMode = mode == BattleMode.LIGHTNING;
        int modeBattles = legacyMode ? battle.getBattles() : 0;
        int modeWins = legacyMode ? battle.getWins() : 0;
        int winRate = modeBattles == 0
            ? 0
            : Math.round(modeWins * 100f / modeBattles);
        int elo = legacyMode ? Math.max(200, battle.getElo()) : 200;
        return new PublicModeRatingResponse(
            mode.name(),
            mode.getDisplayName(),
            elo,
            BattleSpaceService.rankFor(elo),
            modeBattles,
            modeWins,
            winRate
        );
    }

    private PublicModeRatingResponse defaultModeRating(BattleMode mode) {
        return new PublicModeRatingResponse(
            mode.name(),
            mode.getDisplayName(),
            200,
            "Novice",
            0,
            0,
            0
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
