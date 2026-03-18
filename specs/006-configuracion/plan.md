# Plan: Configuración — Branding, Planes, Integraciones y Onboarding

> Feature: 006-configuracion
> Basado en: constitution.md + spec.md (006-configuracion)
> Stack: Spring Boot 2.1.x / Java 17 / PostgreSQL / MinIO

## 1. Tech Stack

| Componente | Tecnología | Razón |
|---|---|---|
| Framework | Spring Boot 2.1.x (MVC) | Microservicio HTTP tradicional |
| DB Access | Spring Data JPA | Configuración por tenant |
| Storage | MinIO Client | Logos de branding |
| Image | Thumbnailator | Generación de thumbnails 200x200 |
| Crypto | HMAC-SHA256 | Firma de webhooks N8N |
| Scheduling | Spring @Scheduled | Health check N8N cada 5min |

## 2. Branding Upload Flow

```java
@Service
public class BrandingService {
    public TenantBranding updateBranding(UUID tenantId, BrandingRequest request) {
        // 1. Upload logo original a MinIO
        String logoUrl = minioClient.putObject(
            "autoflow-branding/" + tenantId + "/logo.png",
            request.getLogoFile()
        );

        // 2. Generar thumbnail 200x200
        byte[] thumb = Thumbnails.of(request.getLogoFile().getInputStream())
            .size(200, 200).outputFormat("png").asByteArray();
        String thumbUrl = minioClient.putObject(
            "autoflow-branding/" + tenantId + "/logo_thumb.png",
            thumb
        );

        // 3. Guardar en tenant_branding
        return brandingRepository.save(new TenantBranding(tenantId, logoUrl, thumbUrl, ...));
    }
}
```

## 3. Dependencias de Build

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.postgresql:postgresql'
    implementation 'io.minio:minio:8.5.7'
    implementation 'net.coobird:thumbnailator:0.4.20'
    implementation 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.testcontainers:postgresql'
}
```
