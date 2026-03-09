package com.kiemhiep.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDto {
    @Data
    public static class RegisterRequest {
        @NotBlank @Size(min = 3, max = 20)
        private String username;
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 6, max = 40)
        private String password;
        private String displayName;
    }

    @Data
    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
    }

    @Data
    public static class JwtResponse {
        private String token;
        private String type = "Bearer";
        private String id;
        private String username;
        private String email;
        private String displayName;
        private String memberStatus;
        private java.util.List<String> roles;

        public JwtResponse(String token, String id, String username, String email,
                          String displayName, String memberStatus, java.util.List<String> roles) {
            this.token = token;
            this.id = id;
            this.username = username;
            this.email = email;
            this.displayName = displayName;
            this.memberStatus = memberStatus;
            this.roles = roles;
        }
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank @Size(min = 6, max = 40) private String newPassword;
    }

    @Data
    public static class MessageResponse {
        private String message;
        public MessageResponse(String message) { this.message = message; }
    }
}
