package com.ngxcrm.search.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ngxcrm.search.document.CrmSearchDocument;
import com.ngxcrm.search.repository.CrmSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchIndexerConsumer {

    private final ObjectMapper objectMapper;
    private final CrmSearchRepository searchRepository;

    @KafkaListener(topics = "sales_server.public.outbox_events", groupId = "search-service-group")
    public void indexEvent(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            JsonNode after = root.path("payload").path("after");

            if (after.isMissingNode() || after.isNull()) {
                return;
            }

            String aggregateType = after.path("aggregate_type").asText();
            String aggregateId   = after.path("aggregate_id").asText();
            String eventType     = after.path("type").asText();
            String rawPayload    = after.path("payload").asText();

            log.info("[SEARCH] Indexing event: {} for {} id={}", eventType, aggregateType, aggregateId);

            JsonNode payload = objectMapper.readTree(rawPayload);
            CrmSearchDocument doc = CrmSearchDocument.builder()
                    .id(aggregateType + "_" + aggregateId)
                    .entityType(aggregateType)
                    .name(payload.path("name").asText(null))
                    .email(payload.path("email").asText(null))
                    .company(payload.path("company").asText(null))
                    .status(payload.path("status").asText(null))
                    .stage(payload.path("stage").asText(null))
                    .rawPayload(rawPayload)
                    .build();

            searchRepository.save(doc);
            log.info("[SEARCH] Indexed {} document with id={}", aggregateType, doc.getId());

        } catch (Exception e) {
            log.error("[SEARCH] Failed to index event", e);
        }
    }
}
