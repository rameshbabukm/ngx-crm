package com.ngxcrm.service.controller;

import com.ngxcrm.service.entity.Case;
import com.ngxcrm.service.repository.CaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Controller
public class CaseController {

    @Autowired
    private CaseRepository caseRepository;

    private static final AtomicInteger caseCounter = new AtomicInteger(1000);

    @QueryMapping
    public List<Case> getCases() {
        return caseRepository.findAll();
    }

    @QueryMapping
    public Case getCase(@Argument UUID id) {
        return caseRepository.findById(id).orElse(null);
    }

    @MutationMapping
    public Case createCase(@Argument String subject, @Argument String description, @Argument String priority, @Argument String contactId) {
        Case c = new Case();
        c.setCaseNumber("CAS-" + caseCounter.incrementAndGet());
        c.setSubject(subject);
        c.setDescription(description);
        
        if (priority != null) c.setPriority(priority);
        if (contactId != null) c.setContactId(UUID.fromString(contactId));
        
        return caseRepository.save(c);
    }

    @MutationMapping
    public Case updateCaseStatus(@Argument UUID id, @Argument String status) {
        Case c = caseRepository.findById(id).orElseThrow(() -> new RuntimeException("Case not found"));
        c.setStatus(status);
        return caseRepository.save(c);
    }

    @MutationMapping
    public Case updateCase(@Argument UUID id, @Argument String subject, @Argument String description, @Argument String priority) {
        Case c = caseRepository.findById(id).orElseThrow(() -> new RuntimeException("Case not found"));
        if (subject != null) c.setSubject(subject);
        if (description != null) c.setDescription(description);
        if (priority != null) c.setPriority(priority);
        return caseRepository.save(c);
    }
}
