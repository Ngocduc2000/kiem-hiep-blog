package com.kiemhiep.repository;

import com.kiemhiep.model.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends MongoRepository<Conversation, String> {
    @Query("{ 'participantIds': { $all: [?0, ?1] } }")
    Optional<Conversation> findBetweenUsers(String userId1, String userId2);

    @Query("{ 'participantIds': ?0 }")
    Page<Conversation> findByParticipantId(String userId, Pageable pageable);

    @Query("{ 'participantIds': ?0 }")
    List<Conversation> findAllByParticipantId(String userId);
}
