package com.ngxcrm.identity_service.config;

import com.ngxcrm.identity_service.model.Role;
import com.ngxcrm.identity_service.model.User;
import com.ngxcrm.identity_service.repository.RoleRepository;
import com.ngxcrm.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (roleRepository.count() == 0) {
            Role adminRole = new Role(null, "ADMIN", "{}");
            Role userRole = new Role(null, "USER", "{}");
            Role salesAgentRole = new Role(null, "SALES_AGENT", "{}");
            Role salesManagerRole = new Role(null, "SALES_MANAGER", "{}");
            Role serviceAgentRole = new Role(null, "SERVICE_AGENT", "{}");
            Role serviceManagerRole = new Role(null, "SERVICE_MANAGER", "{}");

            adminRole = roleRepository.save(adminRole);
            userRole = roleRepository.save(userRole);
            salesAgentRole = roleRepository.save(salesAgentRole);
            salesManagerRole = roleRepository.save(salesManagerRole);
            serviceAgentRole = roleRepository.save(serviceAgentRole);
            serviceManagerRole = roleRepository.save(serviceManagerRole);

            if (userRepository.count() == 0) {
                User admin = new User(null, "admin@ngxcrm.com", passwordEncoder.encode("admin"), "System", "Admin", true, Set.of(adminRole));
                userRepository.save(admin);

                User salesAgent = new User(null, "sales.agent@ngxcrm.com", passwordEncoder.encode("jana123"), "Sales", "Agent", true, Set.of(salesAgentRole));
                userRepository.save(salesAgent);

                User salesManager = new User(null, "sales.manager@ngxcrm.com", passwordEncoder.encode("jana123"), "Sales", "Manager", true, Set.of(salesManagerRole));
                userRepository.save(salesManager);

                User serviceAgent = new User(null, "service.agent@ngxcrm.com", passwordEncoder.encode("jana123"), "Service", "Agent", true, Set.of(serviceAgentRole));
                userRepository.save(serviceAgent);

                User serviceManager = new User(null, "service.manager@ngxcrm.com", passwordEncoder.encode("jana123"), "Service", "Manager", true, Set.of(serviceManagerRole));
                userRepository.save(serviceManager);
            }
        }
    }
}
