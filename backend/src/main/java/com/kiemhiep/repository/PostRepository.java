package com.kiemhiep.repository;

import com.kiemhiep.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    Page<Post> findByTopicIdAndStatus(String topicId, Post.PostStatus status, Pageable pageable);
    Page<Post> findByTopicId(String topicId, Pageable pageable);
    Page<Post> findByStatus(Post.PostStatus status, Pageable pageable);
    Page<Post> findByAuthorId(String authorId, Pageable pageable);
    Optional<Post> findByTopicIdAndIsFirstPostTrue(String topicId);
    long countByTopicIdAndStatus(String topicId, Post.PostStatus status);
    long countByStatus(Post.PostStatus status);
    long countByTopicIdIn(java.util.List<String> topicIds);
    List<Post> findTop5ByAuthorIdOrderByCreatedAtDesc(String authorId);
}
