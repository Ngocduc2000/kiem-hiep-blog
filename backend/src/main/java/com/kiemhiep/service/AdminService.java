package com.kiemhiep.service;

import com.kiemhiep.model.Post;
import com.kiemhiep.model.Report;
import com.kiemhiep.model.Topic;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.PostRepository;
import com.kiemhiep.repository.ReportRepository;
import com.kiemhiep.repository.TopicRepository;
import com.kiemhiep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;
    private final NotificationService notificationService;

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("pendingUsers", userRepository.countByMemberStatus(User.MemberStatus.PENDING));
        stats.put("totalTopics", topicRepository.count());
        stats.put("pendingTopics", topicRepository.countByStatus(Topic.TopicStatus.PENDING));
        stats.put("totalPosts", postRepository.count());
        stats.put("pendingPosts", postRepository.countByStatus(Post.PostStatus.PENDING));
        stats.put("pendingReports", reportRepository.countByStatus(Report.ReportStatus.PENDING));
        return stats;
    }

    public List<Map<String, Object>> getMemberStats() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User user : users) {
            if (user.getMemberStatus() != User.MemberStatus.APPROVED) continue;
            long topics = topicRepository.findByAuthorId(user.getId(), PageRequest.of(0, 1)).getTotalElements();
            long posts = postRepository.findByAuthorId(user.getId(), PageRequest.of(0, 1)).getTotalElements();
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
        return result.subList(0, Math.min(15, result.size()));
    }

    public Page<User> getUsers(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public User approveUser(String id) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        user.setMemberStatus(User.MemberStatus.APPROVED);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        notificationService.send(user.getId(), "APPROVE_USER", "Tài khoản đã được duyệt",
                "Chúc mừng! Tài khoản của bạn đã được phê duyệt. Bạn có thể bắt đầu tham gia diễn đàn.", "/");
        return user;
    }

    public User rejectUser(String id) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        user.setMemberStatus(User.MemberStatus.REJECTED);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        notificationService.send(user.getId(), "REJECT_USER", "Tài khoản bị từ chối",
                "Rất tiếc, tài khoản của bạn đã bị từ chối.", "/");
        return user;
    }

    public User banUser(String id, String reason) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        user.setBanned(true);
        user.setBanReason(reason);
        return userRepository.save(user);
    }

    public User unbanUser(String id) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        user.setBanned(false);
        user.setBanReason(null);
        return userRepository.save(user);
    }

    public User makeAdmin(String id) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        user.getRoles().add("ADMIN");
        user.getRoles().remove("MOD");
        return userRepository.save(user);
    }

    public User makeMod(String id) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        user.getRoles().add("MOD");
        return userRepository.save(user);
    }

    public User removeMod(String id) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        user.getRoles().remove("MOD");
        return userRepository.save(user);
    }

    public Page<Topic> getPendingTopics(int page, int size) {
        return topicRepository.findByStatus(Topic.TopicStatus.PENDING,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public Topic approveTopic(String id) {
        Topic topic = topicRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        topic.setStatus(Topic.TopicStatus.APPROVED);
        topic.setUpdatedAt(LocalDateTime.now());
        topicRepository.save(topic);
        postRepository.findByTopicIdAndIsFirstPostTrue(id).ifPresent(post -> {
            post.setStatus(Post.PostStatus.APPROVED);
            post.setApprovedAt(LocalDateTime.now());
            postRepository.save(post);
        });
        notificationService.send(topic.getAuthorId(), "APPROVE_TOPIC", "Bài viết đã được duyệt",
                "Bài viết \"" + topic.getTitle() + "\" của bạn đã được duyệt.", "/topic/" + topic.getId());
        return topic;
    }

    public Topic rejectTopic(String id) {
        Topic topic = topicRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        topic.setStatus(Topic.TopicStatus.REJECTED);
        topicRepository.save(topic);
        notificationService.send(topic.getAuthorId(), "REJECT_TOPIC", "Bài viết bị từ chối",
                "Bài viết \"" + topic.getTitle() + "\" của bạn đã bị từ chối.", "/");
        return topic;
    }

    public Topic pinTopic(String id) {
        Topic topic = topicRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        topic.setPinned(!topic.isPinned());
        return topicRepository.save(topic);
    }

    public Topic lockTopic(String id) {
        Topic topic = topicRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        topic.setLocked(!topic.isLocked());
        return topicRepository.save(topic);
    }

    public Topic markHotTopic(String id) {
        Topic topic = topicRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        topic.setHot(!topic.isHot());
        return topicRepository.save(topic);
    }

    public void deleteTopic(String id) {
        topicRepository.deleteById(id);
    }

    public Page<Post> getPendingPosts(int page, int size) {
        return postRepository.findByStatus(Post.PostStatus.PENDING,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public Post approvePost(String id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        post.setStatus(Post.PostStatus.APPROVED);
        post.setApprovedAt(LocalDateTime.now());
        return postRepository.save(post);
    }

    public Post rejectPost(String id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        post.setStatus(Post.PostStatus.REJECTED);
        return postRepository.save(post);
    }

    public void deletePost(String id) {
        postRepository.deleteById(id);
    }
}
