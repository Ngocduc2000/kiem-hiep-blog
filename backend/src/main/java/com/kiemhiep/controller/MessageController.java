package com.kiemhiep.controller;

import com.kiemhiep.dto.MessageRequest;
import com.kiemhiep.model.User;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.ConversationService;
import com.kiemhiep.service.MessageService;
import com.kiemhiep.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final ConversationService conversationService;
    private final UserService userService;

    private UserDetailsImpl principal(Authentication auth) {
        return auth != null ? (UserDetailsImpl) auth.getPrincipal() : null;
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<?> getMessages(@PathVariable String conversationId,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "50") int size,
                                        Authentication auth) {
        return ResponseEntity.ok(messageService.getMessages(conversationId, page, size));
    }

    @PostMapping("/send/{conversationId}")
    public ResponseEntity<?> sendMessage(@PathVariable String conversationId,
                                        @RequestBody MessageRequest req,
                                        Authentication auth) {
        UserDetailsImpl user = principal(auth);
        String userId = user.getId();

        // Get user profile for sender name and avatar
        User userProfile = userService.getUser(userId);
        String senderName = userProfile != null ? userProfile.getUsername() : "Unknown";
        String senderAvatar = userProfile != null ? userProfile.getAvatar() : null;

        // Send message
        var message = messageService.sendMessage(conversationId, userId, senderName, senderAvatar, req.getContent());

        // Update conversation's last message
        conversationService.updateLastMessage(conversationId, message.getId(), req.getContent());

        // Increment unread count for recipient
        var conversation = conversationService.getConversation(conversationId);
        String recipientId = conversation.getParticipant1Id().equals(userId) ?
            conversation.getParticipant2Id() : conversation.getParticipant1Id();
        conversationService.updateUnreadCount(conversationId, recipientId, 1);

        return ResponseEntity.ok(message);
    }

    @PostMapping("/{messageId}/read")
    public ResponseEntity<?> markMessageAsRead(@PathVariable String messageId, Authentication auth) {
        return ResponseEntity.ok(messageService.markAsRead(messageId));
    }

    @PostMapping("/conversation/{conversationId}/read-all")
    public ResponseEntity<?> markConversationAsRead(@PathVariable String conversationId, Authentication auth) {
        String userId = principal(auth).getId();
        messageService.markConversationAsRead(conversationId, userId);
        long unreadCount = messageService.getUnreadCount(conversationId, userId);
        conversationService.updateUnreadCount(conversationId, userId, -(int) unreadCount);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/conversation/{conversationId}/unread-count")
    public ResponseEntity<?> getUnreadCount(@PathVariable String conversationId, Authentication auth) {
        String userId = principal(auth).getId();
        long count = messageService.getUnreadCount(conversationId, userId);
        return ResponseEntity.ok(java.util.Map.of("unreadCount", count));
    }
}
