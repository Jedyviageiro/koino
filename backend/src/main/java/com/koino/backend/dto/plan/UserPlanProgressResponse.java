package com.koino.backend.dto.plan;

import java.util.List;

public record UserPlanProgressResponse(
    UserActivePlanResponse plan,
    List<UserPlanProgressPointResponse> dailyProgress
) {}
