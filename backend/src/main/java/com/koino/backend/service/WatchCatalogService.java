package com.koino.backend.service;

import java.io.InputStream;
import java.sql.Connection;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private static final Logger LOGGER = LoggerFactory.getLogger(
        WatchCatalogService.class
    );
    private static final String CATALOG_PATH =
        "watch/watch-catalog.json";

    private final WatchVideoRepository videoRepository;
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public WatchCatalogService(
        WatchVideoRepository videoRepository,
        JdbcTemplate jdbcTemplate,
        DataSource dataSource
    ) {
        this.videoRepository = videoRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        try {
            removeLegacyCategoryConstraint();
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
                video.setContentLanguage(normalizeLanguage(entry.contentLanguage()));
                videoRepository.save(video);
            }
        } catch (RuntimeException exception) {
            LOGGER.error(
                "Watch catalog synchronization failed; startup will continue",
                exception
            );
        }
    }

    private void removeLegacyCategoryConstraint() {
        try (Connection connection = Objects.requireNonNull(
            dataSource.getConnection()
        )) {
            String databaseName = connection.getMetaData()
                .getDatabaseProductName();
            if (!"PostgreSQL".equalsIgnoreCase(databaseName)) {
                return;
            }
        } catch (Exception exception) {
            LOGGER.warn(
                "Could not inspect the Watch catalog database metadata",
                exception
            );
            return;
        }

        List<CategoryConstraint> constraints = jdbcTemplate.query("""
            select constraint_record.conname,
                   pg_get_constraintdef(constraint_record.oid) as definition
            from pg_constraint constraint_record
            join pg_class table_record
              on table_record.oid = constraint_record.conrelid
            where table_record.relname = 'watch_videos'
              and constraint_record.contype = 'c'
              and pg_get_constraintdef(constraint_record.oid)
                    ilike '%category%'
            """, (resultSet, rowNumber) -> new CategoryConstraint(
                resultSet.getString("conname"),
                resultSet.getString("definition")
            ));
        boolean currentConstraintPresent = constraints.stream()
            .map(CategoryConstraint::definition)
            .anyMatch(definition ->
                definition.contains("PRAYER")
                    && definition.contains("FORGIVENESS")
                    && definition.contains("FINANCES")
            );
        if (currentConstraintPresent) {
            return;
        }

        for (CategoryConstraint constraint : constraints) {
            String identifier = constraint.name().replace("\"", "\"\"");
            jdbcTemplate.execute(
                "alter table watch_videos drop constraint if exists \""
                    + identifier
                    + "\""
            );
            LOGGER.info(
                "Removed legacy Watch category constraint {}",
                constraint.name()
            );
        }
        jdbcTemplate.execute("""
            alter table watch_videos
            add constraint watch_videos_category_check
            check (category in (
                'TEACHING_PREACHING',
                'WORSHIP',
                'DEVOTIONALS',
                'TESTIMONIES',
                'BIBLE_STUDY',
                'PRAYER',
                'FORGIVENESS',
                'FINANCES'
            ))
            """);
    }

    @Transactional(readOnly = true)
    public List<WatchVideoResponse> getCatalog(String language) {
        return videoRepository
            .findAllByContentLanguageOrderByCategoryAscSortOrderAsc(
                normalizeLanguage(language)
            )
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
            ,video.getContentLanguage()
        );
    }

    private String normalizeLanguage(String language) {
        return language != null
                && language.toLowerCase(Locale.ROOT).startsWith("pt")
            ? "pt"
            : "en";
    }

    private record WatchCatalogEntry(
        String catalogKey,
        WatchCategory category,
        String title,
        String creator,
        String youtubeUrl,
        String youtubeVideoId,
        int sortOrder,
        boolean featured,
        String contentLanguage
    ) {
    }

    private record CategoryConstraint(String name, String definition) {}
}
