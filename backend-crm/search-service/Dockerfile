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
COPY --from=builder /app/target/search-service-*.jar app.jar
EXPOSE 8086
ENV SPRING_ELASTICSEARCH_URIS=http://elasticsearch:9200
ENV SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
ENTRYPOINT ["java", "-jar", "app.jar"]
