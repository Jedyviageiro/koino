package com.koino.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.BibleVersion;

public interface BibleVersionRepository
    extends JpaRepository<BibleVersion, String> {

    List<BibleVersion> findByEnabledTrueOrderByNameAsc();
}
