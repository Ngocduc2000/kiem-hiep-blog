package com.kiemhiep.repository;

import com.kiemhiep.model.Reaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends MongoRepository<Reaction, String> {
    List<Reaction> findByTargetIdAndTargetType(String targetId, String targetType);
    Optional<Reaction> findByTargetIdAndUserIdAndTargetType(String targetId, String userId, String targetType);
    void deleteByTargetIdAndUserIdAndTargetType(String targetId, String userId, String targetType);
}
