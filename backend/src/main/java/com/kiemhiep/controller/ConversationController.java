package com.kiemhiep.controller;

import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.ConversationService;
import com.kiemhiep.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getConversations(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size,
                                              Authentication auth) {
        UserDetailsImpl user = principal(auth);
        if (user == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        log.info("[GET /api/conversations] userId={} page={} size={}", user.getId(), page, size);
        return ResponseEntity.ok(conversationService.getConversations(user.getId(), page, size));
    }

    @GetMapping("/{conversationId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getConversation(@PathVariable String conversationId, Authentication auth) {
        UserDetailsImpl user = principal(auth);
        if (user == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        log.info("[GET /api/conversations/{}] userId={}", conversationId, user.getId());
        return ResponseEntity.ok(conversationService.getConversation(conversationId));
    }

    @PostMapping("/with/{recipientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getOrCreateConversation(@PathVariable String recipientId, Authentication auth) {
        UserDetailsImpl user = principal(auth);
        if (user == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        log.info("[POST /api/conversations/with/{}] userId={}", recipientId, user.getId());
        return ResponseEntity.ok(conversationService.getOrCreateConversation(user.getId(), recipientId));
    }

    @DeleteMapping("/{conversationId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteConversation(@PathVariable String conversationId, Authentication auth) {
        UserDetailsImpl user = principal(auth);
        log.info("[DELETE /api/conversations/{}] userId={}", conversationId, user != null ? user.getId() : "unknown");
        conversationService.deleteConversation(conversationId);
        return ResponseEntity.ok().build();
    }
}
