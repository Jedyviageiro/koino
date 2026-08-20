package com.koino.backend.dto.safety;

import com.koino.backend.model.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportRequest(
    @NotNull ReportReason reason,
    @Size(max = 600) String details
) {}
