package com.kiemhiep.controller;

import com.kiemhiep.model.Reaction;
import com.kiemhiep.repository.ReactionRepository;
import com.kiemhiep.security.UserDetailsImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionRepository reactionRepository;

    @GetMapping("/{targetType}/{targetId}")
    public ResponseEntity<?> getReactions(@PathVariable String targetType,
                                          @PathVariable String targetId,
                                          Authentication auth) {
        List<Reaction> reactions = reactionRepository
                .findByTargetIdAndTargetType(targetId, targetType.toUpperCase());

        Map<String, Long> counts = new HashMap<>();
        for (Reaction.ReactionType type : Reaction.ReactionType.values()) {
            counts.put(type.name(), reactions.stream()
                    .filter(r -> r.getType() == type).count());
        }

        String userReaction = null;
        if (auth != null) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            userReaction = reactions.stream()
                    .filter(r -> r.getUserId().equals(userDetails.getId()))
                    .map(r -> r.getType().name())
                    .findFirst().orElse(null);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("counts", counts);
        response.put("userReaction", userReaction);
        response.put("total", reactions.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{targetType}/{targetId}")
    public ResponseEntity<?> react(@PathVariable String targetType,
                                   @PathVariable String targetId,
                                   @RequestBody ReactionRequest request,
                                   Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body("Chưa đăng nhập!");

        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        String type = targetType.toUpperCase();

        Optional<Reaction> existing = reactionRepository
                .findByTargetIdAndUserIdAndTargetType(targetId, userDetails.getId(), type);

        if (existing.isPresent()) {
            if (existing.get().getType().name().equals(request.getType())) {
                reactionRepository.delete(existing.get());
                return ResponseEntity.ok(Map.of("action", "removed", "type", request.getType()));
            } else {
                Reaction reaction = existing.get();
                reaction.setType(Reaction.ReactionType.valueOf(request.getType()));
                reactionRepository.save(reaction);
                return ResponseEntity.ok(Map.of("action", "updated", "type", request.getType()));
            }
        } else {
            Reaction reaction = new Reaction();
            reaction.setTargetId(targetId);
            reaction.setTargetType(type);
            reaction.setUserId(userDetails.getId());
            reaction.setUsername(userDetails.getDisplayName());
            reaction.setType(Reaction.ReactionType.valueOf(request.getType()));
            reaction.setCreatedAt(LocalDateTime.now());
            reactionRepository.save(reaction);
            return ResponseEntity.ok(Map.of("action", "added", "type", request.getType()));
        }
    }

    @Data
    static class ReactionRequest {
        private String type;
    }
}
