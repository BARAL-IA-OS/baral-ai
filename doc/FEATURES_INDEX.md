# 📋 Baral AI — Índice Completo de Features
> **"No somos otro chat. Somos una plataforma de ACCIÓN."**

---

## Por qué Baral AI es diferente

| Lo que NO somos | Lo que SÍ somos |
|---|---|
| ❌ Otro ChatGPT / Claude | ✅ Motor de ejecución de acciones de negocio |
| ❌ "Chatea con un agente" | ✅ "Ejecuta una campaña en 3 clics" |
| ❌ El usuario copia el texto a otro lado | ✅ La plataforma envía el email directamente |
| ❌ Prompt vacío, sin guía | ✅ Onboarding obligatorio + flujo guiado |
| ❌ Lista confusa de sub-agentes | ✅ Dashboard de acciones claras tipo card |
| ❌ El usuario publica a mano | ✅ Baral ejecuta por ti |

---

## 🧠 El modelo mental en una frase

> **Baral no es un chat. Es un botón de "ejecuta esta acción de negocio por mí".**

Todo el producto gira en torno a un único bucle. Si el usuario entiende este bucle, entiende la plataforma entera:

```
   CONTEXTO          MATERIA PRIMA        ACCIÓN              CONTROL           RESULTADO
┌─────────────┐    ┌──────────────┐   ┌────────────┐   ┌──────────────┐   ┌────────────┐
│ Brand Brain │ →  │  Clientes    │ → │  Receta    │ → │  Apruebas    │ → │  Baral     │
│ (tu marca)  │    │  (CSV)       │   │ (la acción)│   │  el borrador │   │  ENVÍA     │
└─────────────┘    └──────────────┘   └────────────┘   └──────────────┘   └────────────┘
  lo configuras       lo subes          eliges 1 card     editas/apruebas    historial
  UNA vez             UNA vez           cada vez          cada vez           queda guardado
```

**Las "herramientas" del software = las 5 Recetas.** Eso es lo único que el usuario "ejecuta".
El Dashboard, el Historial, las Analíticas y el Onboarding **no son herramientas**: son el
envoltorio que hace que esas 5 acciones sean intuitivas de usar.

Lo que se vende no es "IA" ni "tokens", sino **acciones ejecutadas**: *"1 campaña enviada"*,
*"23 clientes reactivados"*.

---

## 🗺️ Secuencia del Usuario (8 pasos)

```
PASO 1 → Registro / Login
PASO 2 → Onboarding obligatorio (no se puede saltar)
            2A. Perfil de Empresa (Brand Brain)
            2B. Importar Base de Clientes (CSV)
PASO 3 → Dashboard de Acciones ("¿Qué quieres hacer hoy?" + 5 cards)
PASO 4 → Elegir una Receta / Acción
PASO 5 → Completar 2-4 parámetros guiados
PASO 6 → IA procesa (mensajes de progreso visibles)
PASO 7 → Preview editable → "Aprobar y Enviar" → Ejecución real
PASO 8 → Historial + Analíticas
```

> **Regla de oro de UX:** En cada pantalla el usuario sabe exactamente qué hacer y qué pasará después. Nunca una pantalla en blanco; siempre UN siguiente paso obvio.

---

## 🔷 SECCIÓN 1 — Onboarding

> *"Baral necesita conocer tu negocio antes de trabajar para ti"*

### 1.1 — Perfil de Empresa (Brand Brain)
**Responsable:** Jhamil (UI) · Omar (BD)

Formulario guiado de una sola página. El usuario completa estos campos **una sola vez** y la IA los usa en todas sus acciones automáticamente. Sin esto, no se puede usar la plataforma.

| Campo | Descripción | Ejemplo |
|---|---|---|
| Industria | Sector del negocio | "Estudio de fotografía" |
| Propuesta de valor | Qué hace única a la empresa | "Fotos naturales para familias modernas" |
| Tono de voz | Cómo habla la marca | "Cercano, emotivo, sin tecnicismos" |
| Público objetivo | A quién le vende | "Madres 28-40, nivel medio-alto" |
| Diferenciador | Por qué elegirla | "Sesiones en exteriores, entrega en 48h" |
| Prohibiciones | Lo que la IA NUNCA debe decir | "gratis, oferta, descuento, remate" |

**Experiencia UX:**
- Progress bar visible: `[■■■■□□] 67% completado`
- Botón desactivado hasta que todos los campos estén completos
- Tooltip en el campo "Prohibiciones": *"Palabras que van en contra del tono de tu marca"*

---

### 1.2 — Importación de Base de Clientes (CSV)
**Responsable:** Jhamil (UI) · Omar (parser backend)

El usuario sube un archivo CSV con su lista de clientes. La plataforma parsea, valida y almacena los datos.

**Columnas del CSV:**
- `nombre` ← obligatorio
- `email` ← obligatorio
- `ultima_compra` ← para filtros de reactivación y post-venta
- `producto` ← para personalización del copy
- `telefono` ← opcional

**Experiencia UX:**
- Zona de drag & drop para subir el archivo
- Botón "Descargar plantilla CSV" con el formato correcto
- Preview de los primeros 5 clientes antes de confirmar
- Mensaje de confirmación: *"43 clientes importados correctamente ✅"*

---

### 1.3 — Progress Bar de Setup + Pantalla de Confirmación
**Responsable:** Jhamil

Barra de progreso en la parte superior del onboarding que muestra en qué paso está el usuario. Al completar ambos pasos, pantalla de celebración:

> *"¡Listo! Baral conoce tu empresa y tiene 43 clientes listos. Ahora elige qué acción quieres ejecutar."*

Botón CTA grande: **"Ir al Dashboard →"**

---

### 1.4 — Bloqueo de Recetas si Onboarding Incompleto
**Responsable:** Jhamil (UI) · Omar (lógica)

Si el usuario no completó el onboarding, las ActionCards del dashboard se muestran visualmente pero con un candado y el mensaje:

> *"Para usar esta acción, primero completa tu perfil de empresa → [Completar ahora]"*

Nunca un error confuso. Siempre una instrucción accionable.

---

## 🔷 SECCIÓN 2 — Dashboard de Acciones

> *"No una lista. No un chat. Una central de mando."*

**Jerarquía de la pantalla (de arriba hacia abajo, en orden de importancia):**
Saludo → **Recetas (lo principal)** → Métricas (apoyo) → Actividad reciente.
El usuario debe ver primero QUÉ puede hacer, no números muertos.

### 2.1 — Saludo + Estado de la cuenta
**Responsable:** Jhamil (UI) · Omar (datos)

Cabecera que orienta al usuario apenas entra:

> *"Hola, [empresa] 👋 — Tienes 142 clientes listos · 0 campañas este mes"*

Da contexto inmediato sin obligar a leer métricas. Si aún no hay clientes, invita a importarlos.

---

### 2.2 — ActionCards Visuales (5 Recetas) — *bloque principal*
**Responsable:** Jhamil

Es **lo primero y más grande** de la pantalla, precedido del título guía
**"¿Qué quieres hacer hoy?"**. Cada card muestra:
- Ícono representativo de la acción
- Nombre de la Receta
- Descripción en 1-2 líneas ("Qué hace exactamente")
- Botón **"Ejecutar →"** prominente

Las 5 cards en el dashboard principal:
1. 🔄 Reactivar Clientes Inactivos
2. 👋 Campaña de Bienvenida
3. 📦 Seguimiento Post-Venta
4. 🚀 Lanzamiento de Producto
5. 📄 Propuesta Comercial Express

---

### 2.3 — Panel de Métricas (apoyo, fila compacta)
**Responsable:** Jhamil (UI) · Omar (endpoint)

**Debajo de las recetas**, en una sola fila compacta (no encima, no protagonista),
3 métricas de apoyo:
- **Campañas ejecutadas** este mes
- **Emails enviados**
- **Costo acumulado de IA** en USD

> El "Score promedio" del revisor NO va aquí — es ruido para el usuario de negocio. Vive en la página de Analíticas.

---

### 2.4 — Ejecuciones Recientes con Badge de Estado
**Responsable:** Jhamil

Al final, una lista compacta de las últimas 3-5 ejecuciones con:
- Tipo de Receta (ícono + nombre)
- Número de destinatarios
- Estado con color: `● COMPLETADA` · `● PROCESANDO` · `● FALLIDA`
- Tiempo relativo: "hace 2 horas" / "ayer"

**Estado vacío que guía:** si no hay campañas aún, mostrar
*"Ejecuta tu primera campaña arriba ↑"* en vez de un "0" muerto.

---

## 🧭 Navegación / Barra Lateral (Sidebar)

> *"El usuario nunca se pierde: la navegación está agrupada y preparada para crecer con los módulos futuros."*

**Responsable:** Jhamil (UI) · Omar (rutas + endpoints de las páginas nuevas)

Estructura agrupada del sidebar (chasis inspirado en SaleADS, identidad propia, **sin** lo de ads pagados):

```
[logo Baral AI]

Mi Empresa ▾          ← workspace (como "Mi Negocio" de SaleADS)
◷ Primeros pasos 2/3  ← onboarding persistente

✦ Mis Campañas    +   ← estrategias guardadas/activas (Feature A)
   ● Reactivación junio
   ● Bienvenida nuevos

EXPLORA
  Dashboard           ← "¿Qué quieres hacer hoy?"
  Biblioteca / Estudio ← assets generados (imágenes/infografías)
  Analíticas

DATOS
  Clientes            ← ver/gestionar la base importada
  Productos           ← catálogo (útil para Lanzamiento)
  Marca (Brand Brain) ← editar sin rehacer onboarding

⚙ Configuración
─────────────────
[avatar] Omar
```

**Notas:**
- **Clientes** (`/clients`), **Productos** (`/products`), **Marca** (`/brand`),
  **Biblioteca/Estudio** (`/studio`) y **Mis Campañas** (`/campaigns`) son páginas a crear
  de forma incremental; se documentan aquí como destino objetivo.
- La agrupación por secciones (EXPLORA, DATOS, y a futuro un grupo por módulo: Marketing,
  Finanzas, RRHH...) permite agregar módulos de forma aditiva sin rediseñar la navegación.
- ⚠️ Bug actual a corregir: el ítem "Configuración" del sidebar apunta a `/analytics`; debe
  ir a su propia ruta (`/settings`) o quedar deshabilitado hasta que exista.
- **No copiar de SaleADS:** "Comprar créditos", "Inversión USD/día", "Importe invertido",
  "Meta Campaign ID". Eso es pauta pagada en Meta Ads — Baral no corre anuncios pagados.

---

## 🔷 SECCIÓN 3 — Recetas de Acción (5 Recetas)

> *"Receta = Flujo completo de acción. El usuario elige y confirma. La IA hace el trabajo."*

### 3.1 — Reactivar Clientes Inactivos
**Responsable:** Omar (backend + IA) · Jhamil (UI)

**Qué hace:** Filtra clientes que no compraron en X días → IA genera un email personalizado por cliente → Se envían todos con un clic.

**Parámetros que pide:**
- Días sin compra para considerar "inactivo" (ej. 60)

**Personalización de la IA:**
- Usa el nombre real del cliente
- Menciona el producto que compró la última vez
- Calcula cuántos días lleva sin volver
- Adapta el tono y evita las palabras prohibidas

**Ejemplo de resultado:**
> *Asunto: "María, te extrañamos en Studio Foto..."*
> *Cuerpo: "Han pasado 45 días desde tus fotos de familia con nosotros..."*

---

### 3.2 — Campaña de Bienvenida
**Responsable:** Omar (backend + IA) · Jhamil (UI)

**Qué hace:** Detecta clientes nuevos (registrados en los últimos X días) → genera email de bienvenida personalizado → envío en bulk.

**Parámetros que pide:**
- Días desde el registro para considerar "nuevo" (ej. 7)

**Personalización:** Saludo con nombre, mención de la propuesta de valor de la empresa, próximo paso sugerido.

---

### 3.3 — Seguimiento Post-Venta
**Responsable:** Omar (backend + IA) · Jhamil (UI)

**Qué hace:** Detecta clientes que compraron hace X días → email de seguimiento personalizado → solicita opinión o sugiere siguiente compra.

**Parámetros que pide:**
- Días desde la última compra (ej. 7)

**Personalización:** Menciona el producto específico comprado, pregunta sobre la experiencia, ofrece un siguiente paso natural.

---

### 3.4 — Lanzamiento de Producto o Servicio
**Responsable:** Omar (backend + IA) · Jhamil (UI)

**Qué hace:** El usuario ingresa datos del nuevo producto → la IA genera contenido para múltiples canales.

**Parámetros que pide:**
- Nombre del producto / servicio
- Precio
- Fecha de lanzamiento
- Beneficio principal

**Output generado:**
- Copy para Instagram (máx. 150 caracteres + emojis + hashtags)
- Copy para Facebook (2-3 párrafos)
- Copy para LinkedIn (tono profesional)
- Email de anuncio a toda la base de clientes

---

### 3.5 — Propuesta Comercial Express
**Responsable:** Omar (backend + IA) · Jhamil (UI)

**Qué hace:** El usuario ingresa datos de un prospecto → la IA genera una propuesta comercial completa y estructurada.

**Parámetros que pide:**
- Nombre del prospecto / empresa
- Industria del prospecto
- Servicio a ofrecer
- Problema que resuelve

**Output generado (estructura):**
1. Problema identificado
2. Solución propuesta
3. Propuesta de valor diferenciada
4. Precio / inversión
5. Próximos pasos

Listo para enviar por email o exportar como PDF.

---

## 🔷 SECCIÓN 4 — Flujo de Aprobación y Ejecución

> *"La IA propone. El humano decide. Baral ejecuta."*

### 4.1 — Preview Editable por Secciones (Human Gate)
**Responsable:** Jhamil

El resultado de la IA se muestra en **secciones separadas editables**:
- Asunto del email `[✏️ Editar] [🔄 Regenerar sección]`
- Saludo `[✏️ Editar] [🔄 Regenerar sección]`
- Cuerpo `[✏️ Editar] [🔄 Regenerar sección]`
- Call to Action `[✏️ Editar] [🔄 Regenerar sección]`

El usuario puede regenerar solo una sección sin perder el resto. No es un textarea gigante de texto plano.

---

### 4.2 — Selector de Destinatarios
**Responsable:** Jhamil

Antes de aprobar, el usuario ve **exactamente quién va a recibir** la campaña:
- Lista expandible con nombre + email de cada destinatario
- Opción de eliminar individuos específicos
- Total visible: *"23 destinatarios seleccionados"*

---

### 4.3 — Botón "Aprobar y Enviar" → Ejecución Real
**Responsable:** Omar (ejecución) · Jhamil (UI)

Un botón grande y claro. Al presionarlo:
1. Estado cambia a `APPROVED → EXECUTING`
2. La plataforma envía los emails directamente vía **Resend API**
3. Cada email está personalizado con el nombre real del cliente
4. El estado actualiza a `COMPLETED` al terminar

**No hay "copiar al portapapeles". No hay "subir a Mailchimp". Baral lo ejecuta.**

---

### 4.4 — Confirmación Visual Post-Ejecución
**Responsable:** Jhamil (UI) · Omar (datos de envío)

Pantalla de resultado:
```
✅ ¡Campaña enviada!
23 emails enviados · 0 errores · $0.006 USD · Campaña guardada
[Ver en historial]    [Nueva campaña →]
```

---

### 4.5 — Ciclo de Estados Visible en UI
**Responsable:** Jhamil

Badge animado que muestra el estado actual de la tarea en tiempo real:

| Estado | Color | Animación |
|---|---|---|
| CREATED | Gris | Estático |
| PROCESSING | Azul | Pulso lento |
| PENDING_APPROVAL | Amarillo | Estático |
| APPROVED | Violeta | Estático |
| EXECUTING | Cyan | Pulso rápido |
| COMPLETED | Verde | ✅ Estático |
| FAILED | Rojo | ❌ Estático |

---

## 🔷 SECCIÓN 5 — Historial y Analíticas

### 5.1 — Historial de Campañas Ejecutadas
**Responsable:** Jhamil (UI) · Omar (BD)

Lista de todas las acciones ejecutadas. Por cada campaña:
- Tipo de Receta (ícono + nombre)
- Fecha y hora
- Número de destinatarios
- Badge de estado con color
- Costo en USD
- Botón "Ver detalle" → muestra el contenido exacto enviado

**Estado implementado (2026-07-03):**
- Historial rediseñado con cards por acción, filtros y resumen superior.
- Fuente unificada: recetas ejecutadas desde `tasks` + campañas generadas en Estudio desde `studio_campaigns`.
- Las recetas navegan a `/preview/:id`; las campañas de Estudio navegan a `/studio`.

---

### 5.2 — Panel de Analíticas
**Responsable:** Jhamil (UI) · Omar (endpoint `GET /api/analytics/summary`)

4 KPI cards principales:
- **Total campañas ejecutadas**
- **Total clientes alcanzados** (suma de destinatarios)
- **Costo total de IA** en USD
- **Tasa de aprobación sin edición** (% de campañas aprobadas tal cual)

Debajo: desglose por tipo de Receta (qué Receta se usa más) y el **score promedio** del agente revisor.

---

### 5.3 — Exportar Campaña
**Responsable:** Jhamil

Desde el historial, el usuario puede exportar cualquier campaña:
- **PDF** — formato de reporte profesional con logo y datos
- **CSV** — lista de destinatarios + contenido enviado

Útil para que el equipo BARAL presente reportes a sus clientes.

---

## 🔷 SECCIÓN 6 — Diferenciadores de UX

### 6.1 — Indicador de IA Procesando (Progreso Visible)
**Responsable:** Jhamil

Mientras la IA trabaja, el usuario ve mensajes dinámicos en vez de una pantalla en blanco:

```
🧠 Baral está trabajando...

✅ Leyendo el perfil de tu empresa
✅ Analizando 23 clientes inactivos
⏳ Generando email personalizado para María García...
⏳ Verificando tono de voz...

[████████████░░░░░░░] 68%
Costo estimado: ~$0.006 USD
```

---

### 6.2 — Indicador de Costo Antes de Ejecutar
**Responsable:** Jhamil (UI) · Omar (cálculo de tokens)

Antes del botón "Aprobar y Enviar", siempre visible:
> *"Esta campaña usará aprox. 1,200 tokens · Costo estimado: $0.004 USD"*

Transparencia total. El usuario sabe exactamente cuánto cuesta cada acción.

---

### 6.3 — LLM Fallback Automático
**Responsable:** Omar

Si OpenAI falla (error 429 o 500), el sistema cambia automáticamente a **Claude Haiku de Anthropic** sin que el usuario note nada. El demo nunca se cae frente a un cliente real.

```
OpenAI GPT-4o-mini  ──► Error 429/500
                              │
                              ▼ (automático, silencioso)
                    Claude Haiku (Anthropic)
```

---

### 6.4 — Personalización 1:1 por Cliente
**Responsable:** Omar

Cada email es diferente. No se envía el mismo mensaje a todos:
- Saluda con el **nombre real** del cliente
- Menciona el **producto específico** que compró
- Referencia los **días exactos** que lleva inactivo
- Adapta el tono según el Brand Brain

> *"Hola María, han pasado 45 días desde tus fotos de familia..."*
> *"Hola Carlos, notamos que hace 78 días que no nos visitas..."*

---

## 🔷 SECCIÓN 7 — Multicanal y Generación de Contenido

> *"Baral pasa de 'herramienta de email' a 'estudio de acciones de negocio'."*

Baral tiene **dos familias de acciones**. Distinguirlas mantiene el producto coherente:

| Familia | Canales | Qué hace Baral | Estado |
|---|---|---|---|
| **A. Mensajes a clientes** (1:1, a tu CSV) | **Email** | Genera + **ENVÍA de verdad** (Resend) | Fase 1 |
| | WhatsApp | Genera + preview (envío real después) | Fase 2 |
| **B. Contenido para redes** (1:muchos, público) | **Instagram · Facebook · TikTok** | Genera texto + imagen/infografía → **preview realista**. NO publica aún | Esta fase |

**Regla clave:** Email se manda; las redes por ahora **solo se generan y se previsualizan**.
La publicación directa en redes (OAuth + App Review de Meta/TikTok) es de una fase posterior.

### 7.1 — Generación de Multimedia
**Responsable:** Omar (servicio de IA) · Jhamil (UI)

La app genera, además del copy:
- **Imágenes** publicitarias con IA (modelo de imagen, ~$0.01–0.04 c/u)
- **Infografías** (imagen estructurada)
- **TikTok = carrusel/slideshow 9:16** de imágenes (sin generación de video IA en esta fase)

| Tipo | Estado | Nota |
|---|---|---|
| Texto / copy | ✅ Fase 1 | Ya lo hace el LLM |
| Imágenes / infografías | ✅ Esta fase | Modelo de imagen |
| Video IA | ⛔ Fase posterior | Caro/lento; se usa carrusel 9:16 mientras tanto |

### 7.2 — Vista Previa Realista por Canal (Studio)
**Responsable:** Jhamil (frontend puro)

Una pantalla que renderiza un **mockup igualito a cada red**, mostrando cómo quedaría la
campaña antes de usarla:

| Canal | Mockup |
|---|---|
| Email | Bandeja tipo Gmail/Outlook |
| WhatsApp | Burbuja de chat verde |
| Instagram | Post de feed (avatar, imagen cuadrada, caption, ♥) |
| Facebook | Post de muro |
| TikTok | Video vertical 9:16 con barra lateral de acciones |

La preview es un **componente aparte** (`SocialPreview.tsx`) en **formato celular a pantalla
completa** (ocupa todo el alto, sin scroll). Sin dependencias de backend nuevo (usa el `draft_content`).

### 7.3 — Roadmap de Canales

```
Fase 1 (ahora)  Email .................. genera + ENVÍA (Resend)
                IG/FB/TikTok ........... genera texto + imagen + PREVIEW
Fase 2          WhatsApp ............... genera + envía (Meta Cloud API)
Fase 3+         IG/FB/TikTok ........... publicación directa (OAuth + App Review)
```

### 7.4 — Flujo del Estudio (generar → lista → preview)
**Responsable:** Jhamil (UI) · Omar (pipeline de generación)

La página **Estudio** (`/studio`) es donde el usuario crea contenido. Layout de 2 columnas:

```
┌───────────────────────────────┬──────────────────────────┐
│  IZQUIERDA (genera + lista)    │  DERECHA (preview FIJA)   │
│                                │                          │
│  ¿Qué campaña quieres generar? │   [Email][WA][IG][FB][TT]│
│  ┌──────────────────────────┐ │   ┌────────────────────┐ │
│  │ prompt (textarea)        │ │   │  mockup de la red  │ │
│  └──────────────────────────┘ │   │  seleccionada      │ │
│              [✦ Generar]       │   │  (sticky al hacer  │ │
│                                │   │   scroll)          │ │
│  MIS CAMPAÑAS            (3)   │   └────────────────────┘ │
│  ● Sesiones de primavera       │                          │
│  ● 2x1 Día de la Madre         │                          │
│  ● Reactivación junio          │                          │
└───────────────────────────────┴──────────────────────────┘
```

**Comportamiento:**
- El usuario escribe un **prompt** describiendo la campaña y pulsa **"Generar campaña"**.
- Cada campaña generada se añade a **"Mis campañas"** — el usuario puede crear **varias**
  y alternar entre ellas. Cada una se puede eliminar.
- Al seleccionar una campaña, la **vista previa de la derecha** muestra su contenido en el
  canal elegido mediante un **selector desplegable** (Email/WhatsApp/Instagram/Facebook/TikTok).
- La preview es un **celular a pantalla completa** (un solo tamaño que siempre cabe, sin scroll).
- La lista "Mis campañas" tiene su **propio scroll**; el prompt queda fijo arriba.
- En pantallas angostas, la preview pasa arriba y la página scrollea normal.

**Estado implementado (2026-07-03):**
- `Studio.tsx` llama a `generateContent({ prompt, channels })` y `generateImage(mediaAlt)`.
- La imagen real se renderiza cuando el backend devuelve `image_url` o `image_b64`; si falla, se mantiene placeholder.
- Las campañas se guardan en Supabase (`studio_campaigns`) y sobreviven al recargar.
- Eliminar una campaña desde Studio también la elimina de Supabase.
- El Historial ya incluye estas campañas como acciones de tipo "Estudio".

---

## 📊 Tabla de Prioridades para la Demo

| # | Feature | Impacto Demo | Complejidad | Diferencia vs Vilma |
|---|---|---|---|---|
| 1.1 | Brand Brain | 🔥 Alto | Baja | Igual (Vilma lo tiene) |
| 1.2 | CSV Import | 🔥 Alto | Media | **Ventaja exclusiva** |
| 2.2 | ActionCards Dashboard | 💥 Muy alto | Baja | Superior UX |
| 3.1 | Reactivar Inactivos | 💥 Muy alto | Alta | **Ventaja exclusiva** |
| 4.1 | Preview Editable | 🔥 Alto | Media | Similar |
| 4.3 | Envío Real de Emails | 💥 Game changer | Alta | **Ventaja exclusiva** |
| 4.5 | Badge de Estado | 🎯 Diferenciador | Baja | No tiene Vilma |
| 5.2 | Panel de Analíticas | 🔥 Alto | Media | Ventaja |
| 6.1 | Progreso IA visible | 🔥 Alto | Baja | No tiene Vilma |
| 6.3 | Fallback LLM | 🛡️ Confiabilidad | Media | No tiene Vilma |
| 6.4 | Personalización 1:1 | 💥 Muy alto | Alta | **Ventaja exclusiva** |

---

*Baral AI — BARAL 2026 | Creado el 21 de junio de 2026*
*Actualizado el 30 de junio de 2026 — Equipo de 2 personas (Omar + Jhamil), Saul eliminado. Sección 2 (Dashboard) reordenada a jerarquía "recetas primero". Añadido el modelo mental del producto, el bloque de Navegación/Sidebar agrupada, y la Sección 7 (Multicanal + Generación de Contenido + Estudio con prompt → lista → preview fija).*
