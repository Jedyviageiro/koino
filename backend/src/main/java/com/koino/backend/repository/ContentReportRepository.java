package com.koino.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.koino.backend.model.ContentReport;
import com.koino.backend.model.ReportStatus;

public interface ContentReportRepository extends JpaRepository<ContentReport, Long> {
    boolean existsByReporterUserIdAndPostPostIdAndStatus(Long reporterId, Long postId, ReportStatus status);
    boolean existsByReporterUserIdAndReportedUserUserIdAndPostIsNullAndStatus(Long reporterId, Long reportedUserId, ReportStatus status);

    @Modifying
    @Query("update ContentReport report set report.post = null where report.post.postId = :postId")
    int clearPostReference(@Param("postId") Long postId);
}
