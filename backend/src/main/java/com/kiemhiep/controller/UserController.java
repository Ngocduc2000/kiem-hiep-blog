package com.kiemhiep.controller;

import com.kiemhiep.model.User;
import com.kiemhiep.repository.PostRepository;
import com.kiemhiep.repository.TopicRepository;
import com.kiemhiep.repository.UserRepository;
import com.kiemhiep.security.UserDetailsImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final PostRepository postRepository;

    /** Public profile by username */
    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(user -> {
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
                    long topicCount = topicRepository.findByAuthorId(user.getId(), PageRequest.of(0, 1)).getTotalElements();
                    profile.put("topicCount", topicCount);
                    return ResponseEntity.ok(profile);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Get current user's own profile */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication auth) {
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Update own profile */
    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody UpdateProfileRequest req, Authentication auth) {
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        return userRepository.findById(userDetails.getId()).map(user -> {
            if (req.getDisplayName() != null && !req.getDisplayName().isBlank()) {
                user.setDisplayName(req.getDisplayName().trim());
            }
            if (req.getBio() != null) {
                user.setBio(req.getBio().trim());
            }
            user.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Data
    static class UpdateProfileRequest {
        private String displayName;
        private String bio;
    }
}
