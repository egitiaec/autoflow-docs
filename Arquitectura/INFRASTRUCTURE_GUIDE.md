# Guía de Implementación de Infraestructura para AutoFlow

Este documento detalla los pasos y las consideraciones clave para configurar la infraestructura necesaria para el proyecto AutoFlow. Se basa en el VPS actual de EGIT Consultoría y las conversaciones mantenidas.

## Resumen del Entorno Actual

*   **VPS Principal:**
    *   **Sistema Operativo:** Ubuntu (confirmado)
    *   **Recursos:** 8GB RAM, 100GB Disco, 2 CPU Cores
    *   **Servicios Pre-instalados:**
        *   PostgreSQL
        *   N8N
        *   Dokploy (Gestión de despliegues y contenedores)
*   **Recursos Futuros:**
    *   Ollama se desplegará en un servidor separado a partir de abril.

## Objetivos Generales de Infraestructura

1.  Habilitar el desarrollo local con entornos consistentes.
2.  Facilitar el despliegue de microservicios de AutoFlow al VPS a través de Dokploy.
3.  Establecer un ecosistema de datos y colas de mensajes robusto.
4.  Garantizar un CI/CD eficiente usando GitHub Actions.
5.  Asegurar el acceso a la infraestructura mediante Tailscale.

## Pasos Detallados de Implementación

### Fase 1: Preparación del VPS (Si no está ya configurado via Dokploy)

**Paso 1: Confirmar Disponibilidad de Docker y Docker Compose en Dokploy**
*   **Acción:** Dokploy maneja los contenedores, por lo que no necesitamos instalar Docker y Docker Compose directamente. Hemos de verificar cómo Dokploy gestiona esto y si ofrece la funcionalidad para desplegar los servicios que necesitamos.
*   **Verificación:** Accede al panel de control de Dokploy y familiarízate con la interfaz para el despliegue de aplicaciones y servicios.

**Paso 2: Integración del VPS con Tailscale**
*   **Acción:** Asegúrate de que tu VPS de Ubuntu esté correctamente integrado en tu red Tailscale. Esto permitirá un acceso seguro a los servicios internos sin exponerlos públicamente.
*   **Comando Sugerido (si no está hecho):**
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --authkey tskey-RUTA_DE_TU_AUTHKEY_DE_TAILSCALE
    ```
    *(Reemplaza `tskey-RUTA_DE_TU_AUTHKEY_DE_TAILSCALE` con tu clave de autenticación de Tailscale.)*
*   **Verificación:** Confirma que el VPS aparece como un nodo activo en tu panel de control de Tailscale.

### Fase 2: Configuración de Servicios Adicionales en el VPS (mediante Dokploy)

**Paso 1: Despliegue de MongoDB vía Dokploy**
*   **Acción:** Utiliza Dokploy para desplegar una instancia de MongoDB. Esto generalmente implicará crear una nueva aplicación/servicio en Dokploy, seleccionando la imagen de MongoDB oficial y configurando las variables de entorno necesarias (ej. usuario, contraseña, base de datos).
*   **Consideraciones:**
    *   Define credenciales de acceso seguras.
    *   Asegura la persistencia de datos (Dokploy debería manejar volúmenes, pero verifica).
    *   Configura el acceso para que los microservicios de AutoFlow puedan conectarse.
*   **Verificación:** Una vez desplegado, intenta conectarte a MongoDB desde un entorno de desarrollo local (vía Tailscale) o desde otro servicio en el VPS para confirmar su operatividad.

**Paso 2: Despliegue de Redis vía Dokploy**
*   **Acción:** Despliega una instancia de Redis usando Dokploy, de manera similar a MongoDB.
*   **Consideraciones:**
    *   Configura una contraseña si es necesario.
    *   Redis se usará principalmente para caching y sesiones, por lo que la persistencia es menos crítica que para MongoDB/PostgreSQL, pero puede ser configurada.
*   **Verificación:** Realiza una conexión de prueba para asegurar que Redis esté accesible y funcionando.

**Paso 3: Despliegue de RabbitMQ vía Dokploy**
*   **Acción:** Despliega RabbitMQ a través de Dokploy. RabbitMQ es crucial para la comunicación asíncrona entre los microservicios de AutoFlow.
*   **Consideraciones:**
    *   Configura credenciales de usuario y host virtuales.
    *   Activa el plugin de gestión de RabbitMQ (management plugin) si es necesario para monitoreo y administración.
*   **Verificación:** Envía un mensaje de prueba a una cola y un consumidor para confirmar que RabbitMQ funciona correctamente.

**Paso 4: Verificación de PostgreSQL Existente**
*   **Acción:** Confirma que la instancia de PostgreSQL existente en el VPS es accesible y tiene los recursos adecuados para las necesidades de AutoFlow.
*   **Consideraciones:**
    *   Documenta las credenciales y la URL de conexión.
    *   Asegúrate de que los microservicios de AutoFlow puedan conectarse.
*   **Verificación:** Conexión de prueba y, si es posible, un chequeo de rendimiento básico.

### Fase 3: Integración de Desarrollo y Despliegue

**Paso 1: Preparación del Entorno de Desarrollo Local**
*   **Acción:** Asegúrate de que los desarrolladores tengan Docker y Docker Compose instalados en sus máquinas locales.
*   **Flujo de Trabajo:** Proporciona un archivo `docker-compose.yml` local para que puedan levantar una versión ligera de la infraestructura de AutoFlow (bases de datos, quizás un simulador de RabbitMQ, etc.) sin depender del VPS para cada cambio.

**Paso 2: Configuración de GitHub Actions para CI/CD**
*   **Acción:** Configura workflows de GitHub Actions en los repositorios de los microservicios de AutoFlow.
*   **Flujo de Trabajo:**
    *   **CI (Integración Continua):** Pruebas automatizadas en cada push o pull request.
    *   **CD (Despliegue Continuo):** Despliegue automatizado a Dokploy en ramas específicas (ej. `main` o `develop`), o tras una etiqueta específica. Dokploy generalmente ofrece integración para esto (ej. webhooks o CLI).
*   **Verificación:** Asegura que los workflows se ejecuten correctamente y que los despliegues a Dokploy sean exitosos.

## Arquitectura de Referencia (Diagrama Conceptual)

```mermaid
graph TD
    subgraph Desarrolladores
        Dev1(Máquina Local Dev 1) -- docker-compose up --> LocalInfra[Infra Local Docker]
        DevN(Máquina Local Dev N) -- docker-compose up --> LocalInfra
    end

    subgraph Red Privada (Tailscale)
        LocalInfra -- Acceso Seguro --> VPS[VPS de Producción]
        VPS -- Acceso Seguro --> TailscalePanel[Panel de Control Tailscale]
    end

    subgraph VPS de Producción (Ubuntu + Dokploy)
        direction LR
        Dokploy(Dokploy) --> AutoFlowApps[Microservicios AutoFlow]
        Dokploy --> N8NInstancia(N8N Instance - Existente)
        Dokploy --> PostgresInstancia(PostgreSQL Instance - Existente)
        Dokploy --> MongoDB(MongoDB - Docker)
        Dokploy --> Redis(Redis - Docker)
        Dokploy --> RabbitMQ(RabbitMQ - Docker)
    end

    GitHub[GitHub Repositories] -- Webhooks --> GitHubActions[GitHub Actions (CI/CD)]
    GitHubActions -- Despliegue --> Dokploy
```

## Consideraciones de Recursos Futuras

*   El VPS actual (8GB RAM, 2 CPU Cores) puede ser suficiente para el inicio de AutoFlow sin Ollama. Sin embargo, monitorea de cerca el uso de recursos para identificar la necesidad de escalar a un VPS más potente conforme la aplicación crezca y gane tráfico.
*   Cuando Ollama se despliegue en su propio servidor dedicado, este requerirá recursos significativos (especialmente GPU, si se busca un buen rendimiento), lo cual es una decisión de infraestructura separada.

---

Este documento servirá como una guía viva y se actualizará conforme evolucione nuestra infraestructura y decisiones tecnológicas.
