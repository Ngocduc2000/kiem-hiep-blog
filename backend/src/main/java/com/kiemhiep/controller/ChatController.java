package com.kiemhiep.controller;

import com.kiemhiep.dto.MessageRequest;
import com.kiemhiep.model.Message;
import com.kiemhiep.model.User;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.ConversationService;
import com.kiemhiep.service.MessageService;
import com.kiemhiep.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;
    private final ConversationService conversationService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/send/{conversationId}")
    public void sendMessage(@DestinationVariable String conversationId, MessageRequest req, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        String userId = user.getId();

        // Get user profile
        User userProfile = userService.getUser(userId);
        String senderName = userProfile != null ? userProfile.getUsername() : "Unknown";
        String senderAvatar = userProfile != null ? userProfile.getAvatar() : null;

        // Save message
        Message message = messageService.sendMessage(conversationId, userId, senderName, senderAvatar, req.getContent());

        // Update conversation's last message
        conversationService.updateLastMessage(conversationId, message.getId(), req.getContent());

        // Get recipient ID
        var conversation = conversationService.getConversation(conversationId);
        String recipientId = conversation.getParticipant1Id().equals(userId) ?
                conversation.getParticipant2Id() : conversation.getParticipant1Id();

        // Increment unread count for recipient
        conversationService.updateUnreadCount(conversationId, recipientId, 1);

        // Send message to both participants
        messagingTemplate.convertAndSendToUser(userId, "/queue/messages/" + conversationId, message);
        messagingTemplate.convertAndSendToUser(recipientId, "/queue/messages/" + conversationId, message);
    }

    @MessageMapping("/chat/read/{conversationId}")
    public void markAsRead(@DestinationVariable String conversationId, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        String userId = user.getId();

        messageService.markConversationAsRead(conversationId, userId);
        long unreadCount = messageService.getUnreadCount(conversationId, userId);
        conversationService.updateUnreadCount(conversationId, userId, (int) -unreadCount);

        // Notify both participants
        messagingTemplate.convertAndSendToUser(userId, "/queue/read-status/" + conversationId,
                new ReadStatusDto(conversationId, true));
    }

    @Data
    static class ReadStatusDto {
        private String conversationId;
        private boolean allRead;

        public ReadStatusDto(String conversationId, boolean allRead) {
            this.conversationId = conversationId;
            this.allRead = allRead;
        }
    }
}
