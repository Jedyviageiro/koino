package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.WatchVideo;

public interface WatchVideoRepository extends JpaRepository<WatchVideo, Long> {
    Optional<WatchVideo> findByCatalogKey(String catalogKey);

    List<WatchVideo> findAllByOrderByCategoryAscSortOrderAsc();
}
