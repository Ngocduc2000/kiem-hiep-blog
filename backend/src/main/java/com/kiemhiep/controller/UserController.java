package com.kiemhiep.controller;

import com.kiemhiep.dto.UpdateProfileRequest;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.UserRepository;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        return ResponseEntity.ok(userService.getProfile(username));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication auth) {
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody UpdateProfileRequest req, Authentication auth) {
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(userService.updateProfile(userDetails.getId(), req));
    }
}
