package com.kiemhiep.controller;

import com.kiemhiep.dto.PostRequest;
import com.kiemhiep.dto.TopicRequest;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @GetMapping
    public ResponseEntity<?> getTopics(@RequestParam(required = false) String categoryId,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(topicService.getTopics(categoryId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTopic(@PathVariable String id) {
        return ResponseEntity.ok(topicService.getTopic(id));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<?> getTopicPosts(@PathVariable String id,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(topicService.getTopicPosts(id, page, size));
    }

    @PostMapping
    public ResponseEntity<?> createTopic(@RequestBody TopicRequest request, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(topicService.createTopic(request, user));
    }

    @PostMapping("/{id}/posts")
    public ResponseEntity<?> replyToTopic(@PathVariable String id,
                                          @RequestBody PostRequest request, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(topicService.replyToTopic(id, request, user));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeTopic(@PathVariable String id) {
        return ResponseEntity.ok(topicService.likeTopic(id));
    }

    @GetMapping("/hot")
    public ResponseEntity<?> getHotTopics() {
        return ResponseEntity.ok(topicService.getHotTopics());
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestTopics() {
        return ResponseEntity.ok(topicService.getLatestTopics());
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchTopics(@RequestParam String q,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(topicService.searchTopics(q, page, size));
    }
}
