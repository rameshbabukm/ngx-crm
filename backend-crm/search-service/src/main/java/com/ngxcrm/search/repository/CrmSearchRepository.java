package com.ngxcrm.search.repository;

import com.ngxcrm.search.document.CrmSearchDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface CrmSearchRepository extends ElasticsearchRepository<CrmSearchDocument, String> {
    List<CrmSearchDocument> findByNameContainingIgnoreCase(String name);
    List<CrmSearchDocument> findByEntityType(String entityType);
    List<CrmSearchDocument> findByEmailContainingIgnoreCase(String email);
}
