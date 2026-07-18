package com.hari.mortgage.service.impl;

import com.hari.mortgage.dto.request.LoginRequest;
import com.hari.mortgage.dto.request.RegisterRequest;
import com.hari.mortgage.dto.response.LoginResponse;
import com.hari.mortgage.entity.User;
import com.hari.mortgage.enums.Role;
import com.hari.mortgage.repository.UserRepository;
import com.hari.mortgage.security.JwtService;
import com.hari.mortgage.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtService jwtService;

    private final AuthenticationManager authenticationManager;

    @Override
    public String register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already exists";
        }

        Role role = Role.ROLE_CUSTOMER;

        if ("ADMIN123".equals(request.getAdminKey())) {
            role = Role.ROLE_ADMIN;
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);

        return role == Role.ROLE_ADMIN
                ? "Admin Registered Successfully"
                : "Customer Registered Successfully";
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        UserDetails userDetails =
                org.springframework.security.core.userdetails.User
                        .withUsername(user.getEmail())
                        .password(user.getPassword())
                        .roles(user.getRole().name().replace("ROLE_", ""))
                        .build();

        String token = jwtService.generateToken(userDetails);

        return new LoginResponse(token,user.getRole().name());
    }

}