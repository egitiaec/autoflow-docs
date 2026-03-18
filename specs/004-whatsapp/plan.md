# Plan: WhatsApp — Conexión, Mensajería y Plantillas

> Feature: 004-whatsapp
> Basado en: constitution.md + spec.md (004-whatsapp)
> Stack: Spring Boot 2.1.x / Java 17 / PostgreSQL / MongoDB / RabbitMQ

## 1. Tech Stack

| Componente | Tecnología | Razón |
|---|---|---|
| Framework | Spring Boot 2.1.x (MVC) | Microservicio HTTP tradicional |
| RDBMS | Spring Data JPA | Conexiones, plantillas, instancias Evolution |
| Document DB | Spring Data MongoDB | Mensajes WhatsApp (alto volumen, flexible) |
| HTTP Client | RestTemplate | Llamadas a Meta Graph API y Evolution API |
| Crypto | AES-256/GCM | Encriptación de access tokens |
| Messaging | Spring AMQP | Eventos de mensajes entrantes/salientes |

## 2. Estructura de Paquetes (estimada)

```
autoflow-whatsapp/
├── src/main/java/com/autoflow/whatsapp/
│   ├── config/
│   │   ├── MetaApiConfig.java
│   │   ├── EvolutionApiConfig.java
│   │   └── EncryptionConfig.java
│   ├── connection/
│   │   ├── controller/ConnectionController.java
│   │   ├── service/ConnectionService.java
│   │   └── model/WhatsappConnection.java
│   ├── message/
│   │   ├── controller/MessageController.java
│   │   ├── service/MessageService.java
│   │   ├── service/MetaApiClient.java
│   │   └── model/WhatsappMessage.java (MongoDB)
│   ├── template/
│   │   ├── controller/TemplateController.java
│   │   ├── service/TemplateService.java
│   │   └── model/WhatsappTemplate.java
│   ├── evolution/
│   │   ├── controller/EvolutionController.java
│   │   ├── service/EvolutionService.java
│   │   └── model/EvolutionInstance.java
│   └── webhook/
│       ├── MetaWebhookController.java
│       └── EvolutionWebhookController.java
└── build.gradle
```

## 3. Meta Graph API Integration

### Enviar mensaje

```
POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "5939912345678",
  "type": "text",
  "text": { "body": "Hola! Su pedido está listo" }
}
```

### Recibir mensaje (webhook)

```
POST /api/whatsapp/webhook
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "phone_number_id": "..." },
        "messages": [{
          "from": "5939912345678",
          "type": "text",
          "text": { "body": "Hola, quiero pedir café" },
          "timestamp": "1710758400"
        }]
      }
    }]
  }]
}
```

## 4. Encriptación de Credenciales

```java
public class EncryptionService {
    private final SecretKey secretKey;

    public String encrypt(String plainText) {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        byte[] iv = cipher.getIV();
        byte[] encrypted = cipher.doFinal(plainText.getBytes(UTF_8));
        return Base64.getEncoder().encodeToString(
            ByteBuffer.allocate(iv.length + encrypted.length)
                .put(iv).put(encrypted).array()
        );
    }
}
```

## 5. Dependencias de Build

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-data-mongodb'
    implementation 'org.springframework.boot:spring-boot-starter-amqp'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.postgresql:postgresql'
    implementation 'com.fasterxml.jackson.core:jackson-databind'
    implementation 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.testcontainers:mongodb'
}
```

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| Meta rechaza cuenta business | Evolution API como fallback (HU-019) |
| Token Meta expirado | Refresh automático via Meta OAuth |
| Webhook sin HTTPS | Nginx SSL obligatorio |
