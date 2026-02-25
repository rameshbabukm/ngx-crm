package com.ngxcrm.identity_service.service;

import com.cedarpolicy.AuthorizationEngine;
import com.cedarpolicy.BasicAuthorizationEngine;
import com.cedarpolicy.model.AuthorizationRequest;
import com.cedarpolicy.model.AuthorizationResponse;
import com.cedarpolicy.model.policy.Policy;
import com.cedarpolicy.model.policy.PolicySet;
import com.cedarpolicy.model.AuthorizationSuccessResponse;
import com.cedarpolicy.model.AuthorizationSuccessResponse;
import com.cedarpolicy.value.EntityUID;
import com.cedarpolicy.value.EntityTypeName;
import com.ngxcrm.identity_service.model.CedarPolicyEntity;
import com.ngxcrm.identity_service.model.Role;
import com.ngxcrm.identity_service.model.RoleFieldPermission;
import com.ngxcrm.identity_service.repository.CedarPolicyRepository;
import com.ngxcrm.identity_service.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CedarEngineService {

    private final CedarPolicyRepository cedarPolicyRepository;
    private final RoleRepository roleRepository;
    private final AuthorizationEngine authorizationEngine = new BasicAuthorizationEngine();

    // The fields supported by the frontend
    private static final Map<String, List<String>> MODULES = Map.of(
            "c360", List.of("industry", "tier", "website", "name"),
            "sales", List.of("status", "name", "email", "company"),
            "service", List.of("subject", "description", "priority", "status")
    );

    public List<RoleFieldPermission> getPermissionsByRole(UUID roleId) {
        Role role = roleRepository.findById(roleId).orElseThrow(() -> new RuntimeException("Role not found"));
        
        // Fetch all policies for this role
        List<CedarPolicyEntity> policyEntities = cedarPolicyRepository.findByRoleId(roleId);
        
        // Build the Cedar PolicySet
        Set<Policy> policies = new HashSet<>();
        for (CedarPolicyEntity entity : policyEntities) {
            policies.add(new Policy(entity.getPolicyContent(), policyEntities.indexOf(entity) + ""));
        }
        
        PolicySet policySet = new PolicySet(policies);

        List<RoleFieldPermission> permissions = new ArrayList<>();

        for (Map.Entry<String, List<String>> entry : MODULES.entrySet()) {
            String module = entry.getKey();
            for (String field : entry.getValue()) {
                boolean canRead = evaluate(role.getName(), "Read", module, field, policySet);
                boolean canWrite = evaluate(role.getName(), "Write", module, field, policySet);

                RoleFieldPermission perm = new RoleFieldPermission(
                        UUID.randomUUID(), roleId, module, field, canRead, canWrite
                );
                permissions.add(perm);
            }
        }

        return permissions;
    }

    private boolean evaluate(String roleName, String action, String module, String field, PolicySet policySet) {
        try {
            EntityTypeName roleType = EntityTypeName.parse("Role").orElseThrow();
            EntityTypeName actionType = EntityTypeName.parse("Action").orElseThrow();
            EntityTypeName fieldType = EntityTypeName.parse("Field").orElseThrow();

            AuthorizationRequest request = new AuthorizationRequest(
                    new EntityUID(roleType, roleName),
                    new EntityUID(actionType, action),
                    new EntityUID(fieldType, module + ":" + field),
                    Optional.of(new java.util.HashMap<>()), /* context */
                    Optional.empty(), /* schema */
                    false             /* validate */
            );

            AuthorizationResponse response = authorizationEngine.isAuthorized(request, policySet, Collections.emptySet());
            
            if (response.type == AuthorizationResponse.SuccessOrFailure.Success && response.success.isPresent()) {
                AuthorizationSuccessResponse success = response.success.get();
                if (!success.isAllowed()) {
                    log.warn("Cedar evaluation DENIED: Principal={}, Action={}, Resource={}. Diagnostics: {}", 
                            roleName, action, module + ":" + field, success.toString());
                }
                return success.isAllowed();
            } else {
                log.error("Cedar evaluation FAILED entirely for Principal={}, Action={}, Resource={}. Errors: {}", 
                        roleName, action, module + ":" + field, response.errors);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to evaluate Cedar policy", e);
            return false;
        }
    }

    public void setFieldPermission(UUID roleId, String module, String fieldName, Boolean canRead, Boolean canWrite) {
        Role role = roleRepository.findById(roleId).orElseThrow(() -> new RuntimeException("Role not found"));
        
        // Clear old policies for this specific field to avoid duplicates/conflicts
        List<CedarPolicyEntity> allPolicies = cedarPolicyRepository.findByRoleId(roleId);
        String resourceIdentifier = "Field::\"" + module + ":" + fieldName + "\"";
        
        // Find policies related to this field and delete them
        for(CedarPolicyEntity p : allPolicies) {
            if (p.getPolicyContent().contains(resourceIdentifier)) {
                cedarPolicyRepository.delete(p);
            }
        }
        
        if (canRead) {
            createAndSavePolicy(roleId, role.getName(), "Read", module, fieldName);
        }
        if (canWrite) {
            createAndSavePolicy(roleId, role.getName(), "Write", module, fieldName);
        }
    }
    
    private void createAndSavePolicy(UUID roleId, String roleName, String action, String module, String fieldName) {
        String policyContent = String.format(
            "permit(\n  principal == Role::\"%s\",\n  action == Action::\"%s\",\n  resource == Field::\"%s:%s\"\n);",
            roleName, action, module, fieldName
        );
        
        CedarPolicyEntity entity = new CedarPolicyEntity(null, roleId, policyContent);
        cedarPolicyRepository.save(entity);
    }
}
