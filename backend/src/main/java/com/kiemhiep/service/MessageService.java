package com.kiemhiep.service;

import com.kiemhiep.model.Message;
import com.kiemhiep.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;

    public Message sendMessage(String conversationId, String senderId, String senderName, String senderAvatar, String content) {
        Message message = new Message();
        message.setConversationId(conversationId);
        message.setSenderId(senderId);
        message.setSenderName(senderName);
        message.setSenderAvatar(senderAvatar);
        message.setContent(content);
        message.setRead(false);
        message.setCreatedAt(LocalDateTime.now());
        message.setUpdatedAt(LocalDateTime.now());
        return messageRepository.save(message);
    }

    public Page<Message> getMessages(String conversationId, int page, int size) {
        return messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size));
    }

    public Message getMessageById(String messageId) {
        return messageRepository.findById(messageId).orElse(null);
    }

    public Message markAsRead(String messageId) {
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message != null) {
            message.setRead(true);
            message.setUpdatedAt(LocalDateTime.now());
            return messageRepository.save(message);
        }
        return null;
    }

    public void markConversationAsRead(String conversationId, String userId) {
        List<Message> unreadMessages = messageRepository.findByConversationIdAndReadFalseAndSenderIdNotOrderByCreatedAtAsc(conversationId, userId);
        for (Message message : unreadMessages) {
            message.setRead(true);
            message.setUpdatedAt(LocalDateTime.now());
        }
        messageRepository.saveAll(unreadMessages);
    }

    public long getUnreadCount(String conversationId, String userId) {
        return messageRepository.countByConversationIdAndReadFalseAndSenderIdNot(conversationId, userId);
    }

    public void deleteMessagesByConversation(String conversationId) {
        messageRepository.deleteByConversationId(conversationId);
    }
}
