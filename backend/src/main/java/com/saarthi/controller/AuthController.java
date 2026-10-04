package com.saarthi.controller;

import com.saarthi.dto.UserProfileResponse;
import com.saarthi.exception.InvalidApiRequestException;
import com.saarthi.model.User;
import com.saarthi.repository.UserRepository;
import com.saarthi.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String name = request.get("name");

        if (isBlank(username) || isBlank(password) || isBlank(name)) {
            throw new InvalidApiRequestException("Username, password, and name are required");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            throw new InvalidApiRequestException("Username is already taken!");
        }

        User user = new User(username, passwordEncoder.encode(password), name);
        user.setAge(request.getOrDefault("age", ""));
        user.setLocation(request.getOrDefault("location", ""));
        user.setPregnancyStatus(request.getOrDefault("pregnancyStatus", ""));

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully!"));
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (isBlank(username) || isBlank(password)) {
            throw new InvalidApiRequestException("Username and password are required");
        }

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));

        final UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        final String jwt = jwtUtil.generateToken(userDetails);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User was not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("username", user.getUsername());
        response.put("name", user.getName());
        response.put("age", user.getAge());
        response.put("location", user.getLocation());
        response.put("pregnancyStatus", user.getPregnancyStatus());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new InsufficientAuthenticationException("Authentication is required");
        }
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new NoSuchElementException("Authenticated user was not found"));
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
