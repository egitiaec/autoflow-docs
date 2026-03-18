# Plan: CRM — Gestión de Clientes, Etiquetas e Historial

> Feature: 003-crm
> Basado en: constitution.md + spec.md
> Stack: Spring Boot 2.1.x / Java 17 / PostgreSQL / MongoDB / RabbitMQ / Redis

## 1. Tech Stack

| Componente | Tecnología | Razón |
|---|---|---|
| Framework | Spring Boot 2.1.x (MVC) | Microservicio HTTP tradicional |
| RDBMS | Spring Data JPA + PostgreSQL | Datos estructurados clientes, etiquetas |
| Document DB | Spring Data MongoDB | Búsqueda texto libre, notas flexibles |
| Messaging | Spring AMQP | Sincronización PG→MongoDB |
| Cache | Spring Data Redis | Cache búsqueda (60s) |

## 2. Arquitectura de Datos Dual (PG + MongoDB)

```
ClienteService.crearCliente()
    │
    ├──▶ PostgreSQL: INSERT INTO clientes
    │        └──▶ RabbitMQ: publish(cliente.created)
    │                    └──▶ ClienteSyncListener → MongoDB: INSERT cliente_search
    └──▶ Return ClienteDTO

ClienteSearchService.buscarClientes("juan")
    │
    ├──▶ MongoDB: {$text: {$search: "juan"}} top 10
    │        ├── Found? → Return
    │        └── Empty? → Fallback: PG WHERE nombre ILIKE '%juan%'
    └──▶ Cache Redis: crm:search:{tenant}:{hash}

HistorialService.obtenerHistorial(clienteId)
    │
    ├──▶ PG: SELECT pedidos WHERE cliente_id = ?
    ├──▶ MongoDB: SELECT messages WHERE cliente_id = ?
    ├──▶ PG: SELECT cliente_notas WHERE cliente_id = ?
    └──▶ Merge + Sort DESC + Paginate
```

## 3. Validación Cédula Ecuatoriana

```java
public boolean validarCedula(String cedula) {
    if (cedula.length() != 10) return false;
    int[] mult = {2,1,2,1,2,1,2,1,2};
    int suma = 0;
    for (int i = 0; i < 9; i++) {
        int d = Character.getNumericValue(cedula.charAt(i));
        int prod = d * mult[i];
        suma += prod > 9 ? prod - 9 : prod;
    }
    int verificador = ((suma + 9) / 10) * 10 - suma;
    return verificador == Character.getNumericValue(cedula.charAt(9));
}
```

## 4. MongoDB Text Index

```javascript
db.cliente_search.createIndex(
  { nombre_completo: "text", cedula: "text", telefono: "text", email: "text" },
  { weights: { nombre_completo: 10, cedula: 5, telefono: 3, email: 1 } }
)
```

## 5. Eventos RabbitMQ

Exchange `crm.exchange`: eventos `cliente.created`, `cliente.updated`. Consumidores: WhatsApp Service, Pedidos Service.

## 6. Dependencias

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-data-mongodb'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-amqp'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.postgresql:postgresql'
    testImplementation 'org.testcontainers:postgresql'
    testImplementation 'org.testcontainers:mongodb'
}
```
