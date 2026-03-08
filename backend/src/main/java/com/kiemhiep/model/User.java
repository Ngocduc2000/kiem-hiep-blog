package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String displayName;
    private String avatar;
    private String bio;

    private Set<String> roles = new HashSet<>();

    private boolean active = true;
    private boolean banned = false;
    private String banReason;

    // Membership status
    private MemberStatus memberStatus = MemberStatus.PENDING;

    private int postCount = 0;
    private int reputationPoints = 0;

    @CreatedDate
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLogin;

    public enum MemberStatus {
        PENDING, APPROVED, REJECTED
    }
}
