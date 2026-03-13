package com.kiemhiep.controller;

import com.kiemhiep.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/stats/members")
    public ResponseEntity<?> getMemberStats() {
        return ResponseEntity.ok(adminService.getMemberStats());
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUsers(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getUsers(page, size));
    }

    @GetMapping("/users/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingUsers(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getUsers(page, size));
    }

    @PostMapping("/users/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveUser(@PathVariable String id) {
        return ResponseEntity.ok(adminService.approveUser(id));
    }

    @PostMapping("/users/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectUser(@PathVariable String id) {
        return ResponseEntity.ok(adminService.rejectUser(id));
    }

    @PostMapping("/users/{id}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> banUser(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminService.banUser(id, body.get("reason")));
    }

    @PostMapping("/users/{id}/unban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unbanUser(@PathVariable String id) {
        return ResponseEntity.ok(adminService.unbanUser(id));
    }

    @PostMapping("/users/{id}/make-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> makeAdmin(@PathVariable String id) {
        return ResponseEntity.ok(adminService.makeAdmin(id));
    }

    @PostMapping("/users/{id}/make-mod")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> makeMod(@PathVariable String id) {
        return ResponseEntity.ok(adminService.makeMod(id));
    }

    @PostMapping("/users/{id}/remove-mod")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeMod(@PathVariable String id) {
        return ResponseEntity.ok(adminService.removeMod(id));
    }

    @GetMapping("/topics/pending")
    public ResponseEntity<?> getPendingTopics(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getPendingTopics(page, size));
    }

    @PostMapping("/topics/{id}/approve")
    public ResponseEntity<?> approveTopic(@PathVariable String id) {
        return ResponseEntity.ok(adminService.approveTopic(id));
    }

    @PostMapping("/topics/{id}/reject")
    public ResponseEntity<?> rejectTopic(@PathVariable String id) {
        return ResponseEntity.ok(adminService.rejectTopic(id));
    }

    @PostMapping("/topics/{id}/pin")
    public ResponseEntity<?> pinTopic(@PathVariable String id) {
        return ResponseEntity.ok(adminService.pinTopic(id));
    }

    @PostMapping("/topics/{id}/lock")
    public ResponseEntity<?> lockTopic(@PathVariable String id) {
        return ResponseEntity.ok(adminService.lockTopic(id));
    }

    @PostMapping("/topics/{id}/hot")
    public ResponseEntity<?> markHot(@PathVariable String id) {
        return ResponseEntity.ok(adminService.markHotTopic(id));
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<?> deleteTopic(@PathVariable String id) {
        adminService.deleteTopic(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/posts/pending")
    public ResponseEntity<?> getPendingPosts(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getPendingPosts(page, size));
    }

    @PostMapping("/posts/{id}/approve")
    public ResponseEntity<?> approvePost(@PathVariable String id) {
        return ResponseEntity.ok(adminService.approvePost(id));
    }

    @PostMapping("/posts/{id}/reject")
    public ResponseEntity<?> rejectPost(@PathVariable String id) {
        return ResponseEntity.ok(adminService.rejectPost(id));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable String id) {
        adminService.deletePost(id);
        return ResponseEntity.ok().build();
    }
}
