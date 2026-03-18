# Historias de Usuario — AutoFlow
**Versión:** 1.2  
**Fecha:** 2026-03-17  
**Autor:** Maya (Project Manager, EGIT Consultoría)  
**Referencia:** ADR-001 v2.0 + ADR-002 v2.2  
**Estado:** ✅ Listo para Sprint Planning

---

## Actores del Sistema

| Actor | Descripción |
|-------|-------------|
| **Admin** | Dueño de PYME / Administrador del tenant. Acceso total al sistema. |
| **Manager** | Gerente de ventas / operaciones. Acceso a CRM, pedidos, citas y reportes. |
| **Employee** | Vendedor o agente de atención. Acceso operativo limitado. |
| **Cliente** | Cliente final de la PYME. Interactúa vía WhatsApp o app móvil. |
| **Sistema** | Procesos automáticos internos (eventos, schedulers, N8N). |

---

## Epic 1: Autenticación & Usuarios

> **Servicio:** `auth-service` (Spring Boot + PostgreSQL)  
> **Descripción:** Gestión de identidad, sesiones, roles y multi-tenancy. Base de toda la plataforma.

---

### HU-001: Registro de empresa (tenant)
**Epic:** Epic 1 — Autenticación & Usuarios  
**Título:** Registro de nueva empresa en la plataforma

**Historia:**  
Como **Admin**, quiero registrar mi empresa en AutoFlow, para acceder a todas las funcionalidades de la plataforma como tenant independiente.

**Criterios de Aceptación:**
1. El formulario solicita: nombre de empresa, RUC/cédula, nombre del administrador, email corporativo y contraseña.
2. El sistema crea un `tenant_id` único y aísla todos los datos de la empresa bajo ese identificador.
3. Se envía un email de verificación al correo registrado antes de activar la cuenta.
4. El Admin recibe un JWT de acceso (15 min) y refresh token (7 días) tras verificar el email.
5. Si el email ya existe en el sistema, se retorna error `409 Conflict` con mensaje claro.
6. La contraseña debe cumplir mínimo 8 caracteres, al menos 1 número y 1 carácter especial.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-002: Login de usuario
**Epic:** Epic 1 — Autenticación & Usuarios  
**Título:** Inicio de sesión con email y contraseña

**Historia:**  
Como **Admin/Manager/Employee**, quiero iniciar sesión con mis credenciales, para acceder al sistema con los permisos correspondientes a mi rol.

**Criterios de Aceptación:**
1. El endpoint `POST /api/v1/auth/login` acepta email y contraseña.
2. Si las credenciales son válidas, se retorna `access_token` (JWT, 15 min) y `refresh_token` (JWT, 7 días).
3. El JWT incluye claims: `userId`, `tenantId`, `roles`, `email`.
4. Si las credenciales son incorrectas, se retorna `401 Unauthorized` sin revelar si el email existe.
5. Después de 5 intentos fallidos consecutivos, la cuenta se bloquea por 15 minutos.
6. En la app móvil, el token se almacena de forma segura (Keychain en iOS, EncryptedSharedPreferences en Android).

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-003: Renovación de sesión (Refresh Token)
**Epic:** Epic 1 — Autenticación & Usuarios  
**Título:** Renovación automática de token de acceso

**Historia:**  
Como **Admin/Manager/Employee**, quiero que mi sesión se renueve automáticamente, para no tener que iniciar sesión cada 15 minutos mientras uso la app.

**Criterios de Aceptación:**
1. El endpoint `POST /api/v1/auth/refresh` acepta el `refresh_token` y retorna un nuevo `access_token`.
2. El refresh token solo puede usarse una vez (rotación de tokens); se genera uno nuevo en cada renovación.
3. Si el refresh token está expirado (>7 días), se retorna `401` y el usuario debe hacer login nuevamente.
4. Los tokens revocados se almacenan en Redis con TTL igual a su tiempo de expiración.
5. La app móvil realiza el refresh automáticamente cuando detecta un `401` en cualquier request.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-004: Consultar perfil del usuario autenticado
**Epic:** Epic 1 — Autenticación & Usuarios  
**Título:** Ver y editar perfil propio

**Historia:**  
Como **Admin/Manager/Employee**, quiero ver y editar mi información de perfil, para mantener mis datos actualizados en el sistema.

**Criterios de Aceptación:**
1. El endpoint `GET /api/v1/auth/me` retorna: nombre, email, rol, tenant, fecha de creación y foto de perfil (URL).
2. El usuario puede actualizar nombre, teléfono y foto de perfil sin cambiar su email.
3. El cambio de contraseña requiere confirmar la contraseña actual antes de aceptar la nueva.
4. Los cambios de email requieren re-verificación del nuevo correo.
5. La foto de perfil se almacena en MinIO y se retorna como URL pública.

**Prioridad:** Media  
**Story Points:** 3

---

### HU-005: Gestión de usuarios del tenant
**Epic:** Epic 1 — Autenticación & Usuarios  
**Título:** CRUD de usuarios dentro de la empresa

**Historia:**  
Como **Admin**, quiero gestionar los usuarios de mi empresa (agregar, editar, desactivar), para controlar quién tiene acceso al sistema y con qué permisos.

**Criterios de Aceptación:**
1. El Admin puede listar todos los usuarios de su tenant con paginación (endpoint `GET /api/v1/users`).
2. El Admin puede crear nuevos usuarios con nombre, email y rol (`admin`, `manager`, `employee`).
3. Al crear un usuario, el sistema envía un email de invitación con enlace para establecer contraseña.
4. El Admin puede cambiar el rol de cualquier usuario de su tenant.
5. El Admin puede desactivar usuarios (soft delete); el usuario desactivado no puede iniciar sesión.
6. Un Admin no puede eliminarse a sí mismo si es el único Admin del tenant.
7. Un Admin solo ve y gestiona usuarios de su propio tenant (aislamiento multi-tenant).

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-006: Asignación de roles y permisos
**Epic:** Epic 1 — Autenticación & Usuarios  
**Título:** Configurar roles RBAC para usuarios

**Historia:**  
Como **Admin**, quiero asignar roles con permisos específicos a cada usuario, para garantizar que cada persona solo acceda a lo que necesita.

**Criterios de Aceptación:**
1. El sistema soporta 3 roles predefinidos: `admin`, `manager`, `employee`.
2. El rol `admin` tiene acceso total (usuarios, config, facturación, reportes, eliminación de datos).
3. El rol `manager` accede a CRM, pedidos, citas, reportes y puede gestionar empleados.
4. El rol `employee` accede solo a sus clientes asignados, puede crear pedidos y gestionar citas.
5. El API Gateway valida el rol antes de enrutar cada request y retorna `403 Forbidden` si no tiene permiso.
6. Los permisos se incluyen en el JWT para evitar consultas adicionales a la BD en cada request.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-007: Recuperación de contraseña
**Epic:** Epic 1 — Autenticación & Usuarios  
**Título:** Restablecer contraseña olvidada por email

**Historia:**  
Como **Admin/Manager/Employee**, quiero recuperar el acceso a mi cuenta si olvidé mi contraseña, para no quedarme bloqueado del sistema.

**Criterios de Aceptación:**
1. El usuario ingresa su email en el formulario de recuperación; el sistema envía un enlace de reset.
2. El enlace de reset expira en 1 hora y es de un solo uso.
3. Al hacer clic en el enlace, el usuario puede establecer una nueva contraseña que cumpla los requisitos de seguridad.
4. Tras restablecer la contraseña, todos los refresh tokens activos del usuario se invalidan.
5. Si el email no existe en el sistema, se muestra el mismo mensaje de éxito (sin revelar si el email existe o no).

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-008: Logout y cierre de sesión
**Epic:** Epic 1 — Autenticación & Usuarios  
**Título:** Cerrar sesión de forma segura

**Historia:**  
Como **Admin/Manager/Employee**, quiero cerrar mi sesión de forma segura, para proteger mi cuenta cuando deje de usar la app.

**Criterios de Aceptación:**
1. El endpoint `POST /api/v1/auth/logout` invalida el refresh token actual del usuario.
2. El refresh token se agrega a la blocklist en Redis con TTL correspondiente.
3. La app móvil elimina el token local del almacenamiento seguro del dispositivo.
4. Existe opción de "cerrar sesión en todos los dispositivos" que invalida todos los refresh tokens del usuario.
5. Tras el logout, cualquier intento de uso del refresh token retorna `401`.

**Prioridad:** Media  
**Story Points:** 3

---

**Subtotal Epic 1: 8 HUs | 42 Story Points**

---

## Epic 2: CRM (Clientes, Pipeline)

> **Servicio:** `crm-service` (Spring Boot + PostgreSQL)  
> **Descripción:** Gestión centralizada de clientes, historial de interacciones y pipeline de ventas.

---

### HU-009: Crear y editar cliente
**Epic:** Epic 2 — CRM  
**Título:** Gestión de ficha de cliente

**Historia:**  
Como **Manager/Employee**, quiero crear y editar fichas de clientes, para tener toda la información de contacto centralizada en un solo lugar.

**Criterios de Aceptación:**
1. La ficha de cliente incluye: nombre completo, empresa, teléfono (WhatsApp), email, dirección, notas y etiquetas.
2. El teléfono de WhatsApp debe incluir código de país (ej: `593984526396`); el sistema valida el formato.
3. Un cliente puede ser asociado a múltiples números de teléfono y emails.
4. El sistema evita duplicados por número de WhatsApp dentro del mismo tenant.
5. El cliente creado aparece inmediatamente en el listado con ordenamiento por fecha de creación.
6. Todos los campos tienen historial de cambios auditado en `audit_logs`.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-010: Buscar y filtrar clientes
**Epic:** Epic 2 — CRM  
**Título:** Búsqueda avanzada en el directorio de clientes

**Historia:**  
Como **Manager/Employee**, quiero buscar clientes por nombre, teléfono, etiqueta o etapa del pipeline, para encontrar rápidamente la información que necesito.

**Criterios de Aceptación:**
1. La búsqueda full-text por nombre, empresa, email y teléfono retorna resultados en <500ms (p95).
2. Se pueden combinar filtros: etiqueta, etapa del pipeline, fecha de creación, asignado a empleado.
3. Los resultados se muestran paginados (20 por página por defecto, configurable).
4. La búsqueda es insensible a mayúsculas/minúsculas y tildes.
5. Los resultados de búsqueda frecuentes se cachean en Redis por 5 minutos.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-011: Ver historial de interacciones del cliente
**Epic:** Epic 2 — CRM  
**Título:** Línea de tiempo de interacciones por cliente

**Historia:**  
Como **Manager/Employee**, quiero ver el historial completo de interacciones con un cliente, para conocer el contexto de la relación antes de contactarlo.

**Criterios de Aceptación:**
1. La línea de tiempo muestra: mensajes WhatsApp, pedidos, citas, llamadas manuales y notas.
2. Cada interacción muestra: tipo, fecha/hora, resumen, empleado responsable.
3. Las interacciones se ordenan cronológicamente (más reciente primero) con opción de invertir.
4. El historial es infinitamente scrollable (paginación sin límite visible para el usuario).
5. Los mensajes de WhatsApp muestran un preview del texto o descripción del tipo de media.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-012: Gestionar pipeline de ventas
**Epic:** Epic 2 — CRM  
**Título:** Pipeline Kanban de oportunidades de venta

**Historia:**  
Como **Manager**, quiero visualizar y gestionar el pipeline de ventas en formato Kanban, para hacer seguimiento al progreso de cada oportunidad.

**Criterios de Aceptación:**
1. El pipeline muestra columnas configurables (etapas) que el Admin puede crear, renombrar y reordenar.
2. Las etapas por defecto son: Nuevo Contacto → Calificado → Propuesta → Negociación → Ganado/Perdido.
3. Un cliente puede arrastrarse entre etapas; el cambio se guarda inmediatamente.
4. Cada tarjeta del pipeline muestra: nombre del cliente, valor estimado, responsable y días en etapa actual.
5. Al mover un cliente a "Ganado" o "Perdido", se solicita un motivo opcional.
6. El pipeline publica evento `client.updated` a RabbitMQ para que `reports-service` actualice métricas.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-013: Etiquetar y segmentar clientes
**Epic:** Epic 2 — CRM  
**Título:** Sistema de etiquetas para clasificar clientes

**Historia:**  
Como **Manager/Employee**, quiero etiquetar clientes con categorías personalizadas, para segmentarlos y encontrarlos fácilmente según criterios de negocio.

**Criterios de Aceptación:**
1. El Admin puede crear etiquetas con nombre y color (Admin define etiquetas del tenant).
2. Un cliente puede tener múltiples etiquetas simultáneamente.
3. Las etiquetas son buscables y filtrables en el listado de clientes.
4. Se puede aplicar/quitar una etiqueta en batch a múltiples clientes seleccionados.
5. Al eliminar una etiqueta, se muestra cuántos clientes la tienen y se pide confirmación.

**Prioridad:** Media  
**Story Points:** 3

---

### HU-014: Registrar interacción manual
**Epic:** Epic 2 — CRM  
**Título:** Agregar notas o registros de llamadas al historial

**Historia:**  
Como **Employee**, quiero registrar interacciones manuales (llamadas, visitas, notas) en la ficha del cliente, para que el equipo tenga contexto completo sin importar el canal de contacto.

**Criterios de Aceptación:**
1. El Employee puede agregar: nota de texto, registro de llamada (duración, resultado) o tarea de seguimiento.
2. Cada registro incluye fecha/hora (automática o manual), tipo de interacción y empleado responsable.
3. Las tareas de seguimiento pueden tener fecha límite y asignarse a otro miembro del equipo.
4. Las tareas vencidas aparecen destacadas en el dashboard del empleado responsable.
5. Al guardar, el historial del cliente se actualiza inmediatamente para todos los usuarios del tenant.

**Prioridad:** Media  
**Story Points:** 3

---

### HU-015: Vista 360° del cliente
**Epic:** Epic 2 — CRM  
**Título:** Panel consolidado con toda la información de un cliente

**Historia:**  
Como **Manager**, quiero ver en una sola pantalla el resumen completo de un cliente (pedidos, citas, mensajes, valor total), para tomar decisiones comerciales rápidas.

**Criterios de Aceptación:**
1. La vista 360° muestra en un solo panel: datos de contacto, etapa del pipeline, últimas interacciones, pedidos recientes, próximas citas y valor total de compras.
2. Los datos se cargan en <500ms aprovechando cache de Redis.
3. Existe un botón directo para enviar un mensaje WhatsApp desde esta vista.
4. Existe un botón para crear un pedido o cita directamente desde la ficha del cliente.
5. Los datos están sincronizados en tiempo real: si otro agente cambia algo, se actualiza en <5 segundos.

**Prioridad:** Media  
**Story Points:** 5

---

**Subtotal Epic 2: 7 HUs | 34 Story Points**

---

## Epic 3: Pedidos & Catálogo

> **Servicio:** `orders-service` (Spring Boot + PostgreSQL)  
> **Descripción:** Ciclo completo de pedidos desde creación hasta entrega, catálogo de productos y facturación.

---

### HU-016: Crear pedido
**Epic:** Epic 3 — Pedidos & Catálogo  
**Título:** Creación de nuevo pedido para un cliente

**Historia:**  
Como **Employee/Manager**, quiero crear un pedido para un cliente desde el panel de administración, para registrar ventas y hacer seguimiento de cada transacción.

**Criterios de Aceptación:**
1. El formulario de pedido requiere: cliente (buscable), productos del catálogo (con cantidad), dirección de entrega y método de pago.
2. El sistema calcula automáticamente el subtotal, impuestos (IVA 15% Ecuador) y total.
3. Al crear el pedido, su estado inicial es `DRAFT`; el Employee debe confirmarlo para pasar a `PENDING`.
4. El pedido creado publica evento `order.created` en RabbitMQ para que `notifications-service` envíe confirmación al cliente.
5. Se genera un número de pedido único y consecutivo por tenant (ej: `ORD-2026-0001`).
6. El pedido queda asociado al cliente en el CRM y aparece en su historial de interacciones.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-017: Gestionar estados del pedido
**Epic:** Epic 3 — Pedidos & Catálogo  
**Título:** Actualización del ciclo de vida del pedido

**Historia:**  
Como **Employee/Manager**, quiero actualizar el estado de un pedido en cada etapa del proceso, para mantener al cliente informado y al equipo alineado.

**Criterios de Aceptación:**
1. Los estados del pedido siguen el flujo: `DRAFT → PENDING → CONFIRMED → SHIPPED → DELIVERED → CANCELLED`.
2. Solo se permiten transiciones válidas (no se puede pasar de `DRAFT` a `DELIVERED` directamente).
3. Cada cambio de estado publica evento `order.status_changed` en RabbitMQ para notificar al cliente vía WhatsApp y/o push.
4. El estado `CANCELLED` requiere ingresar un motivo de cancelación.
5. El historial de cambios de estado se registra con timestamp y usuario responsable.
6. El Manager puede ver todos los pedidos del tenant; el Employee solo los que creó o le fueron asignados.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-018: Ver historial de pedidos
**Epic:** Epic 3 — Pedidos & Catálogo  
**Título:** Listado y búsqueda de pedidos

**Historia:**  
Como **Manager**, quiero buscar y filtrar pedidos por estado, cliente, fecha o monto, para hacer seguimiento eficiente de la operación.

**Criterios de Aceptación:**
1. El listado de pedidos soporta filtros por: estado, cliente, empleado responsable, rango de fechas y rango de montos.
2. Los resultados se paginan con 20 pedidos por página y soporte de ordenamiento por columna.
3. El listado muestra: número de pedido, cliente, estado, total, fecha de creación y responsable.
4. Existe vista de detalle del pedido con todos los productos, cantidades y precios.
5. El Manager puede exportar el listado filtrado a CSV.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-019: Gestionar catálogo de productos
**Epic:** Epic 3 — Pedidos & Catálogo  
**Título:** CRUD de productos en el catálogo

**Historia:**  
Como **Admin/Manager**, quiero gestionar el catálogo de productos de mi negocio, para que los empleados puedan seleccionarlos rápidamente al crear pedidos.

**Criterios de Aceptación:**
1. Cada producto tiene: nombre, descripción, SKU, precio, stock disponible, categoría e imagen (almacenada en MinIO).
2. Los productos pueden organizarse en categorías jerárquicas (categoría → subcategoría).
3. Se puede activar/desactivar un producto sin eliminarlo; los productos inactivos no aparecen al crear pedidos.
4. Al agregar un producto a un pedido, el sistema valida que haya stock suficiente.
5. El catálogo es editable por tenant; un tenant no ve los productos de otro.
6. Soporte para importar productos desde CSV (nombre, SKU, precio, stock).

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-020: Generar factura en PDF
**Epic:** Epic 3 — Pedidos & Catálogo  
**Título:** Generación y descarga de factura del pedido

**Historia:**  
Como **Employee/Manager**, quiero generar y descargar la factura de un pedido en PDF, para enviársela al cliente como comprobante.

**Criterios de Aceptación:**
1. La factura PDF incluye: logo de la empresa, datos del tenant (RUC, dirección, teléfono), datos del cliente, detalle de productos, subtotal, IVA (15%) y total.
2. La factura se genera al confirmar el pedido (estado `CONFIRMED` o posterior).
3. El PDF se almacena en MinIO con naming convention: `invoices/{tenantId}/{orderId}.pdf`.
4. El Employee puede descargar la factura desde el detalle del pedido.
5. Se puede enviar la factura al cliente por WhatsApp o email directamente desde la vista del pedido.
6. La factura tiene número correlativo único por tenant (ej: `FAC-2026-0001`).

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-021: Pedido rápido desde conversación WhatsApp
**Epic:** Epic 3 — Pedidos & Catálogo  
**Título:** Crear pedido directamente desde el chat de WhatsApp

**Historia:**  
Como **Employee**, quiero crear un pedido directamente desde la vista de conversación de WhatsApp del cliente, para agilizar el proceso sin cambiar de pantalla.

**Criterios de Aceptación:**
1. En la vista de conversación de WhatsApp, existe un botón "Crear Pedido" que abre el formulario de pedido pre-cargado con los datos del cliente.
2. El formulario de pedido rápido permite seleccionar productos del catálogo con búsqueda.
3. Al confirmar el pedido, el sistema puede enviar automáticamente un mensaje de confirmación al cliente en WhatsApp (configurable por el Admin).
4. El pedido creado aparece en el historial del cliente en el CRM.
5. El proceso de creación desde WhatsApp toma menos de 3 clics/taps.

**Prioridad:** Media  
**Story Points:** 5

---

**Subtotal Epic 3: 6 HUs | 39 Story Points**

---

## Epic 4: WhatsApp (Evolution API)

> **Servicio:** `whatsapp-service` (Spring Boot + MongoDB)  
> **Integración:** Evolution API — evolutionapi.egit.site | Instancia: miAsistente | Número: 593984526396  
> **Descripción:** Mensajería bidireccional vía WhatsApp, gestión de conversaciones y plantillas.

---

### HU-022: Recibir y visualizar mensajes de WhatsApp
**Epic:** Epic 4 — WhatsApp  
**Título:** Bandeja de entrada de conversaciones WhatsApp

**Historia:**  
Como **Employee/Manager**, quiero ver todos los mensajes entrantes de WhatsApp en una bandeja unificada, para responder a los clientes desde el panel sin salir de AutoFlow.

**Criterios de Aceptación:**
1. La bandeja muestra todas las conversaciones activas ordenadas por último mensaje (más reciente primero).
2. Cada fila de conversación muestra: foto de perfil, nombre del cliente (si existe en CRM), preview del último mensaje, hora y contador de mensajes no leídos.
3. Los mensajes entrantes llegan en tiempo real (webhook de Evolution API → `whatsapp-service` → UI vía WebSocket o polling cada 3s).
4. El sistema soporta mensajes de texto, imágenes, documentos PDF, audio y stickers.
5. Al abrir una conversación, todos los mensajes se marcan como leídos automáticamente.
6. Si el número del mensaje no existe en el CRM, aparece un botón "Agregar al CRM" para crear el cliente.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-023: Enviar mensajes de texto por WhatsApp
**Epic:** Epic 4 — WhatsApp  
**Título:** Respuesta a clientes vía WhatsApp desde el panel

**Historia:**  
Como **Employee**, quiero enviar mensajes de texto a los clientes directamente desde el panel de conversaciones, para atender consultas sin usar el WhatsApp del teléfono.

**Criterios de Aceptación:**
1. El Employee escribe el mensaje en un campo de texto y lo envía con Enter o botón "Enviar".
2. El mensaje se envía vía `POST /whatsapp/send` al `whatsapp-service`, que llama a Evolution API.
3. El mensaje aparece en la conversación con estado: `Enviado` → `Entregado` → `Leído` (confirmado por webhook de Evolution API).
4. Si el envío falla, se muestra indicador de error y opción de reintentar.
5. El historial de mensajes enviados se guarda en MongoDB con timestamp, contenido y estado de entrega.
6. El mensaje enviado se registra como interacción en el CRM del cliente.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-024: Enviar mensajes con archivos adjuntos
**Epic:** Epic 4 — WhatsApp  
**Título:** Envío de imágenes, documentos y audio por WhatsApp

**Historia:**  
Como **Employee**, quiero enviar imágenes, PDF y archivos de audio al cliente por WhatsApp, para compartir catálogos, facturas y comprobantes sin salir del sistema.

**Criterios de Aceptación:**
1. Se pueden adjuntar archivos desde el panel: imágenes (JPG, PNG, WEBP hasta 16MB), documentos (PDF hasta 100MB) y audio (MP3, OGG hasta 16MB).
2. El archivo se sube primero a MinIO y luego se envía vía Evolution API usando la URL del archivo.
3. La factura de un pedido puede enviarse directamente desde el detalle del pedido con un clic.
4. Las imágenes muestran preview antes de enviar.
5. Se indica el progreso de carga del archivo al usuario.
6. El archivo enviado queda referenciado en el historial de la conversación.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-025: Gestionar plantillas de mensajes
**Epic:** Epic 4 — WhatsApp  
**Título:** Biblioteca de plantillas de mensajes reutilizables

**Historia:**  
Como **Manager**, quiero crear y gestionar plantillas de mensajes para respuestas frecuentes, para que el equipo ahorre tiempo y mantenga un tono consistente con los clientes.

**Criterios de Aceptación:**
1. El Manager puede crear plantillas con nombre, categoría, contenido de texto y variables dinámicas (ej: `{{nombre_cliente}}`, `{{numero_pedido}}`).
2. Las plantillas son accesibles para todos los empleados del tenant desde la vista de conversación.
3. Al seleccionar una plantilla, las variables se reemplazan automáticamente con los datos del cliente/pedido en contexto.
4. Las plantillas se organizan por categorías (Bienvenida, Pedidos, Citas, Soporte, etc.).
5. El Manager puede activar/desactivar plantillas sin eliminarlas.
6. Las plantillas se almacenan en MongoDB con soporte para múltiples idiomas (configurable por tenant).

**Prioridad:** Media  
**Story Points:** 5

---

### HU-026: Ver historial completo de conversaciones
**Epic:** Epic 4 — WhatsApp  
**Título:** Historial de chat con un cliente

**Historia:**  
Como **Employee/Manager**, quiero ver el historial completo de mensajes con un cliente, para tener contexto de conversaciones anteriores antes de responder.

**Criterios de Aceptación:**
1. El historial muestra todos los mensajes intercambiados con el cliente ordenados cronológicamente.
2. El historial tiene scroll infinito hacia atrás (carga mensajes anteriores al hacer scroll up).
3. Se pueden buscar mensajes dentro de una conversación por palabras clave.
4. Los mensajes muestran el nombre del agente que respondió (si fue desde el panel).
5. El historial se sincroniza con el historial de interacciones del cliente en el CRM.
6. Los medios (imágenes, documentos) en el historial son descargables.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-027: Recibir notificación de mensaje nuevo
**Epic:** Epic 4 — WhatsApp  
**Título:** Alertas en tiempo real de mensajes entrantes

**Historia:**  
Como **Employee**, quiero recibir una notificación inmediata cuando llegue un nuevo mensaje de WhatsApp, para responder rápidamente sin estar pendiente de la bandeja.

**Criterios de Aceptación:**
1. Al recibir un mensaje nuevo, el `whatsapp-service` publica evento `message.received` en RabbitMQ.
2. El `notifications-service` procesa el evento y envía push notification via FCM al dispositivo del empleado asignado.
3. La notificación push muestra: nombre/número del cliente, preview del mensaje y al tocarla abre la conversación en la app.
4. Si el mensaje llega fuera del horario de atención configurado, se envía una respuesta automática indicando el horario (configurable por tenant).
5. El badge de mensajes no leídos en el ícono de la app se actualiza inmediatamente.

**Prioridad:** Alta  
**Story Points:** 5

---

**Subtotal Epic 4: 6 HUs | 33 Story Points**

---

## Epic 5: Notificaciones (FCM + Email)

> **Servicio:** `notifications-service` (Spring Boot + MongoDB + Firebase Admin SDK)  
> **Descripción:** Motor de notificaciones multicanal: push (FCM), email (SMTP/SendGrid) y WhatsApp.

---

### HU-028: Registrar dispositivo para notificaciones push
**Epic:** Epic 5 — Notificaciones  
**Título:** Suscripción de app móvil a notificaciones FCM

**Historia:**  
Como **Employee/Manager**, quiero que mi teléfono esté registrado para recibir notificaciones push, para estar informado de mensajes, pedidos y citas sin tener la app abierta.

**Criterios de Aceptación:**
1. Al iniciar sesión en la app móvil, se solicita permiso de notificaciones al usuario.
2. Si el usuario acepta, la app obtiene el token FCM del dispositivo y lo registra vía `POST /api/v1/notifications/fcm/register-token`.
3. El backend almacena el token en MongoDB asociado al `userId` y `tenantId`.
4. Si el token ya existe para ese usuario en ese dispositivo, se actualiza sin crear duplicados.
5. Los tokens se invalidan automáticamente cuando el usuario hace logout.
6. El sistema maneja tokens FCM expirados: al detectar error de entrega, elimina el token y registra el evento.

**Prioridad:** Alta  
**Story Points:** 3

---

### HU-029: Enviar notificación push por evento del sistema
**Epic:** Epic 5 — Notificaciones  
**Título:** Push notification automática ante eventos de negocio

**Historia:**  
Como **Sistema**, quiero enviar notificaciones push automáticas cuando ocurran eventos importantes (nuevo mensaje, cambio de pedido, nueva cita), para mantener informados a los usuarios sin que deban revisar manualmente el sistema.

**Criterios de Aceptación:**
1. El `notifications-service` consume eventos de RabbitMQ y envía push vía FCM Admin SDK.
2. Se soportan notificaciones individuales (a un usuario), por topic (a un rol) y multicast (hasta 500 tokens).
3. El payload de la notificación incluye: `title`, `body`, `data` (JSON estructurado para deep linking en la app) e `imageUrl` opcional.
4. Ante fallo de entrega FCM, se reintenta con backoff exponencial (3 intentos máximo).
5. Cada notificación enviada se registra en `notifications_log` con estado: `sent`, `failed`, `delivered`.
6. El Admin puede ver el resumen de notificaciones enviadas en el dashboard.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-030: Enviar email de notificación
**Epic:** Epic 5 — Notificaciones  
**Título:** Emails transaccionales automáticos

**Historia:**  
Como **Sistema**, quiero enviar emails automáticos en eventos clave (registro, reset de contraseña, confirmación de pedido, recordatorio de cita), para comunicarme con los usuarios por un canal adicional al push.

**Criterios de Aceptación:**
1. El sistema envía emails HTML con diseño responsivo usando plantillas configurables por tenant.
2. Se soportan los siguientes eventos: registro/verificación, reset de contraseña, confirmación de pedido, cambio de estado de pedido, confirmación de cita y recordatorio de cita.
3. El proveedor SMTP es configurable por tenant (SMTP propio, SendGrid o AWS SES).
4. Si el email falla, se reintenta hasta 3 veces con backoff exponencial; el fallo final se registra en log.
5. El Admin puede previsualizar las plantillas de email desde el panel de configuración.
6. Los emails incluyen enlace de baja (`unsubscribe`) para comunicaciones no transaccionales.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-031: Gestionar plantillas de notificación
**Epic:** Epic 5 — Notificaciones  
**Título:** Editor de plantillas de email y push por tenant

**Historia:**  
Como **Admin**, quiero personalizar las plantillas de email y push notification con la imagen de mi empresa, para que las comunicaciones automáticas tengan nuestra marca y tono.

**Criterios de Aceptación:**
1. El Admin puede editar el contenido HTML de las plantillas de email (editor con preview en tiempo real).
2. Las plantillas soportan variables dinámicas: `{{nombre_cliente}}`, `{{numero_pedido}}`, `{{fecha_cita}}`, etc.
3. El Admin puede subir el logo de la empresa (MinIO) y configurar colores corporativos que se aplican a las plantillas.
4. Los cambios en las plantillas se aplican a futuros envíos sin afectar los ya enviados.
5. Existe opción de restaurar una plantilla a su versión predeterminada del sistema.
6. Las plantillas se almacenan en MongoDB y son completamente aisladas por tenant.

**Prioridad:** Media  
**Story Points:** 5

---

### HU-032: Ver historial y estado de notificaciones
**Epic:** Epic 5 — Notificaciones  
**Título:** Log de notificaciones enviadas

**Historia:**  
Como **Admin/Manager**, quiero ver el historial de notificaciones enviadas con su estado de entrega, para verificar que las comunicaciones lleguen correctamente a los destinatarios.

**Criterios de Aceptación:**
1. El historial muestra: canal (push/email/WhatsApp), destinatario, asunto/preview, estado y fecha/hora.
2. Los estados posibles son: `queued`, `sent`, `delivered`, `failed`, `bounced`.
3. Se puede filtrar por canal, estado, rango de fechas y destinatario.
4. Los fallos muestran el motivo del error para diagnóstico.
5. El historial se almacena en MongoDB con retención de 90 días.

**Prioridad:** Baja  
**Story Points:** 3

---

**Subtotal Epic 5: 5 HUs | 27 Story Points**

---

## Epic 6: Sistema de Citas (Google Calendar)

> **Servicio:** `appointment-service` (Spring Boot + PostgreSQL + Google Calendar API)  
> **Descripción:** Reserva de citas con verificación de disponibilidad en tiempo real y sincronización con Google Calendar.

---

### HU-033: Configurar horarios de atención del negocio
**Epic:** Epic 6 — Sistema de Citas  
**Título:** Definir días y horas de atención por servicio

**Historia:**  
Como **Admin**, quiero configurar los horarios de atención de mi negocio, para que el sistema solo permita reservas dentro de esas franjas horarias.

**Criterios de Aceptación:**
1. El Admin puede definir horarios por día de la semana (ej: Lunes-Viernes 09:00-18:00, Sábados 09:00-13:00).
2. Se pueden marcar días completos como no laborables (festivos, vacaciones) con fecha específica.
3. Los horarios soportan turnos partidos (ej: 09:00-13:00 y 15:00-18:00).
4. Se puede configurar un buffer entre citas para limpieza o preparación (ej: 10 minutos entre turnos).
5. Los horarios son configurables por tipo de servicio (ej: consultas médicas solo martes y jueves).
6. Los cambios de horario solo afectan futuras reservas, no las ya confirmadas.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-034: Configurar tipos de servicio y duración
**Epic:** Epic 6 — Sistema de Citas  
**Título:** Catálogo de servicios reservables

**Historia:**  
Como **Admin**, quiero definir los tipos de servicio que ofrece mi negocio con su duración y precio, para que el sistema calcule correctamente la disponibilidad de cada tipo de cita.

**Criterios de Aceptación:**
1. Cada tipo de servicio tiene: nombre, descripción, duración en minutos, precio y buffer post-cita.
2. El Admin puede activar/desactivar servicios sin eliminarlos.
3. Cada servicio puede estar asignado a uno o más miembros del staff.
4. La duración mínima de un servicio es 15 minutos; el sistema solo genera slots en esos intervalos.
5. Los servicios inactivos no aparecen disponibles para reserva.

**Prioridad:** Alta  
**Story Points:** 3

---

### HU-035: Consultar disponibilidad de citas
**Epic:** Epic 6 — Sistema de Citas  
**Título:** Ver slots disponibles para reservar

**Historia:**  
Como **Cliente/Employee**, quiero ver los horarios disponibles para un servicio en una fecha específica, para elegir el momento que mejor me convenga.

**Criterios de Aceptación:**
1. El endpoint `GET /api/v1/appointments/availability?date=&serviceId=` retorna los slots disponibles.
2. La disponibilidad se verifica en tiempo real contra: citas existentes en PostgreSQL, Google Calendar del negocio y API propia del negocio (si está configurada).
3. Se usa lock optimista en PostgreSQL para evitar race conditions al confirmar simultáneamente el mismo slot.
4. Si no hay disponibilidad en la fecha solicitada, el sistema sugiere las próximas 3 fechas con slots libres.
5. Los slots ocupados por menos de 5 minutos (reserva en proceso) se bloquean temporalmente en Redis.
6. La respuesta incluye al menos 7 días de disponibilidad hacia adelante desde la fecha solicitada.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-036: Reservar una cita
**Epic:** Epic 6 — Sistema de Citas  
**Título:** Creación de reserva de cita

**Historia:**  
Como **Cliente/Employee**, quiero reservar una cita seleccionando el servicio, fecha y hora disponible, para asegurar mi turno sin llamar por teléfono.

**Criterios de Aceptación:**
1. La reserva requiere: servicio, fecha/hora, datos del cliente (nombre, teléfono, email) y notas opcionales.
2. Al confirmar, el sistema crea la cita en PostgreSQL con estado `CONFIRMED` y la sincroniza con Google Calendar del negocio (crea evento).
3. El cliente recibe confirmación inmediata vía WhatsApp (Evolution API) y/o push (FCM).
4. Si el slot ya no está disponible al momento de confirmar (concurrencia), se notifica al usuario y se muestran slots alternativos.
5. El flujo de reserva completo (desde selección de servicio hasta confirmación) toma menos de 3 pasos.
6. La cita creada publica evento `appointment.created` en RabbitMQ para N8N y `notifications-service`.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-037: Cancelar una cita
**Epic:** Epic 6 — Sistema de Citas  
**Título:** Cancelación de cita reservada

**Historia:**  
Como **Cliente/Employee**, quiero cancelar una cita reservada, para liberar el slot y notificar al negocio con anticipación suficiente.

**Criterios de Aceptación:**
1. El endpoint `PUT /api/v1/appointments/{id}/cancel` acepta el ID de la cita y un motivo de cancelación.
2. La política de cancelación es configurable por tenant (ej: libre hasta 2 horas antes; después requiere autorización del Manager).
3. Al cancelar, el evento en Google Calendar se elimina automáticamente.
4. El negocio recibe notificación de la cancelación (push al Manager/Employee asignado).
5. El cliente recibe confirmación de la cancelación vía WhatsApp.
6. Las cancelaciones se registran para estadísticas (tasa de no-shows y cancelaciones en `reports-service`).

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-038: Reprogramar una cita
**Epic:** Epic 6 — Sistema de Citas  
**Título:** Cambiar la fecha y hora de una cita existente

**Historia:**  
Como **Cliente/Employee**, quiero reprogramar una cita a otra fecha/hora disponible, para no perder el servicio reservado cuando hay un imprevisto.

**Criterios de Aceptación:**
1. El endpoint `PUT /api/v1/appointments/{id}/reschedule` acepta nueva fecha y hora.
2. El sistema verifica la disponibilidad del nuevo slot antes de confirmar el cambio.
3. El evento en Google Calendar se actualiza con la nueva fecha/hora.
4. El cliente y el negocio reciben notificación del cambio vía WhatsApp y push.
5. El historial de reprogramaciones queda registrado en la cita (auditoría).
6. Solo se puede reprogramar dentro de la ventana de anticipación máxima configurada (ej: hasta 30 días en adelante).

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-039: Recordatorios automáticos de cita
**Epic:** Epic 6 — Sistema de Citas  
**Título:** Envío de recordatorios antes de la cita

**Historia:**  
Como **Sistema**, quiero enviar recordatorios automáticos a los clientes antes de su cita, para reducir las inasistencias (no-shows) y mejorar la puntualidad.

**Criterios de Aceptación:**
1. El sistema envía recordatorio 24 horas antes de la cita vía WhatsApp (Evolution API) y push (FCM).
2. El sistema envía recordatorio 2 horas antes de la cita vía push (FCM).
3. Los recordatorios son configurables por tenant: canales, tiempos de anticipación y mensaje.
4. El contenido del recordatorio incluye: nombre del cliente, servicio, fecha/hora, dirección o enlace de videollamada.
5. Si el cliente cancela después de recibir el recordatorio de 24h, el slot se libera automáticamente.
6. Los recordatorios se programan vía N8N o scheduler interno del `appointment-service` al crear/confirmar la cita.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-040: Ver próximas citas y agenda del día
**Epic:** Epic 6 — Sistema de Citas  
**Título:** Dashboard de citas del negocio

**Historia:**  
Como **Manager/Employee**, quiero ver la agenda de citas del día y de la semana, para organizar la operación del negocio y preparar los recursos necesarios.

**Criterios de Aceptación:**
1. La vista de agenda muestra citas en formato calendario (día, semana y mes).
2. Cada cita en la agenda muestra: cliente, servicio, hora de inicio/fin, estado y empleado asignado.
3. La agenda puede filtrarse por empleado, servicio o tipo de estado.
4. Las citas se sincronizan con Google Calendar; cambios en la agenda de AutoFlow se reflejan en Google Calendar.
5. El Employee solo ve las citas que le están asignadas; el Manager ve todas.
6. Existe vista de "próximas citas" en el dashboard principal con las 5 citas más próximas del día.

**Prioridad:** Media  
**Story Points:** 5

---

**Subtotal Epic 6: 8 HUs | 47 Story Points**

---

## Epic 7: Reportes & Dashboard

> **Servicio:** `reports-service` (Spring Boot + PostgreSQL + MongoDB)  
> **Descripción:** KPIs del negocio, analytics de WhatsApp, citas y exportación de datos.

---

### HU-041: Dashboard principal con KPIs del negocio
**Epic:** Epic 7 — Reportes & Dashboard  
**Título:** Panel de métricas clave en tiempo real

**Historia:**  
Como **Admin/Manager**, quiero ver un dashboard con los KPIs más importantes de mi negocio, para tomar decisiones basadas en datos sin necesidad de exportar reportes.

**Criterios de Aceptación:**
1. El dashboard muestra en tiempo real (actualización cada 5 minutos): total de clientes, pedidos del día, ingresos del mes, citas del día y conversaciones WhatsApp activas.
2. Los KPIs incluyen comparativa con el período anterior (ej: "↑ 15% vs mes anterior").
3. El dashboard se carga en menos de 2 segundos aprovechando cache en Redis y `report_cache` en MongoDB.
4. Los datos del dashboard son exclusivos del tenant del usuario (aislamiento completo).
5. Existe versión simplificada del dashboard en la app móvil con los 4 KPIs más importantes.
6. Los datos históricos se almacenan en `report_snapshots` en PostgreSQL para comparativas futuras.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-042: Reporte de ventas y pedidos
**Epic:** Epic 7 — Reportes & Dashboard  
**Título:** Análisis de ventas por período, producto y empleado

**Historia:**  
Como **Manager**, quiero ver reportes de ventas detallados por período, para identificar tendencias, productos más vendidos y rendimiento del equipo.

**Criterios de Aceptación:**
1. El reporte de ventas permite seleccionar rango de fechas (día, semana, mes, trimestre, año o personalizado).
2. Muestra: total de ventas, número de pedidos, ticket promedio, productos más vendidos y empleados con más ventas.
3. Los datos se presentan en gráficos de barras y líneas (datos agregados).
4. Se puede desglosar por categoría de producto, empleado responsable o estado de pedido.
5. El reporte tarda menos de 3 segundos en generarse gracias a Materialized Views en PostgreSQL.
6. Los datos del reporte pueden exportarse a CSV desde el mismo panel.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-043: Métricas de WhatsApp
**Epic:** Epic 7 — Reportes & Dashboard  
**Título:** Análisis de rendimiento del canal WhatsApp

**Historia:**  
Como **Manager**, quiero ver métricas del canal WhatsApp, para evaluar el volumen de atención, tiempos de respuesta y rendimiento del equipo en este canal.

**Criterios de Aceptación:**
1. Las métricas incluyen: mensajes recibidos, mensajes enviados, conversaciones iniciadas, tiempo promedio de primera respuesta y tiempo promedio de resolución.
2. Se puede filtrar por empleado, rango de fechas y estado de conversación.
3. El reporte muestra las horas de mayor volumen de mensajes (mapa de calor por hora del día).
4. Indica el porcentaje de conversaciones con respuesta en menos de 5 minutos (SLA configurado).
5. Los datos provienen de MongoDB (`messages`, `conversations`) con agregaciones optimizadas.

**Prioridad:** Media  
**Story Points:** 8

---

### HU-044: Métricas de citas
**Epic:** Epic 7 — Reportes & Dashboard  
**Título:** Análisis de ocupación y rendimiento del sistema de citas

**Historia:**  
Como **Manager**, quiero ver métricas de mi sistema de citas, para optimizar la agenda, reducir no-shows y mejorar la tasa de ocupación.

**Criterios de Aceptación:**
1. Las métricas incluyen: total de citas confirmadas, tasa de cancelación, tasa de no-show, tasa de ocupación por servicio y por día.
2. Se puede ver la distribución de citas por tipo de servicio, empleado y rango horario.
3. El reporte identifica los horarios con mayor y menor demanda.
4. Se muestra el ingreso generado por citas en el período seleccionado.
5. La tasa de no-show se compara con el período anterior para medir el impacto de los recordatorios automáticos.

**Prioridad:** Media  
**Story Points:** 5

---

### HU-045: Exportar reportes a CSV y PDF
**Epic:** Epic 7 — Reportes & Dashboard  
**Título:** Descarga de reportes en formatos estándar

**Historia:**  
Como **Admin/Manager**, quiero exportar cualquier reporte en CSV o PDF, para compartirlo con socios, contadores o analizarlo en herramientas externas.

**Criterios de Aceptación:**
1. Todos los reportes del sistema tienen botón "Exportar CSV" y "Exportar PDF".
2. El CSV exporta los datos crudos filtrados por el período y filtros seleccionados.
3. El PDF exporta el reporte con gráficos, KPIs y branding del tenant (logo configurado).
4. Los archivos exportados se generan en background; el usuario recibe notificación cuando el archivo está listo.
5. Los archivos exportados se almacenan en MinIO con enlace de descarga válido por 24 horas.
6. El historial de exportaciones está disponible en el panel de reportes por 30 días.

**Prioridad:** Media  
**Story Points:** 5

---

**Subtotal Epic 7: 5 HUs | 34 Story Points**

---

## Epic 8: Configuración Multi-tenant

> **Servicio:** `auth-service` + configuración de todos los servicios  
> **Descripción:** Gestión del tenant, integraciones externas, personalización y configuración operativa.

---

### HU-046: Configurar perfil e información de la empresa
**Epic:** Epic 8 — Configuración Multi-tenant  
**Título:** Panel de configuración general del tenant

**Historia:**  
Como **Admin**, quiero configurar la información de mi empresa en el sistema, para que aparezca correctamente en facturas, notificaciones y comunicaciones con clientes.

**Criterios de Aceptación:**
1. El Admin puede configurar: nombre de empresa, RUC, dirección, teléfono, email corporativo, logo y colores de marca.
2. El logo se almacena en MinIO y se aplica automáticamente a facturas PDF, emails y notificaciones.
3. Los cambios se aplican a futuros documentos; las facturas anteriores no se modifican.
4. La zona horaria del tenant es configurable (por defecto: `America/Guayaquil`).
5. Solo el rol `admin` puede modificar la configuración del tenant.

**Prioridad:** Alta  
**Story Points:** 3

---

### HU-047: Configurar integración con Evolution API (WhatsApp)
**Epic:** Epic 8 — Configuración Multi-tenant  
**Título:** Conectar número de WhatsApp del negocio

**Historia:**  
Como **Admin**, quiero configurar la integración de WhatsApp de mi negocio con Evolution API, para que todos los mensajes de mis clientes lleguen al sistema AutoFlow.

**Criterios de Aceptación:**
1. El Admin ingresa: URL de la instancia Evolution API, API Key, nombre de instancia y número de WhatsApp.
2. El sistema valida la conexión con Evolution API al guardar la configuración y muestra un indicador de estado (conectado/desconectado).
3. Una vez configurado, el sistema registra automáticamente el webhook de Evolution API para recibir mensajes (`EVOLUTION_WEBHOOK_URL`).
4. El Admin puede ver el estado de la conexión en tiempo real (online/offline) desde el panel de configuración.
5. Si la conexión se pierde, el sistema envía una notificación al Admin y registra el evento en `audit_logs`.
6. Los datos sensibles (API Key, webhook secret) se almacenan cifrados en la base de datos.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-048: Configurar Firebase Cloud Messaging (push notifications)
**Epic:** Epic 8 — Configuración Multi-tenant  
**Título:** Activar notificaciones push para la app móvil del tenant

**Historia:**  
Como **Admin**, quiero configurar Firebase Cloud Messaging para mi tenant, para que los empleados reciban notificaciones push en su app móvil de AutoFlow.

**Criterios de Aceptación:**
1. El Admin sube el archivo JSON del Service Account de Firebase y el Project ID de su proyecto Firebase.
2. El sistema valida las credenciales enviando una notificación de prueba al dispositivo del Admin.
3. Una vez configurado, todas las notificaciones push del tenant usan las credenciales de Firebase configuradas.
4. El Admin puede activar/desactivar las notificaciones push para el tenant completo.
5. El archivo JSON del Service Account se almacena cifrado y nunca se expone en el frontend.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-049: Configurar integración con Google Calendar (citas)
**Epic:** Epic 8 — Configuración Multi-tenant  
**Título:** Sincronizar agenda de citas con Google Calendar

**Historia:**  
Como **Admin**, quiero conectar el sistema de citas de AutoFlow con el Google Calendar de mi empresa, para que el equipo vea las reservas directamente en su calendario habitual.

**Criterios de Aceptación:**
1. El Admin autoriza la integración con Google Calendar a través del flujo OAuth2 o subiendo el JSON de un Service Account.
2. Se configura el Google Calendar ID del negocio (email delegado) que recibirá los eventos de citas.
3. Al conectar, el sistema sincroniza las citas existentes y confirmadas con Google Calendar.
4. Las nuevas citas, cancelaciones y reprogramaciones se sincronizan automáticamente.
5. El Admin puede desconectar la integración en cualquier momento; esto no elimina los eventos ya creados en Google Calendar.
6. Si la API de Google Calendar falla, la cita se crea igual en AutoFlow y la sincronización se reintenta automáticamente.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-050: Configurar automatizaciones con N8N
**Epic:** Epic 8 — Configuración Multi-tenant  
**Título:** Gestión de flujos automáticos de negocio

**Historia:**  
Como **Admin**, quiero configurar automatizaciones de negocio usando N8N, para que tareas repetitivas (seguimientos, recordatorios, actualizaciones) se ejecuten automáticamente.

**Criterios de Aceptación:**
1. El Admin accede a la interfaz de N8N desde AutoFlow con sus credenciales de tenant (SSO o enlace directo).
2. El sistema provee plantillas de flujos predefinidos: "Nuevo cliente → WhatsApp de bienvenida", "Pedido confirmado → Email de seguimiento", "Recordatorio de cita", etc.
3. Los flujos de N8N pueden dispararse por webhooks de AutoFlow (eventos RabbitMQ → webhook N8N).
4. El Admin puede activar/desactivar flujos sin eliminarlos.
5. Los logs de ejecución de los flujos son visibles desde el panel de automatizaciones.
6. N8N tiene acceso a las APIs de AutoFlow vía API Key de tenant (no credenciales de usuario individuales).

**Prioridad:** Media  
**Story Points:** 5

---

### HU-051: Configurar política de cancelación de citas
**Epic:** Epic 8 — Configuración Multi-tenant  
**Título:** Reglas de cancelación y no-show por tenant

**Historia:**  
Como **Admin**, quiero configurar la política de cancelación de citas de mi negocio, para establecer reglas claras sobre con cuánta anticipación se pueden cancelar y qué pasa con los no-shows.

**Criterios de Aceptación:**
1. El Admin configura: horas mínimas de anticipación para cancelar libremente (ej: 2 horas antes).
2. Se puede configurar si las cancelaciones tardías requieren autorización del Manager o se bloquean.
3. El Admin define si los no-shows se registran como penalización para el cliente.
4. Se puede configurar el mensaje automático que se envía al cliente cuando cancela.
5. Las políticas configuradas se aplican inmediatamente a nuevas reservas; las existentes respetan la política vigente al momento de reservar.
6. El sistema registra todas las cancelaciones con motivo y tiempo de anticipación para el reporte de métricas de citas.

**Prioridad:** Media  
**Story Points:** 3

---

### HU-052: Rate limiting y límites operativos del tenant
**Epic:** Epic 8 — Configuración Multi-tenant  
**Título:** Control de uso y límites de la plataforma por tenant

**Historia:**  
Como **Sistema/Admin de EGIT**, quiero configurar límites de uso por tenant, para garantizar la calidad del servicio para todos los clientes de la plataforma.

**Criterios de Aceptación:**
1. El sistema aplica rate limiting de 100 requests/minuto por tenant vía Redis en el API Gateway.
2. El Admin de EGIT puede configurar límites por plan: número máximo de usuarios, clientes en CRM, mensajes WhatsApp por mes y citas por mes.
3. Cuando un tenant alcanza el 80% de su límite mensual, el Admin del tenant recibe una notificación automática.
4. Al superar el límite, las requests retornan `429 Too Many Requests` con header `Retry-After`.
5. Los límites por tenant se configuran en la base de datos y se cachean en Redis para performance.
6. El Admin de EGIT tiene un panel maestro para ver el uso de todos los tenants.

**Prioridad:** Media  
**Story Points:** 5

---

**Subtotal Epic 8: 7 HUs | 37 Story Points**

---

## Epic 9: Facturación Electrónica (SRI Ecuador)

> **Servicio:** `invoicing-service` (Spring Boot + PostgreSQL + XML Digital Signature)  
> **Integración:** Servicios web del SRI (facturacion.sri.gob.ec) — Ambiente de Producción / Pruebas  
> **Descripción:** Generación, firma electrónica, envío y almacenamiento de comprobantes electrónicos conforme a la normativa del SRI de Ecuador. Incluye facturas, notas de crédito, notas de débito, comprobantes de retención, guías de remisión y liquidaciones de compras.

---

### HU-053: Generar factura electrónica con clave de acceso
**Epic:** Epic 9 — Facturación Electrónica (SRI Ecuador)  
**Título:** Generación de factura electrónica con clave de acceso de 49 dígitos

**Historia:**  
Como **facturador**, quiero generar una factura electrónica con su clave de acceso correspondiente, para cumplir con la normativa del SRI y entregar un comprobante válido al cliente.

**Criterios de Aceptación:**
1. El sistema genera la clave de acceso de 49 dígitos según la fórmula del SRI: código del tipo de comprobante (1) + número de serie del establecimiento (9) + punto de emisión (3) + secuencial (9) + código numérico (8) + fecha de emisión (8) + tipo de contribuyente (1) + RUC del emisor (13).
2. La clave de acceso es única por comprobante; el sistema valida duplicados antes de generar.
3. La factura incluye todos los campos obligatorios del SRI: datos del emisor (nombre, RUC, dirección, establecimiento, punto de emisión), datos del receptor (nombre, RUC/cédula, dirección), detalle de productos/servicios con precios, subtotal, IVA (12% o 15%), ICE (si aplica), IR (si aplica) y total.
4. El sistema calcula automáticamente los impuestos según la tarifa IVA vigente configurada por el tenant.
5. El secuencial de la factura es consecutivo y único por establecimiento + punto de emisión del tenant.
6. La factura se genera en estado `BORRADOR` antes de ser enviada al SRI.
7. El endpoint `POST /api/v1/invoices/generate` retorna la factura con clave de acceso y XML base.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-054: Enviar comprobante al SRI para autorización
**Epic:** Epic 9 — Facturación Electrónica (SRI Ecuador)  
**Título:** Envío de comprobante electrónico al Servicio de Rentas Internas

**Historia:**  
Como **facturador**, quiero enviar el comprobante electrónico al SRI para obtener su autorización oficial, para que la factura sea legalmente válida ante el fisco ecuatoriano.

**Criterios de Aceptación:**
1. El sistema envía el comprobante XML firmado electrónicamente al web service del SRI (`recepcioncomprobantes.sri.gob.ec`).
2. El endpoint del SRI se configura por ambiente: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline` (pruebas) y producción según corresponda.
3. El sistema espera la respuesta del SRI que incluye: estado (`AUTORIZADO`, `RECHAZADO`, `DEVUELTO`), número de autorización (si fue autorizado) y mensajes de error (si fue rechazado o devuelto).
4. Si el SRI retorna `RECHAZADO` o `DEVUELTO`, el sistema almacena los mensajes de error del SRI para que el usuario pueda corregir la factura y reenviar.
5. El sistema maneja reintentos automáticos con backoff exponencial (máximo 3 intentos) ante timeouts o errores de red del SRI.
6. Se registra timestamp de cada envío y respuesta en la tabla `invoice_sri_logs` para auditoría.
7. El endpoint `POST /api/v1/invoices/{id}/send-to-sri` ejecuta el envío y retorna el estado de la respuesta del SRI.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-055: Recibir y almacenar factura autorizada con número de autorización
**Epic:** Epic 9 — Facturación Electrónica (SRI Ecuador)  
**Título:** Almacenamiento del comprobante autorizado por el SRI

**Historia:**  
Como **sistema**, quiero recibir y almacenar la factura autorizada por el SRI con su número de autorización y ambiente, para mantener un registro legal de todos los comprobantes emitidos.

**Criterios de Aceptación:**
1. Al recibir respuesta `AUTORIZADO` del SRI, el sistema almacena: número de autorización, fecha/hora de autorización, ambiente (`1`=Pruebas, `2`=Producción), estado (`AUTORIZADO`) y el XML autorizado completo.
2. El comprobante autorizado se almacena en la tabla `authorized_invoices` con referencia al `invoice_id` del sistema.
3. El XML autorizado se guarda en MinIO bajo la ruta `invoices/{tenantId}/{year}/{month}/{claveAcceso}.xml`.
4. El estado de la factura en el sistema cambia de `ENVIADA` a `AUTORIZADA`.
5. La factura autorizada es inmutable: no puede ser editada ni eliminada después de autorizada.
6. El endpoint `GET /api/v1/invoices/{id}/authorized-xml` retorna el XML autorizado por el SRI.
7. El sistema notifica al tenant (notificación push y email) cuando la factura es autorizada.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-056: Generar XML firmado electrónicamente
**Epic:** Epic 9 — Facturación Electrónica (SRI Ecuador)  
**Título:** Firma digital del comprobante electrónico con certificado del emisor

**Historia:**  
Como **sistema**, quiero generar el XML del comprobante con firma electrónica del emisor, para cumplir con el requisito de autenticidad e integridad exigido por el SRI.

**Criterios de Aceptación:**
1. El sistema firma el XML del comprobante usando el certificado digital del emisor (PKCS#12, formato `.p12` o `.pfx`).
2. El certificado digital se almacena cifrado en el almacén de secrets del tenant; el Admin lo sube desde el panel de configuración.
3. La firma electrónica incluye: sello digital del emisor, fecha/hora de firma y algoritmo de firma (RSA-SHA256).
4. El XML firmado cumple con el esquema XSD oficial del SRI para el tipo de comprobante correspondiente.
5. El sistema valida la estructura del XML contra el XSD del SRI antes de firmar; rechaza comprobantes con errores de estructura.
6. El certificado digital tiene vigencia verificada; si está expirado, el sistema rechaza la firma con mensaje claro al usuario.
7. El endpoint `POST /api/v1/invoices/{id}/sign` genera el XML firmado y lo retorna.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-057: Generar nota de crédito electrónica
**Epic:** Epic 9 — Facturación Electrónica (SRI Ecuador)  
**Título:** Emisión de nota de crédito para anular o corregir una factura autorizada

**Historia:**  
Como **facturador**, quiero generar una nota de crédito electrónica vinculada a una factura autorizada, para anular total o parcialmente una factura cuando el cliente se lo solicita o hay un error.

**Criterios de Aceptación:**
1. La nota de crédito se genera con su propia clave de acceso según fórmula del SRI (tipo de comprobante = 4).
2. La nota de crédito vincula obligatoriamente la factura original (clave de acceso y número de autorización de la factura que corrige/anula).
3. La nota de crédito incluye: datos del emisor y receptor, motivo de la nota (ej: "Devolución", "Descuento", "Error en facturación"), detalle de los valores que se abonan y total de la nota.
4. La nota de crédito se envía al SRI para autorización siguiendo el mismo flujo que la factura (HU-054).
5. Si la nota es por anulación total, el sistema marca la factura original como `ANULADA` y genera un evento `invoice.voided` en RabbitMQ.
6. El secuencial de notas de crédito es independiente del de facturas, pero sigue la misma numeración consecutiva por establecimiento + punto de emisión.
7. El endpoint `POST /api/v1/invoices/{invoiceId}/credit-note` genera, firma y envía la nota de crédito al SRI en un solo flujo.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-058: Generar comprobante de retención electrónico
**Epic:** Epic 9 — Facturación Electrónica (SRI Ecuador)  
**Título:** Emisión de comprobante de retención en la fuente e IVA electrónico

**Historia:**  
Como **facturador**, quiero generar comprobantes de retención electrónicos, para cumplir con la obligación de retener impuestos al proveedor según la normativa del SRI.

**Criterios de Aceptación:**
1. El comprobante de retención se genera con su propia clave de acceso (tipo de comprobante = 7).
2. El comprobante vincula la factura retenida (clave de acceso) e incluye: período fiscal, valores retenidos, porcentaje de retención por cada impuesto (IR, IVA) y base imponible.
3. Los porcentajes de retención son configurables por el tenant según su tipo de contribuyente y actividad económica.
4. El comprobante incluye: datos del sujeto retenido (proveedor), datos del agente de retención (tenant), detalle de cada retención aplicada y total retenido.
5. El comprobante se firma electrónicamente y se envía al SRI para autorización.
6. El sistema calcula automáticamente los valores de retención según los porcentajes configurados y la base imponible de la factura.
7. El endpoint `POST /api/v1/invoices/{invoiceId}/withholding` genera el comprobante de retención para una factura dada.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-059: Cliente valida factura con código QR en web del SRI
**Epic:** Epic 9 — Facturación Electrónica (SRI Ecuador)  
**Título:** Generación de código QR para validación del comprobante por el cliente

**Historia:**  
Como **cliente**, quiero poder validar mi factura en la web del SRI escaneando un código QR, para verificar que el comprobante es auténtico y esté autorizado por el SRI.

**Criterios de Aceptación:**
1. El sistema genera un código QR con la URL de validación del SRI siguiendo la estructura: `https://verififact.sri.gob.ec/cgi-bin/cfaces/CeFacSWSPLE?cmp=` seguido de la clave de acceso del comprobante.
2. El código QR se incorpora en el PDF de la factura autorizada, en la esquina inferior derecha con tamaño mínimo de 3cm x 3cm.
3. El QR incluye la clave de acceso del comprobante; al escanearlo, el cliente es redirigido a la página de verificación del SRI con los datos del comprobante.
4. La página del SRI muestra: datos del emisor, datos del receptor, valores del comprobante, estado (`AUTORIZADO`), fecha de autorización y número de autorización.
5. El QR se genera después de recibir la autorización del SRI; no aparece en facturas en estado `BORRADOR`.
6. El sistema también genera un link URL directo (para enviar por WhatsApp/email) que abre la validación del SRI con un clic.
7. El endpoint `GET /api/v1/invoices/{id}/qr` retorna la imagen del código QR en formato PNG.

**Prioridad:** Alta  
**Story Points:** 5

---

**Subtotal Epic 9: 7 HUs | 50 Story Points**

---

## Epic 10: Configuración de Facturación Electrónica

> **Servicio:** `billing-config-service` (configuración del módulo de facturación electrónica)  
> **Descripción:** Configuración completa del contribuyente ante el SRI: datos del emisor, certificado de firma electrónica (.p12/.pfx), almacenamiento seguro de credenciales en HashiCorp Vault, proveedor de firma, generación de clave de acceso y gestión de ambientes (pruebas/producción).

---

### HU-060: Configurar datos del contribuyente
**Epic:** Epic 10 — Configuración de Facturación Electrónica

**Como** administrador de la empresa,
**quiero** ingresar y guardar los datos del contribuyente (RUC, razón social, nombre comercial, dirección, código de establecimiento, punto de emisión, tipo de contribuyente y ambiente SRI),
**para** que el sistema genere comprobantes electrónicos con la información fiscal correcta del emisor.

**Criterios de aceptación:**

1. El formulario de configuración fiscal incluye: RUC (13 dígitos), razón social (máx. 160 caracteres), nombre comercial, dirección matricial, código de establecimiento (3 dígitos), punto de emisión (3 dígitos), tipo de contribuyente (自然/jurídico/Contribuyente Especial) y ambiente SRI (prueba/producción).
2. El RUC se valida con el algoritmo de dígito verificador del SRI; muestra error si no cumple el formato.
3. La dirección y datos del receptor se codifican automáticamente en el XML del comprobante según el esquema del SRI.
4. Se puede actualizar cualquier dato fiscal y el sistema registra un log de auditoría con el usuario, fecha y valores anteriores/nuevos.
5. Los datos se persisten por tenant (multi-tenancy); cada empresa tiene su propia configuración fiscal.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-061: Subir y configurar certificado de firma electrónica (.p12/.pfx)
**Epic:** Epic 10 — Configuración de Facturación Electrónica

**Como** administrador de la empresa,
**quiero** subir mi archivo de certificado digital de firma electrónica (.p12 o .pfx) y registrar su contraseña,
**para** que el sistema pueda firmar digitalmente los comprobantes electrónicos antes de enviarlos al SRI.

**Criterios de aceptación:**

1. La interfaz permite subir archivos con extensión `.p12` o `.pfx` (máx. 5 MB) a través de un upload seguro (HTTPS).
2. El sistema valida que el archivo sea un keystore PKCS#12 válido: verifica la estructura interna y que contiene al menos un certificado y una clave privada.
3. Se solicita la contraseña del certificado en un campo enmascarado; la contraseña nunca se muestra en texto plano ni se almacena sin cifrar.
4. El sistema extrae y muestra la información del certificado: nombre del titular, RUC del titular, fecha de emisión, fecha de expiración y emisor del certificado.
5. Se muestra una alerta 60 días antes de la expiración del certificado y notifica al administrador vía email/WhatsApp.
6. Solo usuarios con rol **Admin** pueden subir o reemplazar certificados.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-062: Almacenar certificado y contraseña de forma segura en HashiCorp Vault
**Epic:** Epic 10 — Configuración de Facturación Electrónica

**Como** arquitecto de seguridad,
**quiero** que el certificado .p12 y su contraseña se almacenen exclusivamente en HashiCorp Vault (producción), Docker Secrets (staging) o `.env` cifrado local (desarrollo),
**para** garantizar que las credenciales de firma electrónica nunca se expongan en código fuente, base de datos o archivos de configuración no cifrados.

**Criterios de aceptación:**

1. En **producción**: el certificado y la contraseña se guardan como secrets en HashiCorp Vault con path `secret/data/billing/{tenant_id}/certificate` y `secret/data/billing/{tenant_id}/certificate_password`, con políticas de acceso restringidas por tenant.
2. En **staging**: se usan Docker Secrets con nombres `billing_cert_{tenant_id}` y `billing_cert_pass_{tenant_id}`, montados como volúmenes read-only en el contenedor.
3. En **desarrollo**: se permite `.env` local con cifrado AES-256; el archivo `.env` está en `.gitignore` y nunca se commitea.
4. El servicio lee las credenciales al iniciar y cachea en memoria con TTL de 1 hora; no se loguean, no aparecen en respuestas API, no se almacenan en la base de datos.
5. Existe un endpoint `POST /api/v1/billing/rotate-certificate` que permite rotar el certificado sin downtime (upload nuevo → validar → actualizar Vault → invalidar cache → log de auditoría).
6. Se cumple el ADR-002 v2.2 de gestión de secretos por fase.

**Prioridad:** Alta  
**Story Points:** 8

---

### HU-063: Seleccionar y configurar proveedor de firma electrónica
**Epic:** Epic 10 — Configuración de Facturación Electrónica

**Como** administrador de la empresa,
**quiero** seleccionar y configurar mi proveedor de firma electrónica (Banco Central del Ecuador, Security Data / SDS, ANF Ecuador, Ecuacert, GlobalSign o DigiCert),
**para** que el sistema utilice el endpoint y protocolo correctos para firmar los comprobantes electrónicos.

**Criterios de aceptación:**

1. El panel de configuración presenta una lista desplegable con los proveedores soportados: BCE, Security Data (SDS), ANF Ecuador, Ecuacert, GlobalSign y DigiCert.
2. Cada proveedor tiene configuraciones específicas predefinidas: URL de servicio de firma, protocolo (SOAP/REST), formato de request y timeout de conexión.
3. El sistema permite probar la conexión con el proveedor de firma mediante un botón "Validar conexión" que ejecuta una firma de prueba y muestra el resultado.
4. El proveedor seleccionado se almacena en la configuración del tenant y se usa automáticamente al generar comprobantes.
5. Se puede cambiar el proveedor en cualquier momento; el sistema conserva un historial de cambios con timestamp y usuario responsable.

**Prioridad:** Alta  
**Story Points:** 3

---

### HU-064: Generar clave de acceso de 49 dígitos según normativa SRI
**Epic:** Epic 10 — Configuración de Facturación Electrónica

**Como** sistema,
**quiero** generar automáticamente la clave de acceso de 49 dígitos para cada comprobante electrónico según el algoritmo definido por el SRI,
**para** que cada factura, nota de crédito, retención y guía de remisión cumpla con el estándar de identificación único del comprobante.

**Criterios de aceptación:**

1. La clave de acceso se genera con el formato: `Fecha (8) + RUC emisor (13) + Tipo de comprobante (2) + Serie (4) + Número secuencial (9) + Código numérico (8) + Tipo de emisión (1) + Dígito verificador (1) = 49 dígitos`.
2. El código numérico de 8 dígitos se genera aleatoriamente usando `SecureRandom` (no pseudoaleatorio simple).
3. El dígito verificador se calcula con el algoritmo módulo 11 definido por el SRI.
4. Cada clave de acceso es única; el sistema verifica unicidad antes de asignar (manejo de colisiones con reintento automático).
5. La clave de acceso se almacena con el comprobante y se incluye en el XML, el PDF y el código QR del comprobante.
6. El generador es un módulo standalone con cobertura de tests unitarios que validan el algoritmo contra claves de acceso de comprobantes de prueba del SRI.

**Prioridad:** Alta  
**Story Points:** 5

---

### HU-065: Configurar ambiente SRI (pruebas → producción) con credenciales correspondientes
**Epic:** Epic 10 — Configuración de Facturación Electrónica

**Como** administrador de la empresa,
**quiero** gestionar la transición del ambiente de pruebas al ambiente de producción del SRI con sus credenciales y configuraciones correspondientes,
**para** que la empresa pueda validar su integración en sandbox antes de emitir facturas electrónicas con validez legal.

**Criterios de aceptación:**

1. El sistema soporta dos ambientes: **Pruebas** (`https://celcer.sri.gob.ec/`) y **Producción** (`https://cel.sri.gob.ec/`) con URLs y certificados separados.
2. El ambiente se configura a nivel de tenant; el Admin puede cambiar de `PRUEBA` a `PRODUCCIÓN` pero la reversa requiere confirmación adicional y motivo documentada.
3. Credenciales de cada ambiente (usuario SRI, contraseña, certificado de firma) se almacenan por separado en Vault con paths distintos.
4. Al cambiar a producción, el sistema ejecuta una checklist de validación: certificado vigente (>30 días), RUC activo, punto de emisión registrado, conexión con receptor SRI exitosa.
5. Existe un indicador visual claro del ambiente actual (badge "PRUEBAS" en amarillo / "PRODUCCIÓN" en verde) visible en todas las pantallas de facturación.
6. Los comprobantes generados en ambiente de pruebas incluyen un sello "SOLO FINES DE PRUEBA — SIN VALOR TRIBUTARIO" en el PDF.

**Prioridad:** Alta  
**Story Points:** 5

---

**Subtotal Epic 10: 6 HUs | 31 Story Points**

---

## Resumen General

### Totales por Epic

| Epic | Nombre | # HUs | Story Points |
|------|--------|:-----:|:------------:|
| Epic 1 | Autenticación & Usuarios | 8 | 42 |
| Epic 2 | CRM (Clientes, Pipeline) | 7 | 34 |
| Epic 3 | Pedidos & Catálogo | 6 | 39 |
| Epic 4 | WhatsApp (Evolution API) | 6 | 33 |
| Epic 5 | Notificaciones (FCM + Email) | 5 | 27 |
| Epic 6 | Sistema de Citas (Google Calendar) | 8 | 47 |
| Epic 7 | Reportes & Dashboard | 5 | 34 |
| Epic 8 | Configuración Multi-tenant | 7 | 37 |
| Epic 9 | Facturación Electrónica (SRI Ecuador) | 7 | 50 |
| Epic 10 | Configuración de Facturación Electrónica | 6 | 31 |
| **TOTAL** | | **65** | **374** |

---

### Distribución por Prioridad

| Prioridad | # HUs | Story Points |
|-----------|:-----:|:------------:|
| 🔴 Alta | 48 | 284 |
| 🟡 Media | 15 | 78 |
| 🟢 Baja | 2 | 12 |
| **TOTAL** | **65** | **374** |

---

### Distribución por Story Points

| Story Points | # HUs |
|:------------:|:-----:|
| 13 | 0 |
| 8 | 20 |
| 5 | 23 |
| 3 | 14 |
| 2 | 0 |
| 1 | 0 |
| **Promedio** | **5.8 SP/HU** |

---

### Sugerencia de Sprints (2 semanas, velocidad estimada: 40-50 SP)

| Sprint | HUs sugeridas | SP |
|--------|--------------|:--:|
| Sprint 1 — Fundación | HU-001 a HU-008 (Epic 1 completo) + HU-046, HU-047 | ~50 |
| Sprint 2 — CRM Core | HU-009 a HU-015 (Epic 2 completo) + HU-048 | ~45 |
| Sprint 3 — Pedidos | HU-016 a HU-021 (Epic 3 completo) | ~39 |
| Sprint 4 — WhatsApp | HU-022 a HU-027 (Epic 4 completo) + HU-050 | ~38 |
| Sprint 5 — Notificaciones + Citas base | HU-028 a HU-032 + HU-033, HU-034, HU-035 | ~43 |
| Sprint 6 — Citas completo | HU-036 a HU-040 + HU-049, HU-051 | ~42 |
| Sprint 7 — Reportes + Config | HU-041 a HU-045 + HU-052 | ~39 |
| Sprint 8 — Facturación Electrónica (SRI) | HU-053 a HU-059 (Epic 9 completo) | ~50 |
| Sprint 9 — Configuración Facturación | HU-060 a HU-065 (Epic 10 completo) | ~31 |

**Estimación total: ~9 sprints (~18 semanas) para MVP completo**

---

*Documento generado por Maya (Project Manager, AutoFlow — EGIT Consultoría)*  
*Basado en ADR-001 v2.0 y ADR-002 v2.2*  
*Fecha: 2026-03-17*  
*Actualizado: 2026-03-17 — Epic 10 (Configuración de Facturación Electrónica) agregado*  
*Para revisión y aprobación de: Eduardo Guerra (CEO, EGIT)*
