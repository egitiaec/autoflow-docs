# Estructura del Proyecto — AutoFlow

Monorepo gestionado con **npm workspaces** y **Turborepo** para build orchestration.

## Diagrama del Monorepo

```
autoflow/
│
├── 📁 apps/                          # Aplicaciones desplegables
│   ├── 📁 web/                       # Dashboard web (React + Vite)
│   │   ├── src/
│   │   │   ├── components/           # Componentes específicos de web
│   │   │   ├── pages/               # Páginas/rutas
│   │   │   ├── hooks/               # Hooks personalizados
│   │   │   ├── services/            # Clientes API
│   │   │   ├── stores/              # Estado global (Zustand)
│   │   │   └── App.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── 📁 mobile/                    # App móvil (React Native + Expo)
│       ├── src/
│       │   ├── screens/              # Pantallas
│       │   ├── components/           # Componentes específicos de mobile
│       │   ├── navigation/           # Navegación (Expo Router)
│       │   ├── services/             # Clientes API
│       │   ├── stores/               # Estado global
│       │   └── App.tsx
│       ├── app.json
│       ├── babel.config.js
│       └── package.json
│
├── 📁 packages/                      # Paquetes compartidos (no desplegables)
│   ├── 📁 api/                       # Backend API (Fastify)
│   │   ├── src/
│   │   │   ├── modules/              # Módulos por dominio
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   └── auth.schema.ts
│   │   │   │   ├── clients/
│   │   │   │   ├── orders/
│   │   │   │   ├── whatsapp/
│   │   │   │   ├── reports/
│   │   │   │   └── notifications/
│   │   │   ├── core/                 # Configuración core
│   │   │   │   ├── database.ts
│   │   │   │   ├── server.ts
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   └── tenant.middleware.ts
│   │   │   └── index.ts
│   │   ├── migrations/
│   │   ├── seeds/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── 📁 shared/                    # Tipos, constantes y utilidades compartidas
│   │   ├── src/
│   │   │   ├── types/                # Interfaces TypeScript compartidas
│   │   │   │   ├── user.ts
│   │   │   │   ├── client.ts
│   │   │   │   ├── order.ts
│   │   │   │   └── whatsapp.ts
│   │   │   ├── constants/            # Constantes (enums, configs)
│   │   │   ├── utils/                # Utilidades puras (formateo, validación)
│   │   │   └── index.ts              # Barrel export
│   │   └── package.json
│   │
│   └── 📁 ui/                        # Componentes UI reutilizables (design system)
│       ├── src/
│       │   ├── components/           # Botones, inputs, modales, etc.
│       │   ├── styles/               # Tema, tokens de diseño
│       │   └── index.ts              # Barrel export
│       └── package.json
│
├── 📁 docs/                          # Documentación del proyecto
│   ├── dev-guide.md
│   ├── api-spec.yaml
│   ├── project-structure.md
│   └── adr/                          # Architecture Decision Records
│
├── 📄 docker-compose.yml             # Dev: PostgreSQL, Redis, N8N
├── 📄 docker-compose.prod.yml        # Prod: stack completo en VPS
├── 📄 Caddyfile                      # Configuración de reverse proxy
├── 📄 turbo.json                     # Configuración de Turborepo
├── 📄 package.json                   # Workspace root
├── 📄 tsconfig.base.json             # Configuración TS compartida
├── 📄 .env.example                   # Variables de entorno de ejemplo
└── 📄 .gitignore
```

## Descripción de Cada Carpeta

### `apps/web/` — Frontend Web

Dashboard principal para los usuarios de AutoFlow. Donde gestionan clientes, pedidos, ven reportes y configuran su cuenta.

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Estado:** Zustand
- **UI:** Tailwind CSS + componentes de `packages/ui`
- **Routing:** React Router v6

### `apps/mobile/` — App Móvil

App nativa para iOS y Android. Versión optimizada de las funcionalidades principales para uso en campo (ventas, entregas, comunicación con clientes).

- **Framework:** React Native + Expo SDK 50+
- **Navigation:** Expo Router
- **UI:** React Native Paper + componentes de `packages/ui`

### `packages/api/` — Backend API

El servidor central de AutoFlow. Sigue una arquitectura modular por dominio (cada módulo del sistema es un subcarpeta en `modules/`).

- **Framework:** Fastify (高性能, TypeScript first)
- **ORM:** Drizzle ORM (tipado, performante)
- **Auth:** JWT + bcrypt
- **Validación:** Zod (schemas compartidos con frontend)

### `packages/shared/` — Código Compartido

Tipos TypeScript, constantes y utilidades que son usados tanto por el frontend como por el backend. Evita duplicación y mantiene consistencia.

- Tipos de entidades (User, Client, Order, etc.)
- Constantes de negocio (estados de pedido, roles, etc.)
- Utilidades puras (formateo de moneda, validación de cédula, etc.)

### `packages/ui/` — Design System

Componentes UI reutilizables que comparten web y mobile (dentro de lo posible). Incluye el tema de la aplicación (colores, tipografía, espaciado).

- Botones, Inputs, Cards, Modales
- Tema unificado (colores EGIT, spacing tokens)

## Configuración del Workspace

### npm Workspaces

Definido en `package.json` raíz:

```json
{
  "name": "autoflow",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "db:migrate": "turbo run db:migrate",
    "db:seed": "turbo run db:seed"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

### Turborepo

`turbo.json` configura las tasks y cache:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "db:migrate": {
      "cache": false
    }
  }
}
```

### Dependencias entre paquetes

```
apps/web → packages/shared, packages/ui, packages/api (tipos)
apps/mobile → packages/shared, packages/ui
packages/api → packages/shared
packages/ui → packages/shared
```

Los paquetes se referencian por nombre en `package.json`:

```json
// apps/web/package.json
{
  "dependencies": {
    "@autoflow/shared": "workspace:*",
    "@autoflow/ui": "workspace:*"
  }
}
```

## Por qué este enfoque?

| Decisión | Razón |
|----------|-------|
| **Monorepo** | Compartir código entre web, mobile y backend sin publishing de paquetes. Cambios sincronizados. |
| **Turborepo** | Build incremental, cache distribuido, orchestration de tasks. Más rápido que Lerna/npm scripts solos. |
| **npm workspaces** | Simplicidad — no necesita Yarn. Ya tiene npm. |
| **Modular API** | Cada módulo (auth, clients, orders...) es autocontenido. Fácil de testear y escalar. |
| **shared + ui packages** | DRY — tipos, constantes y componentes en un solo lugar. |

---

*Documentación generada por Doc — Departamento I+D AutoFlow*
