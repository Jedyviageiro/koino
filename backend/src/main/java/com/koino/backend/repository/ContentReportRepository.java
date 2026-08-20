package com.koino.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.koino.backend.model.ContentReport;
import com.koino.backend.model.ReportStatus;

public interface ContentReportRepository extends JpaRepository<ContentReport, Long> {
    boolean existsByReporterUserIdAndPostPostIdAndStatus(Long reporterId, Long postId, ReportStatus status);
    boolean existsByReporterUserIdAndReportedUserUserIdAndPostIsNullAndStatus(Long reporterId, Long reportedUserId, ReportStatus status);
}
