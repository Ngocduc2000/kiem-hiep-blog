package com.kiemhiep.service;

import com.kiemhiep.model.Reaction;
import com.kiemhiep.repository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;

    public Map<String, Object> getReactions(String targetType, String targetId, String userId) {
        List<Reaction> reactions = reactionRepository.findByTargetIdAndTargetType(targetId, targetType.toUpperCase());
        Map<String, Long> counts = new HashMap<>();
        for (Reaction.ReactionType type : Reaction.ReactionType.values()) {
            counts.put(type.name(), reactions.stream().filter(r -> r.getType() == type).count());
        }
        String userReaction = null;
        if (userId != null) {
            userReaction = reactions.stream()
                    .filter(r -> r.getUserId().equals(userId))
                    .map(r -> r.getType().name())
                    .findFirst().orElse(null);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("counts", counts);
        response.put("userReaction", userReaction);
        response.put("total", reactions.size());
        return response;
    }

    public Map<String, Object> react(String targetType, String targetId, String reactionType, String userId, String username) {
        String type = targetType.toUpperCase();
        Optional<Reaction> existing = reactionRepository.findByTargetIdAndUserIdAndTargetType(targetId, userId, type);
        if (existing.isPresent()) {
            if (existing.get().getType().name().equals(reactionType)) {
                reactionRepository.delete(existing.get());
                return Map.of("action", "removed", "type", reactionType);
            } else {
                Reaction reaction = existing.get();
                reaction.setType(Reaction.ReactionType.valueOf(reactionType));
                reactionRepository.save(reaction);
                return Map.of("action", "updated", "type", reactionType);
            }
        }
        Reaction reaction = new Reaction();
        reaction.setTargetId(targetId);
        reaction.setTargetType(type);
        reaction.setUserId(userId);
        reaction.setUsername(username);
        reaction.setType(Reaction.ReactionType.valueOf(reactionType));
        reaction.setCreatedAt(LocalDateTime.now());
        reactionRepository.save(reaction);
        return Map.of("action", "added", "type", reactionType);
    }
}
