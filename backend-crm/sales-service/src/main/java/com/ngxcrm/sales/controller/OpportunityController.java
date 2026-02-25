package com.ngxcrm.sales.controller;

import com.ngxcrm.sales.entity.Opportunity;
import com.ngxcrm.sales.repository.OpportunityRepository;
import com.ngxcrm.sales.outbox.OutboxEvent;
import com.ngxcrm.sales.outbox.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Controller
@Transactional
public class OpportunityController {

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @QueryMapping
    public List<Opportunity> getOpportunities() {
        return opportunityRepository.findAll();
    }

    @QueryMapping
    public Opportunity getOpportunity(@Argument UUID id) {
        return opportunityRepository.findById(id).orElse(null);
    }

    @MutationMapping
    public Opportunity createOpportunity(@Argument String accountId, @Argument String name, @Argument Double amount, @Argument String stage, @Argument Double probability) {
        Opportunity opp = new Opportunity();
        if(accountId != null) {
             opp.setAccountId(UUID.fromString(accountId));
        }
        opp.setName(name);
        opp.setAmount(BigDecimal.valueOf(amount));
        opp.setStage(stage);
        opp.setProbability(BigDecimal.valueOf(probability));
        opp = opportunityRepository.save(opp);

        try {
            OutboxEvent event = OutboxEvent.builder()
                    .aggregateType("Opportunity")
                    .aggregateId(opp.getId().toString())
                    .type("OpportunityCreated")
                    .payload(objectMapper.writeValueAsString(opp))
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create outbox event", e);
        }

        return opp;
    }

    @MutationMapping
    public Opportunity updateOpportunityStage(@Argument UUID id, @Argument String stage) {
        Opportunity opp = opportunityRepository.findById(id).orElseThrow(() -> new RuntimeException("Opportunity not found"));
        opp.setStage(stage);
        opp = opportunityRepository.save(opp);

        try {
            OutboxEvent event = OutboxEvent.builder()
                    .aggregateType("Opportunity")
                    .aggregateId(opp.getId().toString())
                    .type("OpportunityStageUpdated")
                    .payload(objectMapper.writeValueAsString(opp))
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create outbox event", e);
        }

        return opp;
    }
}
