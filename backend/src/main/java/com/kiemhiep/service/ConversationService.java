package com.kiemhiep.service;

import com.kiemhiep.model.Conversation;
import com.kiemhiep.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageService messageService;

    public Conversation getOrCreateConversation(String userId1, String userId2) {
        // Find existing conversation between these two users
        Optional<Conversation> existing = conversationRepository.findBetweenUsers(userId1, userId2);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Create new conversation
        Conversation conversation = new Conversation();
        conversation.setParticipant1Id(userId1);
        conversation.setParticipant2Id(userId2);
        conversation.setParticipantIds(Arrays.asList(userId1, userId2));
        conversation.setUnreadCount1(0);
        conversation.setUnreadCount2(0);
        conversation.setCreatedAt(LocalDateTime.now());
        conversation.setUpdatedAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }

    public Conversation getConversation(String conversationId) {
        return conversationRepository.findById(conversationId).orElse(null);
    }

    public Page<Conversation> getConversations(String userId, int page, int size) {
        return conversationRepository.findByParticipantId(userId, PageRequest.of(page, size));
    }

    public Conversation updateLastMessage(String conversationId, String messageId, String messageContent) {
        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation != null) {
            conversation.setLastMessageId(messageId);
            conversation.setLastMessageContent(messageContent);
            conversation.setUpdatedAt(LocalDateTime.now());
            return conversationRepository.save(conversation);
        }
        return null;
    }

    public Conversation updateUnreadCount(String conversationId, String userId, int delta) {
        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation != null) {
            if (conversation.getParticipant1Id().equals(userId)) {
                conversation.setUnreadCount1(Math.max(0, conversation.getUnreadCount1() + delta));
            } else {
                conversation.setUnreadCount2(Math.max(0, conversation.getUnreadCount2() + delta));
            }
            conversation.setUpdatedAt(LocalDateTime.now());
            return conversationRepository.save(conversation);
        }
        return null;
    }

    public void deleteConversation(String conversationId) {
        // Delete all messages in the conversation
        messageService.deleteMessagesByConversation(conversationId);
        // Delete the conversation
        conversationRepository.deleteById(conversationId);
    }
}
