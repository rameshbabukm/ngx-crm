package com.ngxcrm.notification.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ngxcrm.notification.service.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationConsumerService {

    private final ObjectMapper objectMapper;
    private final EmailNotificationService emailNotificationService;

    @KafkaListener(topics = "sales_server.public.outbox_events", groupId = "notification-service-group")
    public void handleOutboxEvent(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            JsonNode after = root.path("payload").path("after");

            if (after.isMissingNode() || after.isNull()) {
                return;
            }

            String aggregateType = after.path("aggregate_type").asText();
            String aggregateId   = after.path("aggregate_id").asText();
            String eventType     = after.path("type").asText();

            log.info("[NOTIFICATION] Event received: {} for {} (id: {})", eventType, aggregateType, aggregateId);

            switch (eventType) {
                case "LeadCreated"        -> handleLeadCreated(aggregateId, after);
                case "OpportunityCreated" -> handleOpportunityCreated(aggregateId, after);
                default                   -> log.debug("No notification handler for event type: {}", eventType);
            }

        } catch (Exception e) {
            log.error("Failed to process notification event", e);
        }
    }

    private void handleLeadCreated(String leadId, JsonNode after) {
        String payload = after.path("payload").asText();
        try {
            JsonNode leadData = objectMapper.readTree(payload);
            String name  = leadData.path("name").asText("Unknown");
            String email = leadData.path("email").asText();
            log.info("[NOTIFICATION] New Lead created: {} ({})", name, email);
            emailNotificationService.sendEmail(
                "sales-team@ngxcrm.com",
                "New Lead: " + name,
                "A new lead has been created:\nName: " + name + "\nEmail: " + email + "\nLead ID: " + leadId
            );
        } catch (Exception e) {
            log.error("Failed to parse LeadCreated payload", e);
        }
    }

    private void handleOpportunityCreated(String oppId, JsonNode after) {
        String payload = after.path("payload").asText();
        try {
            JsonNode oppData = objectMapper.readTree(payload);
            String name  = oppData.path("name").asText("Unknown");
            String stage = oppData.path("stage").asText();
            log.info("[NOTIFICATION] New Opportunity created: {} — Stage: {}", name, stage);
            emailNotificationService.sendEmail(
                "sales-team@ngxcrm.com",
                "New Opportunity: " + name,
                "A new opportunity has been created:\nName: " + name + "\nStage: " + stage + "\nOpp ID: " + oppId
            );
        } catch (Exception e) {
            log.error("Failed to parse OpportunityCreated payload", e);
        }
    }
}
