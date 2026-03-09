package com.kiemhiep.repository;

import com.kiemhiep.model.Chapter;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository extends MongoRepository<Chapter, String> {
    List<Chapter> findByStoryIdOrderByChapterNumberAsc(String storyId);
    Optional<Chapter> findByStoryIdAndChapterNumber(String storyId, int chapterNumber);
    void deleteByStoryId(String storyId);
    long countByStoryId(String storyId);
}
