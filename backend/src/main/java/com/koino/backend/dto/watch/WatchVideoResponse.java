package com.koino.backend.dto.watch;

import com.koino.backend.model.WatchCategory;

public record WatchVideoResponse(
    Long videoId,
    String catalogKey,
    WatchCategory category,
    String title,
    String creator,
    String youtubeUrl,
    String youtubeVideoId,
    int sortOrder,
    boolean featured
) {
}
