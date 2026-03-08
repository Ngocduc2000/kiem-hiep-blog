package com.kiemhiep.repository;

import com.kiemhiep.model.Topic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRepository extends MongoRepository<Topic, String> {
    Page<Topic> findByCategoryIdAndStatus(String categoryId, Topic.TopicStatus status, Pageable pageable);
    Page<Topic> findByStatus(Topic.TopicStatus status, Pageable pageable);
    Page<Topic> findByAuthorId(String authorId, Pageable pageable);
    List<Topic> findTop10ByStatusOrderByViewCountDesc(Topic.TopicStatus status);
    List<Topic> findTop10ByStatusOrderByCreatedAtDesc(Topic.TopicStatus status);
    List<Topic> findByStatusAndHotTrue(Topic.TopicStatus status);
    long countByStatus(Topic.TopicStatus status);
    long countByCategoryIdAndStatus(String categoryId, Topic.TopicStatus status);
    Page<Topic> findByStatusAndTitleContainingIgnoreCase(Topic.TopicStatus status, String keyword, Pageable pageable);
}
