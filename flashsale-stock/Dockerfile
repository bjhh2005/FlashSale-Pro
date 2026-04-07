FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY . .
RUN mvn -pl flashsale-stock -am clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/flashsale-stock/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java","-jar","/app/app.jar"]

