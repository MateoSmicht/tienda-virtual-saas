FROM eclipse-temurin:17-jre

ARG JAR_FILE=target/tiendavirtual-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app_tiendavirtual.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app_tiendavirtual.jar"]