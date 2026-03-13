package com.kiemhiep.controller;

import com.kiemhiep.dto.AuthDto;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody AuthDto.ChangePasswordRequest request,
                                            Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(new AuthDto.MessageResponse("Chưa đăng nhập"));
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        authService.changePassword(user.getId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(new AuthDto.MessageResponse("Đổi mật khẩu thành công!"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(new AuthDto.MessageResponse("Chưa đăng nhập"));
        return ResponseEntity.ok(authService.getCurrentUser((UserDetailsImpl) auth.getPrincipal()));
    }
}
