package com.kiemhiep.controller;

import com.kiemhiep.model.Post;
import com.kiemhiep.model.Topic;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.PostRepository;
import com.kiemhiep.repository.TopicRepository;
import com.kiemhiep.repository.UserRepository;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {
    private final TopicRepository topicRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getTopics(
            @RequestParam(required = false) String categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Sort sort = Sort.by(
                Sort.Order.desc("pinned"),
                Sort.Order.desc("createdAt")
        );
        PageRequest pageable = PageRequest.of(page, size, sort);

        Page<Topic> topics;
        if (categoryId != null) {
            topics = topicRepository.findByCategoryIdAndStatus(categoryId, Topic.TopicStatus.APPROVED, pageable);
        } else {
            topics = topicRepository.findByStatus(Topic.TopicStatus.APPROVED, pageable);
        }
        return ResponseEntity.ok(topics);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTopic(@PathVariable String id) {
        return topicRepository.findById(id)
                .filter(t -> t.getStatus() == Topic.TopicStatus.APPROVED)
                .map(topic -> {
                    topic.setViewCount(topic.getViewCount() + 1);
                    topicRepository.save(topic);
                    return ResponseEntity.ok(topic);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<?> getTopicPosts(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Post> posts = postRepository.findByTopicIdAndStatus(id, Post.PostStatus.APPROVED, pageable);
        return ResponseEntity.ok(posts);
    }

    @PostMapping
    public ResponseEntity<?> createTopic(@RequestBody TopicRequest request, Authentication auth) {
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

        if (userDetails.getMemberStatus() != User.MemberStatus.APPROVED) {
            return ResponseEntity.status(403).body("Tài khoản chưa được phê duyệt!");
        }

        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        Topic topic = new Topic();
        topic.setTitle(request.getTitle());
        topic.setCategoryId(request.getCategoryId());
        topic.setAuthorId(userDetails.getId());
        topic.setAuthorName(user.getDisplayName());
        topic.setTags(request.getTags());
        topic.setStatus(Topic.TopicStatus.PENDING);
        topic.setCreatedAt(LocalDateTime.now());
        topic.setSlug(generateSlug(request.getTitle()));
        topicRepository.save(topic);

        // Create first post
        Post firstPost = new Post();
        firstPost.setTopicId(topic.getId());
        firstPost.setContent(request.getContent());
        firstPost.setAuthorId(userDetails.getId());
        firstPost.setAuthorName(user.getDisplayName());
        firstPost.setFirstPost(true);
        firstPost.setStatus(Post.PostStatus.PENDING);
        firstPost.setCreatedAt(LocalDateTime.now());
        postRepository.save(firstPost);

        return ResponseEntity.ok(topic);
    }

    @PostMapping("/{id}/posts")
    public ResponseEntity<?> replyToTopic(@PathVariable String id,
                                          @RequestBody PostRequest request, Authentication auth) {
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

        if (userDetails.getMemberStatus() != User.MemberStatus.APPROVED) {
            return ResponseEntity.status(403).body("Tài khoản chưa được phê duyệt!");
        }

        Topic topic = topicRepository.findById(id).orElseThrow();
        if (topic.isLocked()) {
            return ResponseEntity.status(403).body("Topic đã bị khóa!");
        }

        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        Post post = new Post();
        post.setTopicId(id);
        post.setContent(request.getContent());
        post.setAuthorId(userDetails.getId());
        post.setAuthorName(user.getDisplayName());
        post.setStatus(Post.PostStatus.APPROVED); // Replies auto-approved
        post.setCreatedAt(LocalDateTime.now());
        post.setQuotedPostId(request.getQuotedPostId());
        post.setQuotedContent(request.getQuotedContent());
        post.setQuotedAuthorName(request.getQuotedAuthorName());
        postRepository.save(post);

        // Update topic stats
        topic.setReplyCount(topic.getReplyCount() + 1);
        topic.setLastReplyUserId(userDetails.getId());
        topic.setLastReplyUsername(user.getDisplayName());
        topic.setLastReplyAt(LocalDateTime.now());
        topicRepository.save(topic);

        // Update user post count
        user.setPostCount(user.getPostCount() + 1);
        userRepository.save(user);

        // Notify topic author (only if different user)
        if (!topic.getAuthorId().equals(userDetails.getId())) {
            notificationService.send(
                topic.getAuthorId(),
                "REPLY",
                "Có người trả lời bài viết của bạn",
                user.getDisplayName() + " đã trả lời topic \"" + topic.getTitle() + "\"",
                "/topic/" + topic.getId()
            );
        }

        // Notify quoted post author (only if different user and not already notified above)
        if (request.getQuotedPostId() != null && !request.getQuotedPostId().isBlank()) {
            postRepository.findById(request.getQuotedPostId()).ifPresent(quotedPost -> {
                String quotedAuthorId = quotedPost.getAuthorId();
                boolean alreadyNotified = quotedAuthorId.equals(topic.getAuthorId());
                if (!quotedAuthorId.equals(userDetails.getId()) && !alreadyNotified) {
                    notificationService.send(
                        quotedAuthorId,
                        "QUOTE",
                        "Có người trích dẫn bình luận của bạn",
                        user.getDisplayName() + " đã trích dẫn bình luận của bạn trong topic \"" + topic.getTitle() + "\"",
                        "/topic/" + topic.getId()
                    );
                }
            });
        }

        return ResponseEntity.ok(post);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeTopic(@PathVariable String id, Authentication auth) {
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        Topic topic = topicRepository.findById(id).orElseThrow();
        topic.setLikeCount(topic.getLikeCount() + 1);
        topicRepository.save(topic);
        return ResponseEntity.ok(topic);
    }

    @GetMapping("/hot")
    public ResponseEntity<?> getHotTopics() {
        return ResponseEntity.ok(topicRepository.findTop10ByStatusOrderByViewCountDesc(Topic.TopicStatus.APPROVED));
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestTopics() {
        return ResponseEntity.ok(topicRepository.findTop10ByStatusOrderByCreatedAtDesc(Topic.TopicStatus.APPROVED));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchTopics(@RequestParam String q,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(topicRepository.findByStatusAndTitleContainingIgnoreCase(
                Topic.TopicStatus.APPROVED, q, pageable));
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                + "-" + System.currentTimeMillis();
    }

    @Data
    static class TopicRequest {
        private String title;
        private String categoryId;
        private String content;
        private java.util.List<String> tags;
    }

    @Data
    static class PostRequest {
        private String content;
        private String quotedPostId;
        private String quotedContent;
        private String quotedAuthorName;
    }
}