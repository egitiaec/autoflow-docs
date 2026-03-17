# Guía de Desarrollo — AutoFlow

Guía completa para configurar el entorno de desarrollo y contribuir al proyecto.

## Requisitos Previos

| Herramienta | Versión mínima | Notas |
|-------------|---------------|-------|
| Node.js | 20 LTS | Recomendado: usar nvm |
| npm | 10+ | Viene con Node.js 20 |
| Docker | 24+ | Docker Desktop o Docker Engine |
| Docker Compose | v2+ | Incluido en Docker Desktop |
| Git | 2.40+ | Cualquier versión reciente |
| Editor | — | VS Code recomendado (con extensiones de TypeScript, ESLint, Prettier) |

### Recomendado

- **nvm** — para gestionar versiones de Node.js
- **VS Code extensions:** ESLint, Prettier, Docker, GitLens

## Setup del Entorno de Desarrollo

### 1. Clonar el repositorio

```bash
git clone https://github.com/egit-consultoria/autoflow.git
cd autoflow
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con las credenciales de desarrollo:

```env
# Database
DATABASE_URL=postgresql://autoflow:autoflow@localhost:5432/autoflow

# Auth
JWT_SECRET=tu-secret-aqui
JWT_EXPIRES_IN=24h

# WhatsApp / Meta API
WHATSAPP_VERIFY_TOKEN=tu-verify-token
WHATSAPP_ACCESS_TOKEN=tu-access-token
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id

# N8N
N8N_WEBHOOK_URL=http://localhost:5678/webhook

# App
APP_PORT=3000
APP_URL=http://localhost:3000
```

### 4. Levantar servicios con Docker

Levanta los servicios de infraestructura (PostgreSQL, Redis, N8N):

```bash
docker-compose up -d
```

Esto inicia:
- **PostgreSQL** en `localhost:5432`
- **Redis** en `localhost:6379` (opcional)
- **N8N** en `localhost:5678`
- **Caddy** como reverse proxy (solo en producción)

### 5. Ejecutar migraciones

```bash
npm run db:migrate
npm run db:seed  # datos de ejemplo (opcional)
```

### 6. Iniciar en modo desarrollo

```bash
# Todos los servicios
npm run dev

# O por separado:
npm run dev:api      # Backend en puerto 3000
npm run dev:web      # Frontend web en puerto 5173
npm run dev:mobile   # Expo dev server
```

## Despliegue en VPS (Docker Compose)

EGIT cuenta con un VPS propio. Para desplegar:

```bash
# En el VPS
git clone https://github.com/egit-consultoria/autoflow.git
cd autoflow

# Configurar variables de producción
cp .env.example .env.production
# Editar .env.production con credenciales reales

# Levantar todo
docker-compose -f docker-compose.prod.yml up -d --build
```

### Servicios en Producción (VPS)

| Servicio | Puerto interno | Dominio/Proxy |
|----------|---------------|---------------|
| Caddy (reverse proxy) | 80, 443 | `api.autoflow.ec` |
| API (Fastify) | 3000 | Proxy por Caddy |
| N8N | 5678 | `n8n.autoflow.ec` |
| PostgreSQL | 5432 | Solo interno |
| Redis | 6379 | Solo interno |

Caddy maneja automáticamente el SSL con Let's Encrypt. Solo apuntar los dominios al IP del VPS.

### Comandos útiles en Producción

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f api

# Reiniciar un servicio
docker-compose -f docker-compose.prod.yml restart api

# Actualizar
git pull && docker-compose -f docker-compose.prod.yml up -d --build
```

## Estructura de Carpetas

```
autoflow/
├── apps/
│   ├── web/                  # Frontend web (React + Vite)
│   │   ├── src/
│   │   ├── public/
│   │   ├── index.html
│   │   └── package.json
│   └── mobile/               # App móvil (React Native + Expo)
│       ├── src/
│       ├── app.json
│       └── package.json
├── packages/
│   ├── api/                  # Backend API (Fastify)
│   │   ├── src/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── package.json
│   ├── shared/               # Tipos, constantes, utilidades compartidas
│   │   ├── src/
│   │   └── package.json
│   └── ui/                   # Componentes UI reutilizables
│       ├── src/
│       └── package.json
├── docs/                     # Documentación
│   ├── dev-guide.md
│   ├── api-spec.yaml
│   ├── project-structure.md
│   └── adr/                  # Architecture Decision Records
├── docker-compose.yml        # Dev: servicios de infraestructura
├── docker-compose.prod.yml   # Prod: todo el stack
├── Caddyfile                 # Configuración de Caddy
├── package.json              # Workspace root (npm workspaces)
└── turbo.json                # Configuración de Turborepo
```

## Estándares de Código

### TypeScript

- **Estricto siempre.** `strict: true` en tsconfig.
- Sin `any` a menos que sea absolutamente necesario (y documentar por qué).
- Tipar todas las interfaces de API (request/response).

### ESLint

Configuración base incluida en el repo. Reglas principales:

- Sin console.log en producción (usar logger).
- Prefiere `const` sobre `let`.
- Nombres descriptivos para variables y funciones.

### Prettier

Formato automático en save. Configuración:

- Single quotes
- 2 espacios de indentación
- 100 caracteres máximo por línea
- Sin punto y coma (o con — elegir uno y ser consistente)

## Convención de Commits (Conventional Commits)

Formato: `<tipo>(<alcance>): <descripción>`

### Tipos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `style` | Formato, sin cambio de lógica |
| `refactor` | Reestructuración sin cambio de funcionalidad |
| `test` | Agregar o corregir tests |
| `chore` | Tareas de mantenimiento |
| `perf` | Mejora de performance |

### Ejemplos

```
feat(auth): agregar login con JWT
fix(orders): corregir cálculo de total con IVA
docs(readme): actualizar instrucciones de setup
refactor(api): extraer middleware de validación
feat(whatsapp): integrar webhook de Meta API
```

## Flujo de Trabajo Git (GitFlow)

```
main          ← código en producción (protegido, solo merge con PR aprobado)
 │
 ├── develop  ← rama de integración (merge de features aquí)
 │    │
 │    ├── feature/CRM-01-gestion-clientes
 │    ├── feature/WHATSAPP-02-webhook-handler
 │    ├── feature/ORDERS-01-crud-pedidos
 │    │
 │    └── ...
 │
 └── release/v1.0.0  ← preparación de release
      └── hotfix/fix-crash-login  ← correcciones urgentes
```

### Proceso

1. **Crear feature branch** desde `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/CRM-01-gestion-clientes
   ```

2. **Trabajar y commitear** siguiendo Conventional Commits.

3. **Abrir Pull Request** a `develop`:
   - Título descriptivo
   - Descripción de los cambios
   - Checklist de testing
   - Review mínimo de 1 persona

4. **Merge** (squash o merge commit, según acordar).

5. **Release:** Crear `release/vX.Y.Z` desde `develop` → test final → merge a `main` + tag.

---

*Guía mantenida por Doc — Departamento I+D AutoFlow*
