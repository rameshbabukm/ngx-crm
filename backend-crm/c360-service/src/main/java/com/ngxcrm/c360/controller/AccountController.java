package com.ngxcrm.c360.controller;

import com.ngxcrm.c360.entity.Account;
import com.ngxcrm.c360.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Transactional
public class AccountController {

    private final AccountRepository accountRepository;

    @QueryMapping
    public List<Account> accounts() {
        return accountRepository.findAll();
    }

    @QueryMapping
    public Account account(@Argument String id) {
        return accountRepository.findById(UUID.fromString(id)).orElse(null);
    }

    @MutationMapping
    public Account createAccount(@Argument String name,
            @Argument String industry,
            @Argument String website,
            @Argument String tier) {
        Account account = Account.builder()
                .name(name)
                .industry(industry)
                .website(website)
                .tier(tier)
                .build();
        return accountRepository.save(account);
    }

    @MutationMapping
    public Account updateAccount(@Argument String id,
            @Argument String name,
            @Argument String industry,
            @Argument String website,
            @Argument String tier) {
        return accountRepository.findById(UUID.fromString(id)).map(account -> {
            if (name != null)
                account.setName(name);
            if (industry != null)
                account.setIndustry(industry);
            if (website != null)
                account.setWebsite(website);
            if (tier != null)
                account.setTier(tier);
            return accountRepository.save(account);
        }).orElseThrow(() -> new RuntimeException("Account not found: " + id));
    }
}
