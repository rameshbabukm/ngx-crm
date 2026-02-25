package com.ngxcrm.service.repository;

import com.ngxcrm.service.entity.CaseInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CaseInteractionRepository extends JpaRepository<CaseInteraction, UUID> {
}
