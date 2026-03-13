package com.kiemhiep.controller;

import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.ConversationService;
import com.kiemhiep.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    private UserDetailsImpl principal(Authentication auth) {
        return auth != null ? (UserDetailsImpl) auth.getPrincipal() : null;
    }

    @GetMapping
    public ResponseEntity<?> getConversations(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size,
                                              Authentication auth) {
        String userId = principal(auth).getId();
        return ResponseEntity.ok(conversationService.getConversations(userId, page, size));
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<?> getConversation(@PathVariable String conversationId, Authentication auth) {
        String userId = principal(auth).getId();
        return ResponseEntity.ok(conversationService.getConversation(conversationId));
    }

    @PostMapping("/with/{recipientId}")
    public ResponseEntity<?> getOrCreateConversation(@PathVariable String recipientId, Authentication auth) {
        String userId = principal(auth).getId();
        return ResponseEntity.ok(conversationService.getOrCreateConversation(userId, recipientId));
    }

    @DeleteMapping("/{conversationId}")
    public ResponseEntity<?> deleteConversation(@PathVariable String conversationId, Authentication auth) {
        conversationService.deleteConversation(conversationId);
        return ResponseEntity.ok().build();
    }
}
