package com.ngxcrm.sales.controller;

import com.ngxcrm.sales.entity.Lead;
import com.ngxcrm.sales.repository.LeadRepository;
import com.ngxcrm.sales.outbox.OutboxEvent;
import com.ngxcrm.sales.outbox.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

@Controller
@Transactional
public class LeadController {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @QueryMapping
    public List<Lead> getLeads() {
        return leadRepository.findAll();
    }

    @QueryMapping
    public Lead getLead(@Argument UUID id) {
        return leadRepository.findById(id).orElse(null);
    }

    @MutationMapping
    public Lead createLead(@Argument String name, @Argument String email, @Argument String company) {
        Lead lead = new Lead();
        lead.setName(name);
        lead.setEmail(email);
        lead.setCompany(company);
        lead = leadRepository.save(lead);

        try {
            OutboxEvent event = OutboxEvent.builder()
                    .aggregateType("Lead")
                    .aggregateId(lead.getId().toString())
                    .type("LeadCreated")
                    .payload(objectMapper.writeValueAsString(lead))
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create outbox event", e);
        }

        return lead;
    }

    @MutationMapping
    public Lead updateLeadStatus(@Argument UUID id, @Argument String status) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setStatus(status);
        lead = leadRepository.save(lead);

        try {
            OutboxEvent event = OutboxEvent.builder()
                    .aggregateType("Lead")
                    .aggregateId(lead.getId().toString())
                    .type("LeadStatusUpdated")
                    .payload(objectMapper.writeValueAsString(lead))
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create outbox event", e);
        }

        return lead;
    }

    @MutationMapping
    public Lead updateLead(@Argument UUID id, @Argument String name, @Argument String email, @Argument String company) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        if (name != null) lead.setName(name);
        if (email != null) lead.setEmail(email);
        if (company != null) lead.setCompany(company);
        lead = leadRepository.save(lead);

        try {
            OutboxEvent event = OutboxEvent.builder()
                    .aggregateType("Lead")
                    .aggregateId(lead.getId().toString())
                    .type("LeadUpdated")
                    .payload(objectMapper.writeValueAsString(lead))
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create outbox event", e);
        }

        return lead;
    }
}
