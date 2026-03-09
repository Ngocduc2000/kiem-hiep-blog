package com.kiemhiep.repository;

import com.kiemhiep.model.ChapterComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ChapterCommentRepository extends MongoRepository<ChapterComment, String> {
    Page<ChapterComment> findByStoryIdAndChapterNumberOrderByCreatedAtDesc(
            String storyId, int chapterNumber, Pageable pageable);

    long countByStoryIdAndChapterNumber(String storyId, int chapterNumber);
}
