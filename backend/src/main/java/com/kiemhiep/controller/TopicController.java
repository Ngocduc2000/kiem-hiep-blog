package com.kiemhiep.controller;

import com.kiemhiep.dto.PostRequest;
import com.kiemhiep.dto.TopicRequest;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.TopicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @GetMapping
    public ResponseEntity<?> getTopics(@RequestParam(required = false) String categoryId,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        log.info("[GET /api/topics] categoryId={} page={} size={}", categoryId, page, size);
        return ResponseEntity.ok(topicService.getTopics(categoryId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTopic(@PathVariable String id) {
        log.info("[GET /api/topics/{}]", id);
        return ResponseEntity.ok(topicService.getTopic(id));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<?> getTopicPosts(@PathVariable String id,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "15") int size) {
        log.info("[GET /api/topics/{}/posts] page={} size={}", id, page, size);
        return ResponseEntity.ok(topicService.getTopicPosts(id, page, size));
    }

    @PostMapping
    public ResponseEntity<?> createTopic(@RequestBody TopicRequest request, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        log.info("[POST /api/topics] userId={}", user.getId());
        return ResponseEntity.ok(topicService.createTopic(request, user));
    }

    @PostMapping("/{id}/posts")
    public ResponseEntity<?> replyToTopic(@PathVariable String id,
                                          @RequestBody PostRequest request, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        log.info("[POST /api/topics/{}/posts] userId={}", id, user.getId());
        return ResponseEntity.ok(topicService.replyToTopic(id, request, user));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeTopic(@PathVariable String id) {
        log.info("[POST /api/topics/{}/like]", id);
        return ResponseEntity.ok(topicService.likeTopic(id));
    }

    @GetMapping("/hot")
    public ResponseEntity<?> getHotTopics() {
        log.info("[GET /api/topics/hot]");
        return ResponseEntity.ok(topicService.getHotTopics());
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestTopics() {
        log.info("[GET /api/topics/latest]");
        return ResponseEntity.ok(topicService.getLatestTopics());
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchTopics(@RequestParam String q,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        log.info("[GET /api/topics/search] q={} page={} size={}", q, page, size);
        return ResponseEntity.ok(topicService.searchTopics(q, page, size));
    }
}
