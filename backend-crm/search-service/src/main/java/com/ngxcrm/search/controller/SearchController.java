package com.ngxcrm.search.controller;

import com.ngxcrm.search.document.CrmSearchDocument;
import com.ngxcrm.search.repository.CrmSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final CrmSearchRepository searchRepository;

    /** Search globally by name across all entity types */
    @GetMapping
    public List<CrmSearchDocument> search(@RequestParam String q) {
        return searchRepository.findByNameContainingIgnoreCase(q);
    }

    /** Filter by entity type: Lead, Opportunity, Account, Contact */
    @GetMapping("/type")
    public List<CrmSearchDocument> searchByType(@RequestParam String type) {
        return searchRepository.findByEntityType(type);
    }

    /** Search by email */
    @GetMapping("/email")
    public List<CrmSearchDocument> searchByEmail(@RequestParam String email) {
        return searchRepository.findByEmailContainingIgnoreCase(email);
    }
}
