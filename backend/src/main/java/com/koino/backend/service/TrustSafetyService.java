package com.koino.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.model.*;
import com.koino.backend.repository.*;

@Service
public class TrustSafetyService {
    private final ContentReportRepository reportRepository;
    private final UserBlockRepository blockRepository;
    private final UserRepository userRepository;
    private final CommunityPostRepository postRepository;

    public TrustSafetyService(ContentReportRepository reportRepository, UserBlockRepository blockRepository, UserRepository userRepository, CommunityPostRepository postRepository) {
        this.reportRepository = reportRepository;
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    @Transactional
    public String accessRestriction(User user) {
        if (!user.isActive()) return "This account is no longer available.";
        AccountStatus status = user.getAccountStatus() == null ? AccountStatus.ACTIVE : user.getAccountStatus();
        if (status == AccountStatus.SUSPENDED && user.getSuspensionEndsAt() != null && !user.getSuspensionEndsAt().isAfter(Instant.now())) {
            user.setAccountStatus(AccountStatus.ACTIVE);
            user.setSuspensionEndsAt(null);
            userRepository.save(user);
            return null;
        }
        if (status == AccountStatus.BANNED) return "This account has been restricted for violating the community guidelines.";
        if (status == AccountStatus.SUSPENDED) return "This account is temporarily suspended. Please try again after the suspension ends.";
        return null;
    }

    @Transactional
    public void reportPost(Long reporterId, Long postId, ReportReason reason, String details) {
        CommunityPost post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("This post is no longer available."));
        if (post.getAuthor().getUserId().equals(reporterId)) throw new IllegalArgumentException("You cannot report your own post.");
        if (reportRepository.existsByReporterUserIdAndPostPostIdAndStatus(reporterId, postId, ReportStatus.PENDING)) throw new IllegalArgumentException("You have already reported this post. Our team will review it.");
        saveUserReport(findUser(reporterId), post.getAuthor(), post, reason, details);
    }

    @Transactional
    public void reportUser(Long reporterId, Long reportedUserId, ReportReason reason, String details) {
        if (reporterId.equals(reportedUserId)) throw new IllegalArgumentException("You cannot report your own profile.");
        if (reportRepository.existsByReporterUserIdAndReportedUserUserIdAndPostIsNullAndStatus(reporterId, reportedUserId, ReportStatus.PENDING)) throw new IllegalArgumentException("You have already reported this user. Our team will review it.");
        saveUserReport(findUser(reporterId), findUser(reportedUserId), null, reason, details);
    }

    private void saveUserReport(User reporter, User target, CommunityPost post, ReportReason reason, String details) {
        ContentReport report = new ContentReport();
        report.setReporter(reporter); report.setReportedUser(target); report.setPost(post); report.setReason(reason);
        report.setDetails(details == null || details.isBlank() ? null : details.trim());
        report.setStatus(ReportStatus.PENDING); report.setSource(ReportSource.USER); report.setRiskScore(0);
        reportRepository.save(report);
        target.setReportCount(target.getReportCount() + 1);
        userRepository.save(target);
    }

    @Transactional
    public void recordAutomatedViolation(Long userId, ReportReason reason, double riskScore, boolean severe) {
        User target = findUser(userId);
        ContentReport report = new ContentReport();
        report.setReportedUser(target); report.setReason(reason); report.setStatus(ReportStatus.ACTIONED);
        report.setSource(ReportSource.AUTOMATED_MODERATION); report.setRiskScore(riskScore);
        report.setDetails("Upload rejected before publication and queued for audit.");
        reportRepository.save(report);
        target.setWarningCount(target.getWarningCount() + 1);
        if (severe && target.getWarningCount() >= 2) {
            target.setAccountStatus(AccountStatus.SUSPENDED);
            target.setSuspensionEndsAt(Instant.now().plus(Duration.ofDays(7)));
        } else if (target.getAccountStatus() == AccountStatus.ACTIVE) {
            target.setAccountStatus(AccountStatus.WARNED);
        }
        userRepository.save(target);
    }

    @Transactional
    public void block(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) throw new IllegalArgumentException("You cannot block your own account.");
        if (blockRepository.existsByBlockerUserIdAndBlockedUserId(blockerId, blockedId)) return;
        UserBlock block = new UserBlock(); block.setBlocker(findUser(blockerId)); block.setBlocked(findUser(blockedId));
        blockRepository.save(block);
    }

    @Transactional
    public void unblock(Long blockerId, Long blockedId) {
        blockRepository.deleteByBlockerUserIdAndBlockedUserId(blockerId, blockedId);
    }

    @Transactional(readOnly = true)
    public boolean isBlockedEitherWay(Long firstId, Long secondId) {
        return blockRepository.existsByBlockerUserIdAndBlockedUserId(firstId, secondId)
            || blockRepository.existsByBlockerUserIdAndBlockedUserId(secondId, firstId);
    }

    @Transactional(readOnly = true)
    public Set<Long> hiddenUserIds(Long userId) {
        Set<Long> result = new HashSet<>();
        for (UserBlock block : blockRepository.findByBlockerUserIdOrBlockedUserId(userId, userId)) {
            result.add(block.getBlocker().getUserId().equals(userId) ? block.getBlocked().getUserId() : block.getBlocker().getUserId());
        }
        return result;
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("This user is no longer available."));
    }
}
