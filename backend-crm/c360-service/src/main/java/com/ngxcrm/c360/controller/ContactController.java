package com.ngxcrm.c360.controller;

import com.ngxcrm.c360.entity.Account;
import com.ngxcrm.c360.entity.Contact;
import com.ngxcrm.c360.repository.AccountRepository;
import com.ngxcrm.c360.repository.ContactRepository;
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
public class ContactController {

    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;

    @QueryMapping
    public List<Contact> contacts() {
        return contactRepository.findAll();
    }

    @QueryMapping
    public Contact contact(@Argument String id) {
        return contactRepository.findById(UUID.fromString(id)).orElse(null);
    }

    @QueryMapping
    public List<Contact> contactsByAccount(@Argument String accountId) {
        return contactRepository.findByAccountId(UUID.fromString(accountId));
    }

    @MutationMapping
    public Contact createContact(@Argument String accountId,
            @Argument String firstName,
            @Argument String lastName,
            @Argument String email,
            @Argument String phone,
            @Argument String jobTitle) {
        Account account = null;
        if (accountId != null) {
            account = accountRepository.findById(UUID.fromString(accountId))
                    .orElseThrow(() -> new RuntimeException("Account not found: " + accountId));
        }
        Contact contact = Contact.builder()
                .account(account)
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .phone(phone)
                .jobTitle(jobTitle)
                .build();
        return contactRepository.save(contact);
    }

    @MutationMapping
    public Contact updateContact(@Argument String id,
            @Argument String firstName,
            @Argument String lastName,
            @Argument String phone,
            @Argument String jobTitle) {
        return contactRepository.findById(UUID.fromString(id)).map(contact -> {
            if (firstName != null)
                contact.setFirstName(firstName);
            if (lastName != null)
                contact.setLastName(lastName);
            if (phone != null)
                contact.setPhone(phone);
            if (jobTitle != null)
                contact.setJobTitle(jobTitle);
            return contactRepository.save(contact);
        }).orElseThrow(() -> new RuntimeException("Contact not found: " + id));
    }
}
