package com.kiemhiep.service;

import com.kiemhiep.dto.UpdateProfileRequest;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.PostRepository;
import com.kiemhiep.repository.TopicRepository;
import com.kiemhiep.repository.UserRepository;
import com.kiemhiep.util.UserLevel;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final PostRepository postRepository;

    public Map<String, Object> getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("displayName", user.getDisplayName());
        profile.put("bio", user.getBio());
        profile.put("avatar", user.getAvatar());
        profile.put("roles", user.getRoles());
        profile.put("memberStatus", user.getMemberStatus());
        profile.put("postCount", user.getPostCount());
        profile.put("createdAt", user.getCreatedAt());
        profile.put("exp", user.getExp());
        profile.put("level", UserLevel.getLevelName(user.getExp()));
        profile.put("levelIndex", UserLevel.getLevelIndex(user.getExp()));
        profile.put("nextThreshold", UserLevel.getNextThreshold(user.getExp()));
        profile.put("currentThreshold", UserLevel.getCurrentThreshold(user.getExp()));
        long topicCount = topicRepository.findByAuthorId(user.getId(), PageRequest.of(0, 1)).getTotalElements();
        profile.put("topicCount", topicCount);
        return profile;
    }

    public User getUser(String userId) {
        return userRepository.findById(userId).orElse(null);
    }

    public User updateProfile(String userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.getDisplayName() != null && !req.getDisplayName().isBlank()) {
            user.setDisplayName(req.getDisplayName().trim());
        }
        if (req.getBio() != null) {
            user.setBio(req.getBio().trim());
        }
        if (req.getAvatar() != null && !req.getAvatar().isBlank()) {
            user.setAvatar(req.getAvatar().trim());
        }
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
}
