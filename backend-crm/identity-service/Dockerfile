# Stage 1: Build
FROM maven:3.9.12-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/identity-service-*.jar app.jar
EXPOSE 8085
ENV SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/identity_db
ENV SPRING_DATASOURCE_USERNAME=crm_admin
ENV SPRING_DATASOURCE_PASSWORD=crm_password
ENTRYPOINT ["java", "-jar", "app.jar"]
