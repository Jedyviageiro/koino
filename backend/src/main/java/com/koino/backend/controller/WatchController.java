package com.koino.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.watch.WatchVideoResponse;
import com.koino.backend.service.WatchCatalogService;

@RestController
@RequestMapping("/api/watch")
public class WatchController {
    private final WatchCatalogService watchCatalogService;

    public WatchController(WatchCatalogService watchCatalogService) {
        this.watchCatalogService = watchCatalogService;
    }

    @GetMapping("/videos")
    public List<WatchVideoResponse> getVideos(
        @RequestParam(defaultValue = "en") String language
    ) {
        return watchCatalogService.getCatalog(language);
    }
}
