package com.ngxcrm.identity_service.controller;

import com.ngxcrm.identity_service.model.Role;
import com.ngxcrm.identity_service.model.RoleFieldPermission;
import com.ngxcrm.identity_service.repository.RoleRepository;
import com.ngxcrm.identity_service.service.CedarEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;
    private final CedarEngineService cedarEngineService;

    @QueryMapping
    public List<Role> getRoles() {
        return roleRepository.findAll();
    }

    @QueryMapping
    public List<RoleFieldPermission> getPermissionsByRole(@Argument UUID roleId) {
        return cedarEngineService.getPermissionsByRole(roleId);
    }

    @org.springframework.graphql.data.method.annotation.SchemaMapping(typeName = "Role", field = "fieldPermissions")
    public List<RoleFieldPermission> fieldPermissions(Role role) {
        return cedarEngineService.getPermissionsByRole(role.getId());
    }

    @MutationMapping
    public RoleFieldPermission setFieldPermission(
            @Argument UUID roleId,
            @Argument String module,
            @Argument String fieldName,
            @Argument Boolean canRead,
            @Argument Boolean canWrite
    ) {
        cedarEngineService.setFieldPermission(roleId, module, fieldName, canRead, canWrite);
        
        return new RoleFieldPermission(UUID.randomUUID(), roleId, module, fieldName, canRead, canWrite);
    }
}
