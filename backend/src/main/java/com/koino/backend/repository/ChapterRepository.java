package com.koino.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.koino.backend.model.Chapter;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long>  {
    
}
