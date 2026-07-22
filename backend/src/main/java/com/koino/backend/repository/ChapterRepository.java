package com.koino.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.koino.backend.model.Chapter;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long>  {

    List<Chapter> findByBookBookIdOrderByChapterNumber(Integer bookId);

    Optional<Chapter> findByBookTitleIgnoreCaseAndChapterNumber(
        String bookTitle,
        Integer chapterNumber
    );

    @Query("""
        select c from Chapter c join fetch c.book b
        where b.title in :titles
        order by b.orderIndex, c.chapterNumber
        """)
    List<Chapter> findByBookTitlesInCanonicalOrder(
        @Param("titles") Collection<String> titles
    );

    @Query("""
        select c from Chapter c join fetch c.book b
        where b.orderIndex between :firstBook and :lastBook
        order by b.orderIndex, c.chapterNumber
        """)
    List<Chapter> findCanonicalRange(
        @Param("firstBook") int firstBook,
        @Param("lastBook") int lastBook
    );
}
