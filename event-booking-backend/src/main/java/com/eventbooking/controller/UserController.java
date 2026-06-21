package com.eventbooking.controller;

import com.eventbooking.dto.UserResponse;
import com.eventbooking.entity.User;
import com.eventbooking.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        User user = currentUserProvider.getCurrentUser();
        return ResponseEntity.ok(UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build());
    }
}
