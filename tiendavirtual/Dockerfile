# Etapa 1: Compilación (Maven + Java 17)
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

# Etapa 2: Ejecución (JRE liviano)
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app_tiendavirtual.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app_tiendavirtual.jar"]