package com.ngxcrm.identity_service.controller;

import com.ngxcrm.identity_service.dto.AuthResponse;
import com.ngxcrm.identity_service.model.User;
import com.ngxcrm.identity_service.repository.UserRepository;
import com.ngxcrm.identity_service.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;

import java.util.UUID;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import com.ngxcrm.identity_service.model.Role;
import com.ngxcrm.identity_service.repository.RoleRepository;

@Controller
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @MutationMapping
    public User registerUser(
            @Argument String email,
            @Argument String passwordHash,
            @Argument String firstName,
            @Argument String lastName
    ) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("User already exists with email: " + email);
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(passwordHash));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setActive(true);
        
        return userRepository.save(user);
    }

    @MutationMapping
    public AuthResponse login(@Argument String email, @Argument String passwordHash) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, passwordHash)
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String jwtToken = jwtService.generateToken(user);
        return new AuthResponse(jwtToken, user);
    }

    @QueryMapping
    public User getUserById(@Argument UUID id) {
        return userRepository.findById(id)
                .orElse(null);
    }

    @QueryMapping
    public User getUserByEmail(@Argument String email) {
        return userRepository.findByEmail(email)
                .orElse(null);
    }

    @QueryMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @MutationMapping
    public User updateUserRoles(@Argument UUID userId, @Argument List<UUID> roleIds) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        List<Role> rolesList = roleRepository.findAllById(roleIds);
        user.setRoles(new HashSet<>(rolesList));

        return userRepository.save(user);
    }

    @MutationMapping
    public User updateUserStatus(@Argument UUID userId, @Argument Boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setActive(isActive);
        return userRepository.save(user);
    }
}
