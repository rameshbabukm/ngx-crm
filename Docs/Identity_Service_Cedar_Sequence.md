# Identity Service - Cedar Policy Sequence Diagrams

This document outlines the interaction flows between the Frontend, GraphQL Controllers, and the embedded AWS Cedar Engine within the `identity-service`.

## 1. Evaluating Access (Reading Permissions)
When a user accesses the Access Management UI or when the system needs to determine field-level permissions, the frontend requests the current state. The `identity-service` dynamically evaluates Cedar statements to generate this state.

```mermaid
sequenceDiagram
    participant UI as Frontend (AccessMgmt.jsx)
    participant API as RoleController (GraphQL)
    participant Engine as CedarEngineService
    participant DB as CedarPolicyRepository
    participant Cedar as AWS Cedar AuthorizationEngine

    UI->>API: query getPermissionsByRole(roleId)
    API->>Engine: getPermissionsByRole(roleId)
    
    Engine->>DB: findByRoleId(roleId)
    DB-->>Engine: List<CedarPolicyEntity> (Raw "permit(...)" strings)
    
    Engine->>Engine: Compile PolicySet from Strings
    
    loop For Every Module & Field
        loop For Action in [Read, Write]
            Engine->>Engine: Build AuthorizationRequest(Principal, Action, Resource)
            Engine->>Cedar: isAuthorized(request, policySet)
            Cedar-->>Engine: AuthorizationResponse (ALLOW/DENY)
        end
        Engine->>Engine: Construct RoleFieldPermission DTO
    end
    
    Engine-->>API: List<RoleFieldPermission>
    API-->>UI: JSON Array [{canRead: true, canWrite: false}, ...]
```

## 2. Modifying Access (Writing Permissions)
When an administrator modifies a user's permissions via the UI, the system translates this interaction into an updated AWS Cedar policy string and stores it in the database.

```mermaid
sequenceDiagram
    participant UI as Frontend (AccessMgmt.jsx)
    participant API as RoleController (GraphQL)
    participant Engine as CedarEngineService
    participant DB as CedarPolicyRepository

    UI->>API: mutation setFieldPermission(roleId, module, field, canRead, canWrite)
    API->>Engine: setFieldPermission(roleId, module, field, canRead, canWrite)
    
    Engine->>DB: findByRoleId(roleId)
    DB-->>Engine: List<CedarPolicyEntity>
    
    Engine->>Engine: Identify existing policies matching Resource="Field::module:field"
    Engine->>DB: delete(existing matching policies)
    
    opt If canRead == true
        Engine->>Engine: Format string: permit(principal=..., action=Read, resource=...)
        Engine->>DB: save(new CedarPolicyEntity)
    end
    
    opt If canWrite == true
        Engine->>Engine: Format string: permit(principal=..., action=Write, resource=...)
        Engine->>DB: save(new CedarPolicyEntity)
    end
    
    Engine-->>API: Return arbitrary Success/DTO
    API-->>UI: Mutation Complete Response
```

## How Cedar is Leveraged
The system uses the embedded `cedar-java` library. Rather than storing boolean flags in rows, the database stores raw Cedar policy code (`CedarPolicyEntity.policyContent`). The Java application layer translates user concepts into Cedar `EntityUID` tokens (e.g. `Role::"ADMIN"`, `Action::"Read"`, `Field::"sales:status"`). 

Because Cedar is executed completely in-memory via the SDK instance (`authorizationEngine.isAuthorized`), evaluating hundreds of fields takes milliseconds, keeping the architecture performant while vastly improving security rule flexibility.
