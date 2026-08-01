# --- Stage 1: Build the Application ---
FROM eclipse-temurin:26-jdk-alpine AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

COPY src src

RUN ./mvnw package -DskipTests

# --- Stage 2: Run the Application ---
FROM eclipse-temurin:26-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar
COPY data /app/seed-data
EXPOSE 8080
ENV PORT=8080
ENV BIBLE_SQL_IMPORT_ENABLED=true
ENV BIBLE_LICENSED_RIGHTS_CONFIRMED=true
ENV BIBLE_NIV_COPYRIGHT_NOTICE="Licensed NIV text supplied for Koino."
ENV BIBLE_NVI_COPYRIGHT_NOTICE="Licensed NVI text supplied for Koino."

ENTRYPOINT ["java", "-jar", "app.jar"]
