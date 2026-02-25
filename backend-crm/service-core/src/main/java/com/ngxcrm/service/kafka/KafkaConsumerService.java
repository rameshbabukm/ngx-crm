package com.ngxcrm.service.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerService.class);

    @Autowired
    private ObjectMapper objectMapper;

    @KafkaListener(topics = "sales_server.public.outbox_events", groupId = "service-core-group")
    public void consumeOutboxEvent(String message) {
        try {
            log.info("Received Kafka message: {}", message);

            JsonNode rootNode = objectMapper.readTree(message);
            JsonNode payloadNode = rootNode.path("payload");

            if (payloadNode.isMissingNode()) {
                log.warn("Payload node is missing from message");
                return;
            }

            JsonNode afterNode = payloadNode.path("after");
            if (afterNode.isMissingNode() || afterNode.isNull()) {
                log.warn("After node is missing, possibly a deleted record");
                return;
            }

            String aggregateType = afterNode.path("aggregateType").asText();
            String aggregateId = afterNode.path("aggregateId").asText();
            String eventType = afterNode.path("type").asText();
            String rawPayload = afterNode.path("payload").asText();

            log.info("Processed Outbox Event — Type: {}, AggregateId: {}, Event: {}",
                    aggregateType, aggregateId, eventType);
            log.debug("Event Payload: {}", rawPayload);

        } catch (Exception e) {
            log.error("Failed to parse or process Kafka message", e);
        }
    }
}
