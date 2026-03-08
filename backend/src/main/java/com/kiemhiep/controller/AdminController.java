package com.kiemhiep.controller;

import com.kiemhiep.model.Post;
import com.kiemhiep.model.Topic;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.PostRepository;
import com.kiemhiep.repository.TopicRepository;
import com.kiemhiep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final PostRepository postRepository;

    // ---- DASHBOARD ----
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("pendingUsers", userRepository.countByMemberStatus(User.MemberStatus.PENDING));
        stats.put("totalTopics", topicRepository.count());
        stats.put("pendingTopics", topicRepository.countByStatus(Topic.TopicStatus.PENDING));
        stats.put("totalPosts", postRepository.count());
        stats.put("pendingPosts", postRepository.countByStatus(Post.PostStatus.PENDING));
        return ResponseEntity.ok(stats);
    }

    // ---- USER MANAGEMENT ----
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users = userRepository.findAll(pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/pending")
    public ResponseEntity<?> getPendingUsers(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Filter manually since we don't have a pageable query for status
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(userRepository.findAll(pageable));
    }

    @PostMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.setMemberStatus(User.MemberStatus.APPROVED);
            user.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            user.setMemberStatus(User.MemberStatus.REJECTED);
            user.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable String id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            user.setBanned(true);
            user.setBanReason(body.get("reason"));
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.setBanned(false);
            user.setBanReason(null);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/make-admin")
    public ResponseEntity<?> makeAdmin(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.getRoles().add("ADMIN");
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- TOPIC MANAGEMENT ----
    @GetMapping("/topics/pending")
    public ResponseEntity<?> getPendingTopics(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(topicRepository.findByStatus(Topic.TopicStatus.PENDING, pageable));
    }

    @PostMapping("/topics/{id}/approve")
    public ResponseEntity<?> approveTopic(@PathVariable String id) {
        return topicRepository.findById(id).map(topic -> {
            topic.setStatus(Topic.TopicStatus.APPROVED);
            topic.setUpdatedAt(LocalDateTime.now());
            topicRepository.save(topic);
            // Also approve the first post
            postRepository.findByTopicIdAndIsFirstPostTrue(id).ifPresent(post -> {
                post.setStatus(Post.PostStatus.APPROVED);
                post.setApprovedAt(LocalDateTime.now());
                postRepository.save(post);
            });
            return ResponseEntity.ok(topic);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/topics/{id}/reject")
    public ResponseEntity<?> rejectTopic(@PathVariable String id) {
        return topicRepository.findById(id).map(topic -> {
            topic.setStatus(Topic.TopicStatus.REJECTED);
            topicRepository.save(topic);
            return ResponseEntity.ok(topic);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/topics/{id}/pin")
    public ResponseEntity<?> pinTopic(@PathVariable String id) {
        return topicRepository.findById(id).map(topic -> {
            topic.setPinned(!topic.isPinned());
            return ResponseEntity.ok(topicRepository.save(topic));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/topics/{id}/lock")
    public ResponseEntity<?> lockTopic(@PathVariable String id) {
        return topicRepository.findById(id).map(topic -> {
            topic.setLocked(!topic.isLocked());
            return ResponseEntity.ok(topicRepository.save(topic));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/topics/{id}/hot")
    public ResponseEntity<?> markHot(@PathVariable String id) {
        return topicRepository.findById(id).map(topic -> {
            topic.setHot(!topic.isHot());
            return ResponseEntity.ok(topicRepository.save(topic));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<?> deleteTopic(@PathVariable String id) {
        topicRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ---- POST MANAGEMENT ----
    @GetMapping("/posts/pending")
    public ResponseEntity<?> getPendingPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(postRepository.findByStatus(Post.PostStatus.PENDING, pageable));
    }

    @PostMapping("/posts/{id}/approve")
    public ResponseEntity<?> approvePost(@PathVariable String id) {
        return postRepository.findById(id).map(post -> {
            post.setStatus(Post.PostStatus.APPROVED);
            post.setApprovedAt(LocalDateTime.now());
            return ResponseEntity.ok(postRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/posts/{id}/reject")
    public ResponseEntity<?> rejectPost(@PathVariable String id) {
        return postRepository.findById(id).map(post -> {
            post.setStatus(Post.PostStatus.REJECTED);
            return ResponseEntity.ok(postRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable String id) {
        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
