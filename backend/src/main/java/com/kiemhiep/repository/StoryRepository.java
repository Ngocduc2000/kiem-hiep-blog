package com.kiemhiep.repository;

import com.kiemhiep.model.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StoryRepository extends MongoRepository<Story, String> {
    Page<Story> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Story> findTop12ByOrderByViewCountDesc();
    List<Story> findTop12ByOrderByCreatedAtDesc();
    Page<Story> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);
}
