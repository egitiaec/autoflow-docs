# Stacky Report — Revisión ADR-001: Stack Tecnológico AutoFlow

**Autor:** Stacky — Arquitecto del Stack Tecnológico, I+D EGIT  
**Fecha:** 17 Marzo 2026  
**Revisión de:** ADR-001 (`adr-001-stack.md`) + ADR-002 (`adr-002-arquitectura.md`)  
**Estado del ADR-001:** ⚠️ REQUIERE ACTUALIZACIÓN

---

## 1. Resumen Ejecutivo

La revisión del ADR-001 revela que el documento tiene **problemas estructurales importantes**: el encabezado refleja correctamente el stack aprobado por Eduardo (Spring Boot, Kotlin/Java, PostgreSQL, MongoDB, Redis, RabbitMQ, Docker), pero el cuerpo del documento contiene el **análisis original supersedido** (Node.js, Supabase, Vercel, Railway) que ya no aplica.

El ADR-002, elaborado por Archy, sí documenta correctamente la arquitectura aprobada y sirve como fuente de verdad técnica. Sin embargo, existen **discrepancias de versiones** entre ambos documentos y las tecnologías declaradas en el enunciado del proyecto.

---

## 2. Stack Aprobado por Eduardo (Fuente de Verdad)

| Componente | Tecnología | Versión Confirmada en ADR-002 |
|-----------|-----------|-------------------------------|
| **Backend Framework** | Spring Boot | 3.x (Spring Boot 3) |
| **Lenguaje** | Kotlin/Java | **⚠️ Ver nota abajo** |
| **Base de datos relacional** | PostgreSQL | 15+ (imagen Docker) |
| **Base de datos NoSQL** | MongoDB | 6+ (imagen Docker) |
| **Cache / Rate Limiting** | Redis | 7+ (imagen Docker) |
| **Message Broker** | RabbitMQ | 3.12+ con Management UI |
| **API Gateway** | Spring Cloud Gateway | WebFlux reactivo |
| **Contenedores** | Docker Compose | VPS propio |
| **Automatización** | N8N self-hosted | 1.x |

---

## 3. Discrepancias Detectadas

### 3.1 ⚠️ Versión de Java: 17 vs 21

| Documento | Versión Java |
|-----------|-------------|
| Enunciado del proyecto (tarea) | Java **17** |
| ADR-002 CI/CD (`setup-java`) | Java **21** |
| ADR-002 Dockerfile | `eclipse-temurin:21-jdk` |

**Conclusión:** ADR-002 usa Java 21. El enunciado menciona Java 17. Spring Boot 3.x soporta Java 17 como mínimo y 21 como LTS recomendado para producción.

**Recomendación:** Adoptar **Java 21 LTS** (Temurin). Es el LTS actual, tiene mejor performance con Virtual Threads (Project Loom), y ya está documentado en el ADR-002. El Java 17 queda obsoleto como objetivo.

**Acción requerida:** Actualizar ADR-001 para indicar `Java 21 LTS (Temurin)`.

---

### 3.2 ⚠️ ADR-001 contiene análisis obsoleto como cuerpo principal

El ADR-001 presenta como sección principal el análisis de tecnologías que fue **descartado** (Node.js, Supabase, Vercel, Railway). Esto es confuso y potencialmente peligroso para developers que onboarden al proyecto.

La sección "Stack Final Resumido" al final del ADR-001 aún dice:

```
Backend API: Node.js + Fastify + TypeScript
Base de Datos: PostgreSQL (Supabase)
Auth: Supabase Auth
```

Esto **contradice directamente** la decisión aprobada de Eduardo.

**Acción requerida:** Reestructurar ADR-001 para que el stack aprobado sea la sección principal y el análisis previo quede marcado como "contexto histórico" con advertencia visible.

---

### 3.3 ℹ️ Versiones específicas no documentadas en ADR-001

ADR-001 no especifica versiones puntuales para ningún componente. ADR-002 las infiere del pipeline, pero ningún ADR las declara formalmente.

---

## 4. Stack Definitivo con Versiones Oficiales

| Componente | Versión Recomendada | Justificación |
|-----------|---------------------|---------------|
| **Java** | 21 LTS (Temurin) | LTS actual, Virtual Threads, Spring Boot 3 nativo |
| **Kotlin** | 1.9.x | Compatible con JVM 21, Coroutines maduras |
| **Spring Boot** | 3.2.x | GA estable, soporte Spring 6, Jakarta EE 10 |
| **Spring Cloud Gateway** | 4.1.x | Compatible con Spring Boot 3.2 |
| **PostgreSQL** | 16.x | LTS actual, JSON mejorado, performance |
| **MongoDB** | 7.0.x | LTS actual, mejor soporte Atlas/Docker |
| **Redis** | 7.2.x | LTS actual, Redis Functions, mejor persistencia |
| **RabbitMQ** | 3.13.x | LTS actual, AMQP 0-9-1, Management UI incluida |
| **Docker Compose** | 2.x (plugin) | `docker compose` (no `docker-compose` legacy) |
| **N8N** | 1.x (latest stable) | Self-hosted, actualizar periódicamente |
| **Gradle** | 8.x | Compatible con Java 21 |

---

## 5. Justificación Técnica por Componente

### Spring Boot 3.x + Kotlin/Java 21
- **Por qué Spring Boot:** Enterprise-grade, ecosistema maduro, Spring Cloud para microservicios, excelente soporte JPA/MongoDB/Redis/RabbitMQ out-of-the-box.
- **Por qué no Node.js:** La decisión de Eduardo prioriza robustez, tipado fuerte, y el ecosistema Java para el mercado B2B. Spring Boot reduce código boilerplate con auto-configuración.
- **Por qué Java 21:** Virtual Threads (Loom) permiten alto throughput sin el modelo reactivo complejo. Mejora el rendimiento de I/O bound (DB queries, API calls) sin reescribir el código.

### PostgreSQL 16
- ACID compliance para datos transaccionales (pedidos, facturación).
- Row Level Security para multi-tenancy segura.
- JSONB para metadatos flexibles sin perder SQL.
- Costo: $0 en VPS propio vs $25+/mes en cloud managed.

### MongoDB 7.0
- Schema flexible para mensajes WhatsApp (estructura variable por tipo: texto, imagen, audio, botones, etc.).
- TTL indexes para logs y caché de reportes automáticos.
- Aggregation pipeline para métricas de WhatsApp.
- Costo: $0 en VPS propio.

### Redis 7.2
- Rate limiting en API Gateway (Token Bucket, sin código custom).
- Blocklist de refresh tokens revocados (O(1) lookup).
- Cache de JWT claims para evitar DB hit en cada request.
- Distributed locks para operaciones críticas (ej: evitar doble-envío de notificaciones).

### RabbitMQ 3.13
- Comunicación asíncrona entre microservicios (eventos de negocio).
- Topic Exchange `autoflow.events` para routing flexible.
- Dead Letter Queue para reintentos automáticos.
- Alternativa Kafka descartada: overkill para volumen MVP (<10k mensajes/día inicialmente).

### Docker Compose en VPS propio
- Costo cero adicional (VPS ya existe).
- Control total sobre configuración.
- Migración a Kubernetes preparada (mismos containers).
- Caddy como reverse proxy con SSL automático (Let's Encrypt).

---

## 6. Análisis de Costos — Stack Aprobado (VPS Self-hosted)

A diferencia del análisis original (que usaba Vercel/Railway/Supabase), el stack aprobado usa el VPS propio de EGIT. Esto cambia radicalmente el modelo de costos.

### Costos de Infraestructura por Fase

| Fase | Descripción | Costo/mes |
|------|-------------|-----------|
| **MVP (0-10 clientes)** | VPS existente + Docker Compose | ~$0 adicional |
| **Starter (10-100 clientes)** | VPS existente o VPS upgrade | $0-40 (upgrade de plan) |
| **Growth (100-500 clientes)** | VPS dedicado adicional o upgrade | $40-80 |
| **Scale (500+ clientes)** | Multi-VPS o migración a K8s en cloud | $150-400 |

### Servicios Externos Necesarios (no incluidos en VPS)

| Servicio | Plan | Costo/mes | Notas |
|----------|------|-----------|-------|
| **Dominio egit.site** | — | $2 | Ya existente |
| **WhatsApp Business API (Meta)** | Pay per conversation | Variable | ~$0.01-0.08/conv |
| **SendGrid (emails transaccionales)** | Free hasta 100/día | $0-20 | Free suficiente para MVP |
| **Firebase Cloud Messaging (push)** | Free | $0 | Free para notifications |
| **Sentry (error tracking)** | Developer Free | $0 | 5K errors/mes |
| **GitHub Actions** | Free (public) | $0 | 2000 min/mes free |

### Costo Total Estimado

| Fase | Infraestructura | Servicios Externos | Total/mes |
|------|----------------|-------------------|-----------|
| **MVP** | $0 (VPS existente) | $2-5 | **$2-5/mes** |
| **Starter** | $0-40 | $10-30 | **$10-70/mes** |
| **Growth** | $40-80 | $20-80 | **$60-160/mes** |
| **Scale** | $150-400 | $50-150 | **$200-550/mes** |

> **Ventaja clave:** El stack self-hosted en VPS es significativamente más económico que el stack cloud-managed original ($88-100/mes en Starter vs $10-70/mes aquí).

---

## 7. Riesgos del Stack Actual

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:-----------:|:-------:|------------|
| VPS single-point-of-failure | Media | Alto | Backups automatizados, upgrade a VPS con HA |
| Complejidad operativa de 7+ servicios Docker | Alta | Medio | Docker healthchecks, Makefile con comandos comunes |
| Java 17 vs 21 en equipos | Baja | Bajo | Declarar Java 21 en todos los documentos |
| ADR-001 desactualizado lleva a confusión de devs | Alta | Medio | **Actualizar ADR-001 urgente** |
| Escalabilidad de Docker Compose > 500 clientes | Media | Medio | Plan de migración a K8s documentado en ADR-002 |

---

## 8. Acciones Recomendadas

### Urgentes (antes de inicio de desarrollo)

| # | Acción | Responsable | Prioridad |
|---|--------|-------------|-----------|
| 1 | **Reestructurar ADR-001**: mover análisis obsoleto a apéndice, poner stack Spring Boot al frente | Stacky / Eduardo | 🔴 Alta |
| 2 | **Definir versión Java oficial**: Java 21 LTS (confirmado en ADR-002) | Eduardo | 🔴 Alta |
| 3 | **Actualizar tabla "Stack Final Resumido" en ADR-001** para reflejar Spring Boot, no Node.js | Stacky | 🔴 Alta |

### Importante (primera semana de desarrollo)

| # | Acción | Responsable | Prioridad |
|---|--------|-------------|-----------|
| 4 | Crear `infra/docker-compose.yml` con versiones pinned de todas las imágenes | Dev team | 🟡 Media |
| 5 | Documentar versiones en tabla consolidada en ADR-001 | Stacky | 🟡 Media |
| 6 | Crear `infra/.env.example` con todas las variables documentadas | Dev team | 🟡 Media |

### Recomendado (antes de MVP launch)

| # | Acción | Responsable | Prioridad |
|---|--------|-------------|-----------|
| 7 | Evaluar Portainer para gestión visual de containers en VPS | Ops | 🟢 Baja |
| 8 | Configurar backups automáticos: PostgreSQL dump + MongoDB mongodump a S3/Backblaze | Ops | 🟡 Media |

---

## 9. Conclusión

El **stack tecnológico de AutoFlow está bien elegido** para el contexto de PYMEs ecuatorianas y el objetivo MVP. Spring Boot 3 + microservicios + Docker en VPS propio es una decisión técnicamente sólida que:

1. ✅ Escala desde 0 hasta cientos de clientes sin cambio de stack.
2. ✅ Aprovecha el VPS existente de EGIT → costos mínimos.
3. ✅ Usa tecnologías probadas, no bleeding-edge.
4. ✅ Tiene un equipo técnico en Ecuador con experiencia Java/Spring disponible.

El **principal problema no es técnico, es documental**: ADR-001 está desactualizado y puede confundir. La corrección de ese documento es la tarea más urgente antes de onboardear al equipo de desarrollo.

---

*Stacky — Arquitecto del Stack Tecnológico, I+D EGIT Consultoría*  
*Revisión completada: 17 Marzo 2026*  
*Basado en: ADR-001 v1, ADR-002 v2.0*
