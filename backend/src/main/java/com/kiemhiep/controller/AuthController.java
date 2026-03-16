package com.kiemhiep.controller;

import com.kiemhiep.dto.AuthDto;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        log.info("[POST /api/auth/login] username={}", request.getUsername());
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        log.info("[POST /api/auth/register] username={}", request.getUsername());
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody AuthDto.ChangePasswordRequest request,
                                            Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(new AuthDto.MessageResponse("Chưa đăng nhập"));
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        log.info("[POST /api/auth/change-password] userId={}", user.getId());
        authService.changePassword(user.getId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(new AuthDto.MessageResponse("Đổi mật khẩu thành công!"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(new AuthDto.MessageResponse("Chưa đăng nhập"));
        log.info("[GET /api/auth/me] userId={}", ((UserDetailsImpl) auth.getPrincipal()).getId());
        return ResponseEntity.ok(authService.getCurrentUser((UserDetailsImpl) auth.getPrincipal()));
    }
}
