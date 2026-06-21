package com.eventbooking.service;

import com.eventbooking.dto.AuthResponse;
import com.eventbooking.dto.LoginRequest;
import com.eventbooking.dto.RefreshRequest;
import com.eventbooking.dto.RegisterRequest;
import com.eventbooking.entity.Role;
import com.eventbooking.entity.User;
import com.eventbooking.exception.DuplicateResourceException;
import com.eventbooking.repository.UserRepository;
import com.eventbooking.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        // Public registration can only create USER or ORGANIZER accounts -
        // ADMIN is deliberately excluded here, even though the DTO technically
        // accepts a Role value. Never let the client grant itself admin.
        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot self-register as ADMIN");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        userRepository.save(user);

        return issueTokens(user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return issueTokens(request.getEmail());
    }

    public AuthResponse refresh(RefreshRequest request) {
        String token = request.getRefreshToken();

        if (!jwtUtil.isTokenStructurallyValid(token)) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        String email = jwtUtil.extractEmail(token);

        if (!jwtUtil.isTokenValid(token, email)) {
            throw new BadCredentialsException("Refresh token expired or invalid");
        }

        // Rotate both tokens on refresh rather than just reissuing the access
        // token - if a refresh token is ever stolen, the legitimate user's next
        // refresh invalidates it implicitly by getting a new one.
        return issueTokens(email);
    }

    private AuthResponse issueTokens(String email) {
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(email))
                .refreshToken(jwtUtil.generateRefreshToken(email))
                .tokenType("Bearer")
                .expiresInSeconds(jwtUtil.getAccessTokenExpirationSeconds())
                .build();
    }
}
