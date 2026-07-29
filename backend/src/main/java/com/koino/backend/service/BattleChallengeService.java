package com.koino.backend.service;

import java.time.Duration;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.battle.BattleChallengeResponse;
import com.koino.backend.dto.user.FriendUserResponse;
import com.koino.backend.model.BattleChallenge;
import com.koino.backend.model.BattleChallengeStatus;
import com.koino.backend.model.BattleMode;
import com.koino.backend.model.FriendshipStatus;
import com.koino.backend.model.User;
import com.koino.backend.repository.BattleChallengeRepository;
import com.koino.backend.repository.FriendshipRepository;
import com.koino.backend.repository.UserRepository;

@Service
public class BattleChallengeService {
    private static final Duration CHALLENGE_LIFETIME = Duration.ofMinutes(2);
    private static final Duration ONLINE_WINDOW = Duration.ofSeconds(20);

    private final BattleChallengeRepository challengeRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final BattleSpaceService battleSpaceService;
    private final NotificationService notificationService;
    private final UserService userService;

    public BattleChallengeService(
        BattleChallengeRepository challengeRepository,
        FriendshipRepository friendshipRepository,
        UserRepository userRepository,
        BattleSpaceService battleSpaceService,
        NotificationService notificationService,
        UserService userService
    ) {
        this.challengeRepository = challengeRepository;
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.battleSpaceService = battleSpaceService;
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @Transactional
    public BattleChallengeResponse create(
        Long challengerId,
        Long addresseeId,
        BattleMode mode
    ) {
        if (challengerId.equals(addresseeId)) {
            throw new IllegalArgumentException(
                "You cannot challenge yourself"
            );
        }
        long lower = Math.min(challengerId, addresseeId);
        long higher = Math.max(challengerId, addresseeId);
        var friendship = friendshipRepository
            .findByLowerUserIdAndHigherUserId(lower, higher)
            .filter(item -> item.getStatus() == FriendshipStatus.ACCEPTED)
            .orElseThrow(() -> new IllegalArgumentException(
                "Only friends can challenge each other"
            ));
        User challenger = friendship.getRequester().getUserId()
            .equals(challengerId)
                ? friendship.getRequester()
                : friendship.getAddressee();
        User addressee = friendship.getRequester().getUserId()
            .equals(addresseeId)
                ? friendship.getRequester()
                : friendship.getAddressee();

        challengeRepository
            .findFirstByChallengerUserIdAndAddresseeUserIdAndStatus(
                challengerId,
                addresseeId,
                BattleChallengeStatus.PENDING
            )
            .ifPresent(existing -> {
                existing.setStatus(BattleChallengeStatus.CANCELLED);
                existing.setRespondedAt(Instant.now());
                challengeRepository.save(existing);
            });

        Instant now = Instant.now();
        BattleChallenge challenge = new BattleChallenge();
        challenge.setChallenger(challenger);
        challenge.setAddressee(addressee);
        challenge.setMode(mode);
        challenge.setStatus(BattleChallengeStatus.PENDING);
        challenge.setCreatedAt(now);
        challenge.setExpiresAt(now.plus(CHALLENGE_LIFETIME));
        challenge.setChallengerLastSeenAt(now);
        challenge = challengeRepository.save(challenge);
        notificationService.create(
            addressee,
            challenger.getFullname() + " challenged you",
            mode.getDisplayName()
                + " is waiting. Accept while you are both online.",
            "BATTLE_CHALLENGE",
            challenge.getChallengeId()
        );
        return toResponse(challenge, challengerId);
    }

    @Transactional
    public BattleChallengeResponse heartbeat(
        Long userId,
        String challengeId
    ) {
        BattleChallenge challenge = findParticipant(userId, challengeId);
        Instant now = Instant.now();
        expireIfNeeded(challenge, now);
        if (challenge.getChallenger().getUserId().equals(userId)) {
            challenge.setChallengerLastSeenAt(now);
        } else {
            challenge.setAddresseeLastSeenAt(now);
        }
        return toResponse(challengeRepository.save(challenge), userId);
    }

    @Transactional
    public BattleChallengeResponse accept(
        Long userId,
        String challengeId
    ) {
        BattleChallenge challenge = findParticipant(userId, challengeId);
        if (!challenge.getAddressee().getUserId().equals(userId)) {
            throw new IllegalArgumentException(
                "Only the challenged friend can accept"
            );
        }
        Instant now = Instant.now();
        expireIfNeeded(challenge, now);
        if (challenge.getStatus() != BattleChallengeStatus.PENDING) {
            return toResponse(challenge, userId);
        }
        if (challenge.getChallengerLastSeenAt() == null
            || challenge.getChallengerLastSeenAt()
                .plus(ONLINE_WINDOW).isBefore(now)) {
            challenge.setStatus(BattleChallengeStatus.EXPIRED);
            challenge.setRespondedAt(now);
            challengeRepository.save(challenge);
            throw new IllegalArgumentException(
                "Your friend is no longer waiting in Battle Space"
            );
        }
        var pair = battleSpaceService.createHumanBattle(
            challenge.getChallenger().getUserId(),
            challenge.getAddressee().getUserId(),
            challenge.getMode()
        );
        challenge.setChallengerBattleId(pair.challengerBattleId());
        challenge.setAddresseeBattleId(pair.addresseeBattleId());
        challenge.setAddresseeLastSeenAt(now);
        challenge.setStatus(BattleChallengeStatus.ACCEPTED);
        challenge.setRespondedAt(now);
        notificationService.resolve(
            challenge.getAddressee().getUserId(),
            "BATTLE_CHALLENGE",
            challengeId
        );
        return toResponse(challengeRepository.save(challenge), userId);
    }

    @Transactional
    public BattleChallengeResponse close(
        Long userId,
        String challengeId,
        boolean decline
    ) {
        BattleChallenge challenge = findParticipant(userId, challengeId);
        if (challenge.getStatus() == BattleChallengeStatus.PENDING) {
            boolean addressee = challenge.getAddressee().getUserId()
                .equals(userId);
            challenge.setStatus(
                decline && addressee
                    ? BattleChallengeStatus.DECLINED
                    : BattleChallengeStatus.CANCELLED
            );
            challenge.setRespondedAt(Instant.now());
            challengeRepository.save(challenge);
        }
        notificationService.resolve(
            challenge.getAddressee().getUserId(),
            "BATTLE_CHALLENGE",
            challengeId
        );
        return toResponse(challenge, userId);
    }

    private void expireIfNeeded(
        BattleChallenge challenge,
        Instant now
    ) {
        if (challenge.getStatus() == BattleChallengeStatus.PENDING
            && !challenge.getExpiresAt().isAfter(now)) {
            challenge.setStatus(BattleChallengeStatus.EXPIRED);
            challenge.setRespondedAt(now);
        }
    }

    private BattleChallenge findParticipant(
        Long userId,
        String challengeId
    ) {
        BattleChallenge challenge = challengeRepository.findById(challengeId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Battle challenge not found"
            ));
        boolean participant =
            challenge.getChallenger().getUserId().equals(userId)
                || challenge.getAddressee().getUserId().equals(userId);
        if (!participant) {
            throw new IllegalArgumentException(
                "Battle challenge not found"
            );
        }
        return challenge;
    }

    private BattleChallengeResponse toResponse(
        BattleChallenge challenge,
        Long viewerId
    ) {
        User challenger = userService.ensureUsername(
            challenge.getChallenger()
        );
        User addressee = userService.ensureUsername(
            challenge.getAddressee()
        );
        String battleId = challenger.getUserId().equals(viewerId)
            ? challenge.getChallengerBattleId()
            : challenge.getAddresseeBattleId();
        return new BattleChallengeResponse(
            challenge.getChallengeId(),
            challenge.getStatus().name(),
            challenge.getMode().name(),
            challenge.getMode().getDisplayName(),
            user(challenger),
            user(addressee),
            battleId,
            challenge.getExpiresAt()
        );
    }

    private FriendUserResponse user(User user) {
        return new FriendUserResponse(
            user.getUserId(),
            user.getUsername(),
            user.getFullname(),
            user.getProfilePictureUrl()
        );
    }
}
