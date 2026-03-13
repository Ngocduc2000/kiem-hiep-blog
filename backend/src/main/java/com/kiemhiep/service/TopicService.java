package com.kiemhiep.service;

import com.kiemhiep.dto.PostRequest;
import com.kiemhiep.dto.TopicRequest;
import com.kiemhiep.model.Post;
import com.kiemhiep.model.Topic;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.PostRepository;
import com.kiemhiep.repository.TopicRepository;
import com.kiemhiep.repository.UserRepository;
import com.kiemhiep.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TopicService {

    private final TopicRepository topicRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public Page<Topic> getTopics(String categoryId, int page, int size) {
        Sort sort = Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("createdAt"));
        PageRequest pageable = PageRequest.of(page, size, sort);
        if (categoryId != null) {
            return topicRepository.findByCategoryIdAndStatus(categoryId, Topic.TopicStatus.APPROVED, pageable);
        }
        return topicRepository.findByStatus(Topic.TopicStatus.APPROVED, pageable);
    }

    public Topic getTopic(String id) {
        Topic topic = topicRepository.findById(id)
                .filter(t -> t.getStatus() == Topic.TopicStatus.APPROVED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        topic.setViewCount(topic.getViewCount() + 1);
        return topicRepository.save(topic);
    }

    public Page<Post> getTopicPosts(String id, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Post> posts = postRepository.findByTopicIdAndStatus(id, Post.PostStatus.APPROVED, pageable);
        posts.forEach(p -> {
            // If authorUsername is null, fetch from User collection
            if (p.getAuthorUsername() == null && p.getAuthorId() != null) {
                userRepository.findById(p.getAuthorId())
                        .ifPresent(user -> p.setAuthorUsername(user.getUsername()));
            }
            log.debug("Post - id: {}, username: {}, displayName: {}", p.getId(), p.getAuthorUsername(), p.getAuthorName());
        });
        return posts;
    }

    public Topic createTopic(TopicRequest request, UserDetailsImpl userDetails) {
        if (userDetails.getMemberStatus() != User.MemberStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được phê duyệt!");
        }
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        boolean isStaff = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MOD"));

        Topic topic = new Topic();
        topic.setTitle(request.getTitle());
        topic.setCategoryId(request.getCategoryId());
        topic.setAuthorId(userDetails.getId());
        topic.setAuthorName(user.getDisplayName());
        topic.setTags(request.getTags());
        topic.setStatus(isStaff ? Topic.TopicStatus.APPROVED : Topic.TopicStatus.PENDING);
        topic.setCreatedAt(LocalDateTime.now());
        topic.setSlug(generateSlug(request.getTitle()));
        topicRepository.save(topic);

        Post firstPost = new Post();
        firstPost.setTopicId(topic.getId());
        firstPost.setContent(request.getContent());
        firstPost.setAuthorId(userDetails.getId());
        firstPost.setAuthorUsername(user.getUsername());
        firstPost.setAuthorName(user.getDisplayName());
        firstPost.setFirstPost(true);
        firstPost.setStatus(isStaff ? Post.PostStatus.APPROVED : Post.PostStatus.PENDING);
        firstPost.setCreatedAt(LocalDateTime.now());
        log.info("Creating first post - username: {}, displayName: {}", user.getUsername(), user.getDisplayName());
        postRepository.save(firstPost);

        user.setExp(user.getExp() + 20);
        userRepository.save(user);

        return topic;
    }

    public Post replyToTopic(String topicId, PostRequest request, UserDetailsImpl userDetails) {
        if (userDetails.getMemberStatus() != User.MemberStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được phê duyệt!");
        }
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (topic.isLocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Topic đã bị khóa!");
        }
        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        Post post = new Post();
        post.setTopicId(topicId);
        post.setContent(request.getContent());
        post.setAuthorId(userDetails.getId());
        post.setAuthorUsername(user.getUsername());
        post.setAuthorName(user.getDisplayName());
        post.setStatus(Post.PostStatus.APPROVED);
        post.setCreatedAt(LocalDateTime.now());
        post.setQuotedPostId(request.getQuotedPostId());
        post.setQuotedContent(request.getQuotedContent());
        post.setQuotedAuthorName(request.getQuotedAuthorName());
        log.info("Creating reply post - username: {}, displayName: {}", user.getUsername(), user.getDisplayName());
        postRepository.save(post);

        topic.setReplyCount(topic.getReplyCount() + 1);
        topic.setLastReplyUserId(userDetails.getId());
        topic.setLastReplyUsername(user.getDisplayName());
        topic.setLastReplyAt(LocalDateTime.now());
        topicRepository.save(topic);

        user.setPostCount(user.getPostCount() + 1);
        user.setExp(user.getExp() + 5);
        userRepository.save(user);

        if (!topic.getAuthorId().equals(userDetails.getId())) {
            notificationService.send(topic.getAuthorId(), "REPLY",
                    "Có người trả lời bài viết của bạn",
                    user.getDisplayName() + " đã trả lời topic \"" + topic.getTitle() + "\"",
                    "/topic/" + topic.getId());
        }
        if (request.getQuotedPostId() != null && !request.getQuotedPostId().isBlank()) {
            postRepository.findById(request.getQuotedPostId()).ifPresent(quotedPost -> {
                String quotedAuthorId = quotedPost.getAuthorId();
                if (!quotedAuthorId.equals(userDetails.getId()) && !quotedAuthorId.equals(topic.getAuthorId())) {
                    notificationService.send(quotedAuthorId, "QUOTE",
                            "Có người trích dẫn bình luận của bạn",
                            user.getDisplayName() + " đã trích dẫn bình luận của bạn trong topic \"" + topic.getTitle() + "\"",
                            "/topic/" + topic.getId());
                }
            });
        }
        return post;
    }

    public Topic likeTopic(String id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        topic.setLikeCount(topic.getLikeCount() + 1);
        return topicRepository.save(topic);
    }

    public List<Topic> getHotTopics() {
        return topicRepository.findTop10ByStatusOrderByViewCountDesc(Topic.TopicStatus.APPROVED);
    }

    public List<Topic> getLatestTopics() {
        return topicRepository.findTop10ByStatusOrderByCreatedAtDesc(Topic.TopicStatus.APPROVED);
    }

    public Page<Topic> searchTopics(String q, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return topicRepository.findByStatusAndTitleContainingIgnoreCase(Topic.TopicStatus.APPROVED, q, pageable);
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                + "-" + System.currentTimeMillis();
    }
}
