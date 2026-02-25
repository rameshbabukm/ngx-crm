package com.ngxcrm.notification.model;

import lombok.Data;

@Data
public class OutboxEventPayload {
    private String aggregateType;
    private String aggregateId;
    private String type;
    private String payload;
}
