FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY . .
RUN mvn -pl gateway -am clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /opt/app
COPY --from=builder /app/gateway/target/*.jar app.jar
EXPOSE 9080
ENTRYPOINT ["java", "-jar", "/opt/app/app.jar"]
