package com.kiemhiep.controller;

import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.ReactionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @GetMapping("/{targetType}/{targetId}")
    public ResponseEntity<?> getReactions(@PathVariable String targetType,
                                          @PathVariable String targetId,
                                          Authentication auth) {
        String userId = auth != null ? ((UserDetailsImpl) auth.getPrincipal()).getId() : null;
        return ResponseEntity.ok(reactionService.getReactions(targetType, targetId, userId));
    }

    @PostMapping("/{targetType}/{targetId}")
    public ResponseEntity<?> react(@PathVariable String targetType,
                                   @PathVariable String targetId,
                                   @RequestBody ReactionRequest request,
                                   Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body("Chưa đăng nhập!");
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(reactionService.react(targetType, targetId, request.getType(),
                user.getId(), user.getDisplayName()));
    }

    @Data
    static class ReactionRequest {
        private String type;
    }
}
