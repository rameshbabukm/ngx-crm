package com.ngxcrm.identity_service.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleFieldPermission {
    private UUID id;
    private UUID roleId;
    private String module;
    private String fieldName;
    private Boolean canRead;
    private Boolean canWrite;
}
