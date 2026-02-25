package com.ngxcrm.search.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(indexName = "crm_entities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrmSearchDocument {

    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String entityType; // Lead, Opportunity, Account, Contact

    @Field(type = FieldType.Text, analyzer = "standard")
    private String name;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String email;

    @Field(type = FieldType.Text)
    private String company;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Keyword)
    private String stage;

    @Field(type = FieldType.Text)
    private String rawPayload;
}
