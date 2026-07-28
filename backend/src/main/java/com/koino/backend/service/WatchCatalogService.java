package com.koino.backend.service;

import java.io.InputStream;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.dto.watch.WatchVideoResponse;
import com.koino.backend.model.WatchCategory;
import com.koino.backend.model.WatchVideo;
import com.koino.backend.repository.WatchVideoRepository;

@Service
public class WatchCatalogService implements ApplicationRunner {
    private static final String CATALOG_PATH =
        "watch/watch-catalog.json";

    private final WatchVideoRepository videoRepository;

    public WatchCatalogService(WatchVideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        for (WatchCatalogEntry entry : loadLocalCatalog()) {
            WatchVideo video = videoRepository
                .findByCatalogKey(entry.catalogKey())
                .orElseGet(WatchVideo::new);
            video.setCatalogKey(entry.catalogKey());
            video.setCategory(entry.category());
            video.setTitle(entry.title());
            video.setCreator(entry.creator());
            video.setYoutubeUrl(entry.youtubeUrl());
            video.setYoutubeVideoId(entry.youtubeVideoId());
            video.setSortOrder(entry.sortOrder());
            video.setFeatured(entry.featured());
            videoRepository.save(video);
        }
    }

    @Transactional(readOnly = true)
    public List<WatchVideoResponse> getCatalog() {
        return videoRepository.findAllByOrderByCategoryAscSortOrderAsc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private List<WatchCatalogEntry> loadLocalCatalog() {
        ClassPathResource resource = new ClassPathResource(CATALOG_PATH);
        if (!resource.exists()) {
            throw new IllegalStateException(
                "The local Watch catalog is missing"
            );
        }

        try (InputStream input = resource.getInputStream()) {
            return new ObjectMapper().readValue(
                input,
                new TypeReference<>() {}
            );
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Could not load the local Watch catalog",
                exception
            );
        }
    }

    private WatchVideoResponse toResponse(WatchVideo video) {
        return new WatchVideoResponse(
            video.getVideoId(),
            video.getCatalogKey(),
            video.getCategory(),
            video.getTitle(),
            video.getCreator(),
            video.getYoutubeUrl(),
            video.getYoutubeVideoId(),
            video.getSortOrder(),
            video.isFeatured()
        );
    }

    private record WatchCatalogEntry(
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
}
