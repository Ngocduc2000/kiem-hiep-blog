package com.kiemhiep.repository;

import com.kiemhiep.model.Chapter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository extends MongoRepository<Chapter, String> {
    List<Chapter> findByStoryIdOrderByChapterNumberAsc(String storyId);
    Optional<Chapter> findByStoryIdAndChapterNumber(String storyId, int chapterNumber);
    void deleteByStoryId(String storyId);
    long countByStoryId(String storyId);

    // Exclude content field for fast listing
    @Query(value = "{'storyId': ?0}", fields = "{'content': 0}")
    List<Chapter> findByStoryIdNoContent(String storyId, Sort sort);

    @Query(value = "{'storyId': ?0}", fields = "{'content': 0}")
    Page<Chapter> findByStoryIdNoContent(String storyId, Pageable pageable);

    @Query(value = "{'storyId': ?0, 'title': {$regex: ?1, $options: 'i'}}", fields = "{'content': 0}")
    Page<Chapter> searchInStory(String storyId, String keyword, Pageable pageable);
}
