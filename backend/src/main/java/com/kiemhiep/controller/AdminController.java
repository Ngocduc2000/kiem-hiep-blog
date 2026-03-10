package com.kiemhiep.controller;

import com.kiemhiep.model.Post;
import com.kiemhiep.model.Topic;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.PostRepository;
import com.kiemhiep.repository.TopicRepository;
import com.kiemhiep.repository.UserRepository;
import com.kiemhiep.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
@RequiredArgsConstructor
public class AdminController {
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;

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

    @GetMapping("/stats/members")
    public ResponseEntity<?> getMemberStats() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User user : users) {
            if (user.getMemberStatus() != User.MemberStatus.APPROVED) continue;
            long topics = topicRepository.findByAuthorId(user.getId(),
                    PageRequest.of(0, 1)).getTotalElements();
            long posts = postRepository.findByAuthorId(user.getId(),
                    PageRequest.of(0, 1)).getTotalElements();
            if (topics == 0 && posts == 0) continue;
            Map<String, Object> row = new HashMap<>();
            row.put("name", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
            row.put("topics", topics);
            row.put("posts", posts);
            result.add(row);
        }
        result.sort((a, b) -> Long.compare(
            (long) b.get("topics") + (long) b.get("posts"),
            (long) a.get("topics") + (long) a.get("posts")));
        return ResponseEntity.ok(result.subList(0, Math.min(15, result.size())));
    }

    // ---- USER MANAGEMENT (ADMIN ONLY) ----
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users = userRepository.findAll(pageable);
        return ResponseEntity.ok(users);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users/pending")
    public ResponseEntity<?> getPendingUsers(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Filter manually since we don't have a pageable query for status
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(userRepository.findAll(pageable));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.setMemberStatus(User.MemberStatus.APPROVED);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            notificationService.send(user.getId(), "APPROVE_USER", "Tài khoản đã được duyệt", "Chúc mừng! Tài khoản của bạn đã được phê duyệt. Bạn có thể bắt đầu tham gia diễn đàn.", "/");
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            user.setMemberStatus(User.MemberStatus.REJECTED);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            notificationService.send(user.getId(), "REJECT_USER", "Tài khoản bị từ chối", "Rất tiếc, tài khoản của bạn đã bị từ chối.", "/");
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable String id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            user.setBanned(true);
            user.setBanReason(body.get("reason"));
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.setBanned(false);
            user.setBanReason(null);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/make-admin")
    public ResponseEntity<?> makeAdmin(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.getRoles().add("ADMIN");
            user.getRoles().remove("MOD");
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/make-mod")
    public ResponseEntity<?> makeMod(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.getRoles().add("MOD");
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/remove-mod")
    public ResponseEntity<?> removeMod(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.getRoles().remove("MOD");
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
            notificationService.send(topic.getAuthorId(), "APPROVE_TOPIC", "Bài viết đã được duyệt", "Bài viết \"" + topic.getTitle() + "\" của bạn đã được duyệt.", "/topic/" + topic.getId());
            return ResponseEntity.ok(topic);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/topics/{id}/reject")
    public ResponseEntity<?> rejectTopic(@PathVariable String id) {
        return topicRepository.findById(id).map(topic -> {
            topic.setStatus(Topic.TopicStatus.REJECTED);
            topicRepository.save(topic);
            notificationService.send(topic.getAuthorId(), "REJECT_TOPIC", "Bài viết bị từ chối", "Bài viết \"" + topic.getTitle() + "\" của bạn đã bị từ chối.", "/");
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
