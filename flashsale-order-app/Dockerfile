FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY . .
RUN mvn -pl flashsale-order-app -am clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/flashsale-order-app/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]

