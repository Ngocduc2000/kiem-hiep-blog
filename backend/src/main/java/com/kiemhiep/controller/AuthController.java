package com.kiemhiep.controller;

import com.kiemhiep.dto.AuthDto;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.UserRepository;
import com.kiemhiep.security.JwtUtils;
import com.kiemhiep.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthDto.LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());

        // Update last login
        userRepository.findById(userDetails.getId()).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });

        return ResponseEntity.ok(new AuthDto.JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getDisplayName(),
                userDetails.getMemberStatus().name(),
                roles
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody AuthDto.RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(new AuthDto.MessageResponse("Tên người dùng đã tồn tại!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new AuthDto.MessageResponse("Email đã được sử dụng!"));
        }

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setDisplayName(signUpRequest.getDisplayName() != null ?
                signUpRequest.getDisplayName() : signUpRequest.getUsername());
        user.setRoles(Set.of("USER"));
        user.setMemberStatus(User.MemberStatus.PENDING);
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);

        return ResponseEntity.ok(new AuthDto.MessageResponse(
                "Đăng ký thành công! Tài khoản đang chờ admin phê duyệt."));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody AuthDto.ChangePasswordRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(new AuthDto.MessageResponse("Chưa đăng nhập"));
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(new AuthDto.MessageResponse("Không tìm thấy tài khoản"));
        }
        if (!encoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(new AuthDto.MessageResponse("Mật khẩu hiện tại không đúng"));
        }
        user.setPassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(new AuthDto.MessageResponse("Đổi mật khẩu thành công!"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(new AuthDto.MessageResponse("Chưa đăng nhập"));
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());

        return ResponseEntity.ok(new AuthDto.JwtResponse(
                null, userDetails.getId(), userDetails.getUsername(),
                userDetails.getEmail(), userDetails.getDisplayName(),
                userDetails.getMemberStatus().name(), roles
        ));
    }
}
