package com.kiemhiep.repository;

import com.kiemhiep.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    Page<Message> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);
    List<Message> findByConversationIdAndReadFalseAndSenderIdNotOrderByCreatedAtAsc(String conversationId, String senderId);
    long countByConversationIdAndReadFalseAndSenderIdNot(String conversationId, String senderId);
    void deleteByConversationId(String conversationId);
}
