package com.ngxcrm.identity_service.repository;

import com.ngxcrm.identity_service.model.CedarPolicyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CedarPolicyRepository extends JpaRepository<CedarPolicyEntity, UUID> {
    List<CedarPolicyEntity> findByRoleId(UUID roleId);
    void deleteByRoleId(UUID roleId);
}
