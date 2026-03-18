# Plan: Reportes — Dashboard, Exportación y Scheduling

> Feature: 005-reportes
> Basado en: constitution.md + spec.md (005-reportes)
> Stack: Spring Boot 2.1.x / Java 17 / PostgreSQL / Redis / RabbitMQ / MinIO

## 1. Tech Stack

| Componente | Tecnología | Razón |
|---|---|---|
| Framework | Spring Boot 2.1.x (MVC) | Microservicio HTTP tradicional |
| DB Access | Spring Data JPA | Agregaciones de pedidos |
| Cache | Spring Data Redis | Dashboard KPI cache (60s) |
| Excel | Apache POI | Generación de reports .xlsx |
| PDF | iText 7 | Generación de reports .pdf |
| Storage | MinIO Client | Almacenamiento de archivos generados |
| Messaging | Spring AMQP | Jobs asíncronos de generación |

## 2. Job Asíncrono

```
POST /reportes/ventas/generar
  ──▶ Crear ReporteJob (status=PROCESANDO)
  ──▶ Publicar en RabbitMQ cola: reportes.generate
  ──▶ Retornar { reportId, status: "PROCESANDO" }

Consumer (thread pool separado):
  ──▶ Leer cola → ejecutar query PG → generar Excel/PDF → subir a MinIO
  ──▶ Actualizar job: status=LISTO, file_path

Frontend poll: GET /reportes/{id}/status cada 2s hasta LISTO
  ──▶ GET /reportes/{id}/download → stream archivo
```

## 3. Dashboard Query Optimizada

```sql
SELECT
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as pedidos_hoy,
  SUM(total) FILTER (WHERE created_at >= CURRENT_DATE) as ventas_hoy,
  SUM(total) FILTER (WHERE created_at >= CURRENT_DATE - 7) as ventas_semana,
  SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as ventas_mes,
  AVG(total) as ticket_promedio
FROM pedidos
WHERE tenant_id = ? AND estado != 'CANCELADO';
```

## 4. Dependencias de Build

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-amqp'
    implementation 'org.postgresql:postgresql'
    implementation 'org.apache.poi:poi-ooxml:5.2.5'
    implementation 'com.itextpdf:itext7-core:7.2.5'
    implementation 'io.minio:minio:8.5.7'
    implementation 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

## 5. Limpieza Nocturna

```java
@Scheduled(cron = "0 0 3 * * *") // 3am diario
public void cleanupExpiredReports() {
    reporteJobRepository.findByExpiresAtBefore(now())
        .forEach(job -> {
            minioClient.removeObject(job.getFilePath());
            reporteJobRepository.delete(job);
        });
}
```
