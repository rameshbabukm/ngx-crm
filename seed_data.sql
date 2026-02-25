-- ngx-crm db seed script
-- This script clears existing data and seeds the databases with richer sample data.

\c identity_db;

-- 1. Identity Service Data
-- Roles
INSERT INTO roles (id, name) VALUES 
('20c6a767-2471-4dc2-8120-c540e8bf36cf', 'ADMIN'),
('49aec7c3-24f8-4832-900b-b3bca0d24d41', 'USER'),
('30c6a767-2471-4dc2-8120-c540e8bf36cf', 'SALES_AGENT'),
('40c6a767-2471-4dc2-8120-c540e8bf36cf', 'SALES_MANAGER'),
('50c6a767-2471-4dc2-8120-c540e8bf36cf', 'SERVICE_AGENT'),
('60c6a767-2471-4dc2-8120-c540e8bf36cf', 'SERVICE_MANAGER')
ON CONFLICT DO NOTHING;

-- clear users (and dependencies via cascade if necessary) to avoid unique constraint issues
DELETE FROM user_roles;
DELETE FROM users;

-- Users (All passwords are 'jana123' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, first_name, last_name, "is_active") VALUES
('5c345b5c-42b7-4d7a-8f55-163e9c12dfed', 'admin@ngxcrm.com', '$2a$10$sMDM7/WqpjqbeFgndQtEfejZ1iNK8JjOHbXHrIiZogRfwFN1lcTMi', 'Admin', 'User', true),
('bd7e84cc-2115-46b2-a4f7-dcae8ca4bd14', 'sales@ngxcrm.com', '$2a$10$sMDM7/WqpjqbeFgndQtEfejZ1iNK8JjOHbXHrIiZogRfwFN1lcTMi', 'Sales', 'Representative', true),
('d01f9ce0-dfab-4fc3-a725-aa8e9185a6a6', 'support@ngxcrm.com', '$2a$10$sMDM7/WqpjqbeFgndQtEfejZ1iNK8JjOHbXHrIiZogRfwFN1lcTMi', 'Support', 'Agent', true),
('33333333-3333-3333-3333-333333333333', 'sales.agent@ngxcrm.com', '$2a$10$sMDM7/WqpjqbeFgndQtEfejZ1iNK8JjOHbXHrIiZogRfwFN1lcTMi', 'Sales', 'Agent', true),
('44444444-4444-4444-4444-444444444444', 'sales.manager@ngxcrm.com', '$2a$10$sMDM7/WqpjqbeFgndQtEfejZ1iNK8JjOHbXHrIiZogRfwFN1lcTMi', 'Sales', 'Manager', true),
('55555555-5555-5555-5555-555555555555', 'service.agent@ngxcrm.com', '$2a$10$sMDM7/WqpjqbeFgndQtEfejZ1iNK8JjOHbXHrIiZogRfwFN1lcTMi', 'Service', 'Agent', true),
('66666666-6666-6666-6666-666666666666', 'service.manager@ngxcrm.com', '$2a$10$sMDM7/WqpjqbeFgndQtEfejZ1iNK8JjOHbXHrIiZogRfwFN1lcTMi', 'Service', 'Manager', true),
('11111111-1111-1111-1111-111111111111', 'jane.doe@ngxcrm.com', '$2a$10$sMDM7/WqpjqbeFgndQtEfejZ1iNK8JjOHbXHrIiZogRfwFN1lcTMi', 'Jane', 'Doe', true),
('22222222-2222-2222-2222-222222222222', 'john.smith@ngxcrm.com', '$2a$10$sMDM7/WqpjqbeFgndQtEfejZ1iNK8JjOHbXHrIiZogRfwFN1lcTMi', 'John', 'Smith', true);

-- User Roles Mapping
INSERT INTO user_roles (user_id, role_id) VALUES
('5c345b5c-42b7-4d7a-8f55-163e9c12dfed', '20c6a767-2471-4dc2-8120-c540e8bf36cf'), -- Admin -> ADMIN
('bd7e84cc-2115-46b2-a4f7-dcae8ca4bd14', '49aec7c3-24f8-4832-900b-b3bca0d24d41'), -- Sales -> USER
('d01f9ce0-dfab-4fc3-a725-aa8e9185a6a6', '49aec7c3-24f8-4832-900b-b3bca0d24d41'), -- Support -> USER
('33333333-3333-3333-3333-333333333333', '30c6a767-2471-4dc2-8120-c540e8bf36cf'), -- Sales Ag -> SALES_AGENT
('44444444-4444-4444-4444-444444444444', '40c6a767-2471-4dc2-8120-c540e8bf36cf'), -- Sales Mgr -> SALES_MANAGER
('55555555-5555-5555-5555-555555555555', '50c6a767-2471-4dc2-8120-c540e8bf36cf'), -- Service Ag -> SERVICE_AGENT
('66666666-6666-6666-6666-666666666666', '60c6a767-2471-4dc2-8120-c540e8bf36cf'), -- Service Mgr -> SERVICE_MANAGER
('11111111-1111-1111-1111-111111111111', '49aec7c3-24f8-4832-900b-b3bca0d24d41'), -- Jane -> USER
('22222222-2222-2222-2222-222222222222', '49aec7c3-24f8-4832-900b-b3bca0d24d41'); -- John -> ADMIN

-- Seed default Cedar Policies for all roles
DELETE FROM cedar_policies;
DO $$ 
DECLARE
    r RECORD;
    m TEXT;
    f TEXT;
    a TEXT;
    policy TEXT;
    modules_fields JSON;
BEGIN
    modules_fields := '{
        "c360": ["industry", "tier", "website", "name"],
        "sales": ["status", "name", "email", "company"],
        "service": ["subject", "description", "priority", "status"]
    }'::json;

    FOR r IN SELECT id, name FROM roles LOOP
        FOR m, f IN SELECT key, json_array_elements_text(value) FROM json_each(modules_fields) LOOP
            FOR a IN SELECT unnest(ARRAY['Read', 'Write']) LOOP
                policy := format('permit(
  principal == Role::"%s",
  action == Action::"%s",
  resource == Field::"%s:%s"
);', r.name, a, m, f);
                INSERT INTO cedar_policies (id, role_id, policy_content) 
                VALUES (gen_random_uuid(), r.id, policy);
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

\c c360_db;

-- 2. C360 Service Data
DELETE FROM contacts;
DELETE FROM accounts;

-- Accounts
INSERT INTO accounts (id, name, industry, website, tier, created_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'Stark Industries', 'Defense', 'stark.com', 'Enterprise', NOW()),
('a2222222-2222-2222-2222-222222222222', 'Wayne Enterprises', 'Conglomerate', 'wayne.com', 'Enterprise', NOW()),
('a3333333-3333-3333-3333-333333333333', 'Acme Corp', 'Manufacturing', 'acme.com', 'SMB', NOW()),
('a4444444-4444-4444-4444-444444444444', 'Globex Corporation', 'Technology', 'globex.com', 'Startup', NOW()),
('a5555555-5555-5555-5555-555555555555', 'Massive Dynamic', 'Research', 'massivedynamic.com', 'Enterprise', NOW()),
('a6666666-6666-6666-6666-666666666666', 'Cyberdyne Systems', 'AI & Robotics', 'cyberdyne.com', 'Enterprise', NOW());

-- Contacts
INSERT INTO contacts (id, account_id, first_name, last_name, email, phone, job_title) VALUES
('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Tony', 'Stark', 'tony@stark.com', '555-0199', 'CEO'),
('c1111112-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Pepper', 'Potts', 'pepper@stark.com', '555-0198', 'COO'),
('c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Bruce', 'Wayne', 'bruce@wayne.com', '555-0188', 'CEO'),
('c2222223-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Lucius', 'Fox', 'lucius@wayne.com', '555-0187', 'CTO'),
('c3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Wile E.', 'Coyote', 'wile@acme.com', '555-0177', 'Genius'),
('c4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'Hank', 'Scorpio', 'hank@globex.com', '555-0166', 'Founder'),
('c5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'William', 'Bell', 'w.bell@massivedynamic.com', '555-0155', 'Founder'),
('c6666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'Miles', 'Dyson', 'm.dyson@cyberdyne.com', '555-0144', 'Director of Special Projects');


\c sales_db;

-- 3. Sales Service Data
DELETE FROM leads;

-- Leads
INSERT INTO leads (id, name, email, company, status, score, owner_id, created_at) VALUES
('b1111111-1111-1111-1111-111111111111', 'Peter Parker', 'peter@dailybugle.com', 'Daily Bugle', 'NEW', 10, 'bd7e84cc-2115-46b2-a4f7-dcae8ca4bd14', NOW()),
('b2222222-2222-2222-2222-222222222222', 'Clark Kent', 'clark@dailyplanet.com', 'Daily Planet', 'CONTACTED', 50, 'bd7e84cc-2115-46b2-a4f7-dcae8ca4bd14', NOW()),
('b3333333-3333-3333-3333-333333333333', 'Lois Lane', 'lois@dailyplanet.com', 'Daily Planet', 'QUALIFIED', 85, '11111111-1111-1111-1111-111111111111', NOW()),
('b4444444-4444-4444-4444-444444444444', 'Eddie Brock', 'eddie@dailybugle.com', 'Daily Bugle', 'LOST', 5, 'bd7e84cc-2115-46b2-a4f7-dcae8ca4bd14', NOW()),
('b5555555-5555-5555-5555-555555555555', 'Diana Prince', 'diana@themyscira.gov', 'Themyscira Embassy', 'NEW', 75, '22222222-2222-2222-2222-222222222222', NOW()),
('b6666666-6666-6666-6666-666666666666', 'Barry Allen', 'barry@ccpd.gov', 'Central City PD', 'CONTACTED', 30, 'bd7e84cc-2115-46b2-a4f7-dcae8ca4bd14', NOW());


\c service_db;

-- 4. Service Core Data
DELETE FROM cases;

-- Cases
INSERT INTO cases (id, case_number, subject, description, priority, status, contact_id, owner_id, created_at) VALUES
('d1111111-1111-1111-1111-111111111111', 'CAS-1001', 'Arc Reactor Maintenance', 'Routine service required for main arc reactor.', 'HIGH', 'NEW', 'c1111111-1111-1111-1111-111111111111', 'd01f9ce0-dfab-4fc3-a725-aa8e9185a6a6', NOW()),
('d2222222-2222-2222-2222-222222222222', 'CAS-1002', 'Batmobile Systems Check', 'Diagnostics needed for navigation cluster.', 'MEDIUM', 'OPEN', 'c2222222-2222-2222-2222-222222222222', 'd01f9ce0-dfab-4fc3-a725-aa8e9185a6a6', NOW()),
('d3333333-3333-3333-3333-333333333333', 'CAS-1003', 'Anvil Delivery Delay', 'Expected delivery of 100 anvils is late.', 'HIGH', 'PENDING', 'c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NOW()),
('d4444444-4444-4444-4444-444444444444', 'CAS-1004', 'Volcano Lair Heating Issue', 'Geothermal vents are blocked.', 'HIGH', 'RESOLVED', 'c4444444-4444-4444-4444-444444444444', 'd01f9ce0-dfab-4fc3-a725-aa8e9185a6a6', NOW()),
('d5555555-5555-5555-5555-555555555555', 'CAS-1005', 'Cortexiphan Trial Records', 'Missing records from 1981 trials.', 'HIGH', 'NEW', 'c5555555-5555-5555-5555-555555555555', 'd01f9ce0-dfab-4fc3-a725-aa8e9185a6a6', NOW()),
('d6666666-6666-6666-6666-666666666666', 'CAS-1006', 'Neural Net Processor Glitch', 'T-800 unit #101 experiencing learning anomalies.', 'HIGH', 'OPEN', 'c6666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', NOW());

