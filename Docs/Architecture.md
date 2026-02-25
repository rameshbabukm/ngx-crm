```mermaid
graph TD  
    subgraph "Frontend Layer (Micro-Frontends)"  
        Shell[App Shell / Container]  
        C360UI[Customer 360 MFE]  
        SalesUI[Sales & Leads MFE]  
        ServiceUI[Customer Service MFE]  
          
        Shell -.->|Vite Module Federation| C360UI  
        Shell -.->|Vite Module Federation| SalesUI  
        Shell -.->|Vite Module Federation| ServiceUI  
    end

    subgraph "API Gateway (BFF Pattern)"  
        Gateway[API Gateway / Spring Cloud Gateway]  
    end

    subgraph "Domain Services (Backend)"  
        IdentitySvc[Identity Service<br/>& AWS Cedar Engine]  
        C360Svc[Customer 360 Service]  
        SalesSvc[Sales Service]  
        ServiceSvc[Service Core Service]  
        SearchSvc[Search & Indexing Service]  
        NotifSvc[Notification Service]  
    end

    subgraph "Data Layer"  
        IdentityDB[(Identity DB)]  
        C360DB[(C360 DB)]  
        SalesDB[(Sales DB)]  
        ServiceDB[(Service DB)]  
        Elastic[(ElasticSearch)]  
        Redis[(Redis Cache)]  
    end

    subgraph "Async Communication (Event-Driven)"  
        Debezium(Debezium CDC)
        Kafka{Kafka Event Bus}  
    end

    %% Connections  
    Shell -- "GraphQL / REST" --> Gateway
    C360UI -- "GraphQL (Apollo Client)" --> Gateway
    SalesUI -- "GraphQL (Apollo Client)" --> Gateway
    ServiceUI -- "GraphQL (Apollo Client)" --> Gateway

    Gateway -- "Reverse Proxy" --> IdentitySvc  
    Gateway -- "Reverse Proxy" --> C360Svc  
    Gateway -- "Reverse Proxy" --> SalesSvc  
    Gateway -- "Reverse Proxy" --> ServiceSvc  
    Gateway -- "Reverse Proxy" --> SearchSvc

    IdentitySvc --> IdentityDB  
    C360Svc --> C360DB  
    SalesSvc --> SalesDB  
    ServiceSvc --> ServiceDB  
    SearchSvc --> Elastic
      
    %% Event Driven Data Sync  
    SalesDB -.->|Database Changes| Debezium
    ServiceDB -.->|Database Changes| Debezium
    C360DB -.->|Database Changes| Debezium
    
    Debezium -->|Publish Domain Events| Kafka
      
    Kafka -->|Consume Domain Events| SearchSvc  
    Kafka -->|Consume Domain Events| NotifSvc  
    Kafka -->|Consume Domain Events| C360Svc

```

Built with **React**, **Vite** (Module Federation), **Apollo Client** (GraphQL), **Java**, **Spring Cloud Gateway**, **Spring Boot GraphQL**, **AWS Cedar SDK**, **Kafka**, **Debezium**, **PostgreSQL**, **Elasticsearch**, and **Redis**.
