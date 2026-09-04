# Plan de trabajo — Jhamil

## Baral AI · ADN del negocio y primeros pasos

**Responsable:** Jhamil  
**Área principal:** experiencia inicial, ADN del negocio, catálogo, recursos, Clientes 360 y navegación  
**Rama recomendada:** `feat/jhamil-business-dna`  
**Prioridad:** bloqueante para las herramientas creativas de Omar

---

## 1. Objetivo

Construir la fuente de contexto permanente de Baral AI. Un usuario nuevo debe poder registrar su negocio mediante su página web o mediante un asistente manual, revisar lo recopilado y entrar al producto con un ADN suficientemente completo para generar campañas, imágenes y documentos coherentes con su marca.

El resultado no debe sentirse como un formulario administrativo largo. Debe parecer un recorrido guiado, visual y conversacional, inspirado en las capturas de Business DNA: fondo oscuro, tarjetas grandes, navegación clara, edición por bloques y acento lila de Baral.

---

## 2. Alcance asignado

Jhamil es responsable de:

1. Crear el flujo de **Primeros pasos** para usuarios nuevos.
2. Bloquear el acceso al producto hasta completar el contexto mínimo obligatorio.
3. Crear la nueva sección lateral **ADN del negocio**.
4. Implementar las vistas **Resumen**, **Catálogo** y **Recursos**.
5. Extender la recopilación automática desde una página web.
6. Permitir recopilación manual mediante tarjetas, texto y dictado por voz.
7. Persistir y editar el contexto obtenido.
8. Entregar a Omar un contrato estable para consumir ADN, productos y recursos.
9. Evolucionar la pantalla actual de Clientes hacia un inventario comercial **Clientes 360**.

Fuera de su alcance: Campañas, Studio, Photoshoot, Brand Book y Auditoría. Jhamil debe crear sus accesos en la navegación si se acuerda, pero Omar implementa esas pantallas.

---

## 3. Experiencia para un usuario nuevo

### 3.1 Regla de entrada

Después de registro o primer inicio de sesión:

```text
Registro/Login
    → detectar onboarding_completed_at
    → Primeros pasos
    → revisión del ADN
    → confirmación
    → Dashboard de Baral AI
```

- Un usuario nuevo no debe llegar directamente al Dashboard.
- Un usuario existente con onboarding completo entra normalmente.
- Los pasos opcionales pueden omitirse; los campos esenciales no.
- El progreso se guarda después de cada paso para poder continuar luego.
- No usar únicamente `localStorage`: el estado debe persistirse en Supabase.

### 3.2 Pantalla inicial

Mostrar dos caminos equivalentes:

- **Tengo página web:** Baral analiza una URL y propone el ADN automáticamente.
- **Completar manualmente:** carrusel/asistente por secciones.

Debe quedar claro que el usuario siempre revisa y confirma los datos antes de guardarlos.

### 3.3 Camino automático por URL

El usuario introduce la URL de su empresa. La interfaz muestra progreso real por etapas:

1. Conectando con la página.
2. Leyendo identidad y oferta.
3. Detectando comunicación y audiencia.
4. Buscando logo, colores y tipografías.
5. Detectando contacto, ubicación y redes sociales.
6. Organizando productos o servicios encontrados.
7. Preparando la revisión.

Información que se debe intentar extraer:

- nombre comercial, descripción, industria y propuesta de valor;
- productos y servicios, categorías, descripciones, precios visibles e imágenes;
- público objetivo, beneficios, diferenciadores y palabras clave;
- tono, estilo de comunicación, frases frecuentes y llamados a la acción;
- logo, favicon, paleta de colores y tipografías detectadas;
- teléfonos, emails públicos, WhatsApp, dirección, ubicación y horarios;
- Instagram, Facebook, LinkedIn, TikTok, YouTube, X y otras redes;
- testimonios, preguntas frecuentes y señales de confianza;
- enlaces importantes: contacto, reservas, tienda, catálogo y cotización.

Cada dato automático debe guardar, cuando sea posible:

- `value`: valor detectado;
- `source_url`: página de donde salió;
- `confidence`: confianza alta, media o baja;
- `confirmed_by_user`: confirmación del usuario.

No presentar inferencias como hechos. Los valores con poca confianza se muestran como sugerencias editables.

### 3.4 Camino manual

Crear un carrusel o stepper de tarjetas con botones **Atrás**, **Siguiente** y **Guardar y continuar después**.

Cada paso debe incluir:

- explicación breve;
- ejemplo útil;
- textarea o campos estructurados;
- botón de micrófono para dictado;
- estado de guardado;
- validación clara sin mensajes técnicos.

Pasos recomendados:

1. Identidad del negocio.
2. Productos y servicios.
3. Propuesta de valor y diferenciadores.
4. Audiencia y mercado.
5. Personalidad, tono y estilo de comunicación.
6. Mensajes, CTA y palabras que deben evitarse.
7. Identidad visual: logo, colores y tipografías.
8. Ubicación, horarios y contacto.
9. Página web y redes sociales.
10. Testimonios y prueba social.
11. Revisión final.

El dictado debe estar disponible en cada sección textual, indicar cuándo escucha y permitir corregir el texto antes de avanzar.

---

## 4. Sección lateral “ADN del negocio”

Agregar un tercer grupo en la barra lateral actual:

```text
TRABAJO
  Dashboard
  Campañas
  Historial

ADN DEL NEGOCIO
  Resumen
  Catálogo
  Recursos

GESTIÓN
  Clientes
  Reportes y Analítica
```

Rutas recomendadas:

- `/adn` — resumen y detalles del negocio;
- `/adn/catalogo` — productos y servicios;
- `/adn/recursos` — imágenes, logos y materiales reutilizables;
- `/primeros-pasos` — onboarding inicial.

Jhamil es dueño de `Sidebar.tsx` durante esta entrega. Debe extraer la definición de navegación a un archivo como `src/config/navigation.ts` para que Omar agregue nuevas herramientas sin reescribir el componente.

---

## 5. Vista Resumen

Inspirada en las capturas “Your Business DNA”. Debe tener dos pestañas:

### Resumen de marca

- nombre del negocio y URL;
- logo principal y variantes;
- paleta de colores con códigos HEX;
- tipografías;
- industria, descripción y propuesta de valor;
- audiencia, tono, diferenciadores y restricciones.

### Detalles del negocio

- ubicación y sucursales;
- teléfono, WhatsApp y email;
- horarios;
- palabras clave;
- redes sociales;
- enlaces CTA;
- testimonios;
- enlaces de reserva, compra o cotización.

Cada tarjeta tendrá botón de edición, guardado independiente y confirmación visual. Evitar un único formulario gigante.

---

## 6. Vista Catálogo

Debe mostrar productos y servicios detectados o creados manualmente.

Funciones mínimas:

- agregar desde URL;
- agregar desde cero;
- editar, archivar y eliminar;
- nombre, categoría, descripción, precio opcional y CTA;
- imagen principal y galería;
- etiqueta `producto` o `servicio`;
- búsqueda y filtro;
- selector para marcar elementos destacados.

Cada elemento debe poder ser seleccionado posteriormente desde Campañas y Photoshoot.

---

## 7. Vista Recursos

Biblioteca visual reutilizable por las herramientas de Omar.

Debe admitir:

- subida múltiple de imágenes;
- importación desde URL;
- logos, productos, fotografías, fondos, referencias y piezas anteriores;
- miniaturas y vista ampliada;
- título, descripción, etiquetas y tipo de recurso;
- selección múltiple;
- eliminar o archivar;
- origen y fecha de carga.

Formatos iniciales: PNG, JPG, JPEG y WebP. Validar tipo y tamaño tanto en frontend como en backend. Los recursos deben almacenarse en Supabase Storage con rutas por usuario y políticas privadas; no crear un bucket público general.

---

## 8. Tarea adicional — Clientes 360

La pantalla actual de `Clientes.tsx` ya permite listar, buscar, importar CSV y eliminar, pero todavía funciona como una tabla básica. Jhamil debe convertirla en un inventario comercial ligero que conecte los datos de clientes con las campañas, sin intentar construir un CRM empresarial completo.

### 8.1 Objetivo de producto

Que el usuario pueda entender a quién tiene en su base, corregir sus datos, crear segmentos útiles y entregar a Campañas una audiencia seleccionada. ADN del negocio explica **quién es la marca**; Clientes 360 explica **con quién se comunica**.

### 8.2 Funciones mínimas

- tablero inicial con total, activos, inactivos, nuevos y sin datos de contacto;
- tabla responsive con búsqueda, filtros, orden y selección múltiple;
- alta manual y edición de un cliente, además de la importación CSV existente;
- ficha lateral o página de detalle con contacto, producto/interés, última compra, origen, etiquetas y notas;
- estados configurables: `nuevo`, `activo`, `inactivo`, `VIP` y `no_contactar`;
- etiquetas y segmentos guardados por producto, fecha de compra, estado y origen;
- importador CSV en tres pasos: cargar, mapear columnas y revisar antes de confirmar;
- detección de duplicados por email/teléfono con opciones de omitir o actualizar;
- resumen final de importación: creados, actualizados, omitidos y errores descargables;
- acción **Crear campaña con este segmento**, que entregue los IDs o el filtro guardado al módulo de Omar;
- exclusión obligatoria de clientes `no_contactar` en cualquier audiencia.

### 8.3 Datos recomendados

Conservar compatibilidad con la tabla `clients` actual y ampliarla mediante migraciones versionadas:

- nombre, email y teléfono;
- empresa opcional;
- producto o interés;
- origen del contacto;
- estado del ciclo de vida;
- fecha y monto de última compra, cuando existan;
- etiquetas;
- notas internas;
- consentimiento/estado de contacto;
- fechas de creación y actualización.

Los campos nuevos deben ser opcionales para no romper los CSV ni las campañas existentes. No almacenar datos sensibles que no sean necesarios para marketing.

### 8.4 Contrato con Campañas

Exponer funciones tipadas como:

```ts
getClients(filters, pagination)
createClient(input)
updateClient(clientId, input)
previewClientImport(file, mapping)
confirmClientImport(importId)
getClientSegments()
saveClientSegment(input)
getSegmentRecipients(segmentId)
```

Jhamil entrega la selección/segmentación; Omar consume el segmento y aplica validaciones finales antes de generar o enviar una campaña.

La responsabilidad de Jhamil en esta entrega es la experiencia frontend, los estados de interfaz y la definición del contrato. Las migraciones y endpoints que afecten el pipeline actual se coordinan y revisan con Omar antes de integrarse.

---

## 9. Modelo de datos y contrato para Omar

Reutilizar `brand_brain` para conservar compatibilidad, pero dejar de tratarlo como seis textos aislados. Crear migraciones versionadas para los nuevos campos/tablas.

Entidades recomendadas:

- `brand_brain`: identidad, comunicación, audiencia, presencia digital y progreso;
- `catalog_items`: productos y servicios;
- `brand_assets`: logos, imágenes y referencias;
- `business_locations`: ubicación, contacto y horarios;
- `social_links`: redes sociales;
- `brand_sources`: URL, fuente y confianza de datos extraídos.

Entregar un tipo compartido `BusinessDNA` y funciones estables:

```ts
getBusinessDNA()
saveBusinessDNASection(section, value)
getCatalogItems()
getBrandAssets()
getOnboardingProgress()
completeOnboarding()
```

Omar no debe leer directamente componentes internos de Jhamil; debe consumir estos contratos.

---

## 10. Dirección visual obligatoria — tema “Baral Eclipse”

La composición toma como referencia las capturas entregadas: fondo gris carbón, sidebar fija, superficies diferenciadas, tarjetas amplias, iconos lineales y acciones redondeadas. El color oscuro fue medido directamente de la captura y no debe sustituirse por negro puro ni por azul-violeta.

El tema del producto se llamará **Baral Eclipse**. La base es neutral y el lila aporta la identidad operativa de Baral. El turquesa y azul de la web corporativa se mantienen como acentos secundarios. No se usa el verde amarillento de la referencia.

### 10.1 Paleta definitiva

```css
/* Neutros medidos de la referencia */
--baral-bg-canvas: #1b1b1b;
--baral-bg-sidebar: #1b1b1b;
--baral-surface-1: #282a2c;
--baral-surface-2: #333537;
--baral-surface-brand: #342d43;
--baral-border: #414346;
--baral-border-soft: #343638;

/* Marca y estados */
--baral-primary: #a77bff;
--baral-primary-hover: #b99cff;
--baral-primary-strong: #8600ef;
--baral-primary-soft: #d9ccff;
--baral-cyan: #2cffc0;
--baral-blue: #118dff;
--baral-success: #38d9a9;
--baral-warning: #f6c86b;
--baral-danger: #ff6b8a;

/* Contenido */
--baral-text: #e5e3d9;
--baral-text-strong: #f7f5ef;
--baral-text-muted: #a6a7a1;
--baral-text-disabled: #737571;

/* Uso restringido */
--baral-gradient-brand: linear-gradient(160deg, #2cffc0 0%, #118dff 45%, #8600ef 100%);
--baral-gradient-action: linear-gradient(135deg, #8600ef 0%, #118dff 100%);
--baral-focus-ring: 0 0 0 3px rgba(167, 123, 255, 0.28);
```

Distribución cromática recomendada:

- 70 % `#1B1B1B`: lienzo, sidebar y espacios de descanso;
- 22 % `#282A2C`/`#333537`: tarjetas, paneles, campos y modales;
- 6 % lila: navegación activa, CTA, selección y foco;
- 2 % turquesa/azul: IA, progreso, estado positivo y datos destacados.

El gradiente corporativo se usa únicamente en hero, CTA especial, avatar del agente o pequeños indicadores de IA. No rellenar cada tarjeta con gradientes.

### 10.2 Tema oficial

La interfaz oscura es el tema predeterminado del MVP. Un tema claro puede añadirse después de consolidar los componentes; no debe construirse en paralelo ni retrasar esta entrega.

Jhamil crea los tokens, primitivas (`Button`, `Card`, `Input`, `Textarea`, `Modal`, `Badge`, `Tooltip`) y el shell compartido. Omar debe reutilizarlos.

---

## 11. Plan de rediseño visual completo

### 11.1 Problemas detectados en la interfaz actual

- El bloque “Hola, Baral” ocupa demasiado espacio y no conduce a una acción principal.
- Las cinco recetas compiten visualmente y forman una fila demasiado comprimida.
- Hay demasiados colores decorativos distintos entre cards, iconos y gráficas.
- El dashboard mezcla saludo, recetas, métricas, estrategias e historial sin una jerarquía dominante.
- Los textos descriptivos son largos para tarjetas de acción rápida.
- El sidebar actual tiene dos estilos superpuestos y demasiadas reglas repetidas.
- `App.css` supera las 5.800 líneas y contiene versiones duplicadas de sidebar, dashboard, temas y responsive; seguir agregando overrides producirá inconsistencias.
- Inputs, modales, tablas y estados vacíos no comparten una única escala de altura, padding y radio.
- La versión móvil convierte el sidebar en una barra superior saturada; debe ser un drawer real.

### 11.2 Principios de diseño

1. **Una acción dominante por pantalla.** El usuario debe saber qué puede hacer en menos de tres segundos.
2. **Densidad cómoda.** Menos altura decorativa, más espacio útil y descripciones de máximo dos líneas.
3. **Jerarquía por tamaño y contraste.** No depender de cinco colores distintos para diferenciar acciones.
4. **Superficies, no sombras.** En el tema oscuro la profundidad se crea con `#1B1B1B`, `#282A2C`, `#333537` y bordes; las sombras son mínimas.
5. **Identidad controlada.** Lila para interactuar; turquesa para IA/estado; el resto permanece neutral.
6. **Consistencia funcional.** El mismo botón, input, card y modal se reutiliza en todas las páginas.
7. **Movimiento útil.** Animaciones cortas para orientar, nunca para decorar constantemente.

### 11.3 Retícula y medidas globales

```css
--sidebar-width: 264px;
--sidebar-collapsed-width: 72px;
--content-max-width: 1280px;
--page-padding-x: clamp(20px, 3vw, 40px);
--page-padding-y: 32px;
--section-gap: 28px;
--card-gap: 16px;
--control-height: 42px;
--control-height-sm: 34px;
--radius-control: 12px;
--radius-card: 16px;
--radius-panel: 20px;
```

- El contenido nunca debe pegarse al sidebar ni a los extremos del viewport.
- La anchura útil se centra con `max-width: 1280px`.
- Usar una retícula de 12 columnas en desktop, 8 en tablet y 4 en móvil.
- Separación interna de cards: 18–20 px; cards densas: 14–16 px.
- Separación entre título y contenido: 16 px; entre secciones: 28–32 px.
- Ninguna card informativa debe crecer solo para igualar artificialmente la altura de otra.

Breakpoints de validación:

- `>= 1440 px`: escritorio amplio;
- `1024–1439 px`: laptop;
- `768–1023 px`: tablet;
- `< 768 px`: móvil con drawer;
- revisar explícitamente 1440×900, 1280×800, 768×1024 y 390×844.

### 11.4 Escala tipográfica

Usar **Inter** para toda la interfaz. Se puede usar **Instrument Serif** únicamente en títulos editoriales de ADN, Campañas, Photoshoot y Brand Book; Dashboard, tablas, formularios y navegación permanecen en Inter.

```css
--font-display: clamp(32px, 3vw, 44px); /* solo páginas creativas */
--font-page-title: 26px;
--font-section-title: 20px;
--font-card-title: 15px;
--font-body: 14px;
--font-body-sm: 13px;
--font-label: 12px;
--font-caption: 11px;
```

- H1 de Dashboard: 26 px/32 px, peso 700; eliminar el saludo gigante.
- Título editorial creativo: máximo 44 px en desktop y 32 px en móvil.
- Texto normal: 14 px/21 px; no usar menos de 12 px para información importante.
- Etiquetas uppercase: 11 px, peso 700, tracking `0.08em`.
- Títulos y valores usan `letter-spacing: -0.02em`; párrafos no.
- Los párrafos dentro de cards se limitan a dos o tres líneas.

### 11.5 Sidebar

- Fondo exacto `#1B1B1B`, borde derecho `#343638`.
- Anchura 264 px; colapsada 72 px.
- Cabecera de marca de 64 px y navegación con items de 40 px.
- Iconos Lucide de 18 px, `strokeWidth={1.75}`; icon button de 34×34 px.
- Labels de navegación a 14 px/600; encabezados de grupo a 11 px/700.
- Item activo con fondo `#A77BFF`, texto/icono `#1B1622`; no usar gradiente.
- Hover con `#282A2C`; foco con `--baral-focus-ring`.
- La tarjeta grande “Configuración 3/3” se reemplaza por una fila compacta de 40 px con anillo de progreso y tooltip.
- Perfil y ajustes permanecen anclados al pie.
- En móvil: botón menú en header y drawer de 288 px con overlay; no convertir toda la navegación en una fila horizontal.

### 11.6 Componentes base

#### Cards y paneles

- Card estándar: `#282A2C`, borde `#3A3C3E`, radio 16 px, padding 18 px.
- Panel elevado/modal: `#333537`, borde `#46484B`, radio 20 px.
- Card seleccionable: hover `translateY(-2px)`, borde lila tenue y transición de 180 ms.
- Card activa: borde `#A77BFF`, fondo `#342D43`.
- Evitar sombras negras grandes; usar como máximo `0 12px 32px rgba(0,0,0,.22)` en modales.

#### Botones

- Primario: 42 px de alto, fondo `#A77BFF`, texto oscuro, padding horizontal 16 px, radio 12 px.
- Secundario: fondo `#333537`, borde `#494B4E`, texto claro.
- Ghost: fondo transparente; hover `#282A2C`.
- Pills de filtros: 34 px de alto y radio completo.
- Botón con icono: 36×36 px; icono de 17–18 px.
- No tener más de un botón primario visible en el mismo bloque.

#### Campos de texto

- Altura de input/select: 42 px.
- Fondo `#222426`, borde `#3F4144`, radio 12 px.
- Padding horizontal 14 px; texto 14 px; placeholder `#7F817D`.
- Focus: borde `#A77BFF` y `--baral-focus-ring` sin cambiar el tamaño del componente.
- Textarea normal: mínimo 112 px; compositor de Campañas: 128–148 px.
- Labels siempre fuera del campo; helper/error debajo a 12 px.
- Micrófono dentro del campo como icon button de 36 px, con estado escuchando y texto accesible.

#### Modales

- Ancho pequeño 440 px, estándar 640 px, flujo visual 760–880 px.
- Alto máximo `min(760px, 88vh)` con scroll únicamente en el cuerpo.
- Header y footer fijos dentro del modal; acciones alineadas a la derecha.
- Overlay `rgba(0,0,0,.64)` con blur máximo de 4 px.
- No usar animación elástica; entrada con opacidad y escala `0.98 → 1` en 180 ms.

#### Tablas y listas

- Header de tabla 12 px/700, altura 40 px.
- Filas de 52–56 px con separadores, no cards individuales para cada fila.
- Acciones secundarias aparecen al hover o en menú contextual.
- En móvil cada fila se transforma en card compacta, no en tabla con scroll horizontal infinito.

#### Iconografía y datos

- Conservar `lucide-react`; no mezclar familias de iconos.
- Tamaños permitidos: 16 px inline, 18 px navegación, 20 px acciones, 24 px estados vacíos.
- Ilustraciones grandes solamente en onboarding, estado vacío o Photoshoot.
- Gráficas con una línea primaria lila y una secundaria turquesa; no asignar un arcoíris a cada KPI.

### 11.7 Nuevo Dashboard

Eliminar el banner grande “Hola, Baral”. El saludo puede aparecer como texto secundario pequeño, pero el título debe ser directo: **Dashboard**.

Estructura de escritorio:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Dashboard                         [Buscar] [Crear campaña] [Perfil]│
├──────────────────────────────────────────┬───────────────────────┤
│ ¿Qué quieres crear hoy?                  │ ADN del negocio       │
│ Campo breve + 3 acciones recomendadas    │ 78 % · completar      │
├──────────────┬──────────────┬────────────┬───────────────────────┤
│ Campañas     │ Completadas  │ Costo IA   │ Score promedio        │
├──────────────────────────────────────────┬───────────────────────┤
│ Actividad reciente                       │ Estrategias guardadas │
└──────────────────────────────────────────┴───────────────────────┘
```

Reglas del Dashboard:

- Header compacto de máximo 64 px, sin card ni gradiente de fondo.
- CTA principal **Crear campaña** visible arriba a la derecha.
- Bloque principal de 8 columnas: entrada directa “¿Qué quieres crear hoy?” y tres accesos rápidos.
- Panel ADN de 4 columnas con porcentaje, datos faltantes y una sola acción.
- Las cinco recetas dejan de ser cinco cards verticales gigantes. Mostrar tres sugerencias relevantes; el resto vive en “Ver todas”.
- Cada acción rápida mide aproximadamente 160–190 px de alto en desktop y muestra título más descripción de dos líneas.
- KPIs en cuatro cards de 92–104 px; valor, variación real y micrográfica solo cuando haya serie histórica.
- Si no existe una serie histórica, no dibujar una gráfica decorativa falsa.
- Actividad reciente ocupa 8 columnas; Estrategias guardadas, 4 columnas.
- Estados vacíos reducidos, con una explicación y una acción; no llenar media pantalla.

### 11.8 Aplicación por pantalla

#### Login y registro

- Trasladar la pantalla actual al tema carbón.
- Panel visual izquierdo `#1B1B1B`; formulario en card `#282A2C` de máximo 440 px.
- Conservar una sola promesa corta y el logo; reducir el mockup decorativo en laptops.
- Inputs y botones usan las primitivas compartidas.

#### Primeros pasos y ADN

- Contenedor central máximo 960 px.
- Título editorial y progreso compacto superior.
- Dos cards iniciales equivalentes: analizar URL o completar manualmente.
- Formularios por bloques, no una página interminable.
- Resumen, Catálogo y Recursos usan el mismo patrón visual de tabs, cards y estados vacíos.

#### Campañas y Studio

- Compositor central máximo 880 px, con prompt, micrófono y pills dentro de una sola superficie.
- Sugerencias en grid de tres columnas; imagen protagonista y texto corto.
- En Studio separar controles de edición y preview; el preview debe recibir el espacio principal.
- Mobile alterna entre pestañas **Editar** y **Vista previa**.

#### Clientes 360

- Header con título, contador y CTA Importar/agregar.
- Barra de búsqueda y filtros en una sola fila de 42 px.
- Tabla dentro de un panel, con ficha del cliente en drawer lateral.
- KPIs de clientes como franja compacta, no como un segundo dashboard.

#### Historial y Analítica

- Filtros persistentes arriba y resultados debajo.
- Historial usa filas densas con estado; Analítica usa máximo dos colores de datos por gráfico.
- Evitar cards anidadas dentro de otras cards cuando un separador sea suficiente.

#### Perfil y configuración

- Navegación secundaria por tabs.
- Formularios con ancho máximo 720 px y footer de acciones estable.
- Acciones peligrosas aisladas visualmente al final.

### 11.9 Librerías recomendadas

No migrar todo el proyecto a otro framework visual. Sobre React/Vite actual:

- **Lucide React:** conservar para todos los iconos.
- **Radix UI:** Dialog, Dropdown Menu, Tabs, Tooltip y Select accesibles, estilizados con tokens propios.
- **TanStack Table:** para Clientes 360 e Historial cuando se implementen filtros, orden y paginación.
- **Recharts:** para Analítica cuando existan series reales; eliminar micrográficas falsas.
- **Motion:** opcional para transiciones de página y cards; cargar solo después de consolidar el layout.

No añadir una librería solo para un componente que puede resolverse con CSS. Registrar cada dependencia nueva y su uso.

### 11.10 Arquitectura CSS obligatoria

Dividir el CSS antes del rediseño:

```text
src/styles/
  tokens.css
  base.css
  layout.css
  utilities.css
  components/
    button.css
    card.css
    form.css
    modal.css
    table.css
  features/
    dashboard.css
    onboarding.css
    business-dna.css
    campaigns.css
    clients.css
    analytics.css
```

- `index.css` importa tokens y base.
- Cada selector tiene una única fuente de verdad.
- No agregar nuevas “correcciones finales” al final de `App.css`.
- Migrar pantalla por pantalla y borrar las reglas antiguas únicamente después de verificar equivalencia.
- Evitar `!important`, colores HEX aislados y tamaños no tokenizados.

### 11.11 Movimiento y estados

- Hover/focus: 160–180 ms.
- Apertura de drawer/modal: 180–220 ms.
- Skeleton en cargas mayores a 300 ms.
- Feedback optimista solo cuando la operación sea reversible.
- Respetar `prefers-reduced-motion`.
- Diseñar loading, empty, error, success, disabled y permisos insuficientes para cada módulo.

### 11.12 Criterios de aceptación visual

- [ ] El fondo visible de la aplicación es `#1B1B1B` en todas las rutas protegidas.
- [ ] Sidebar y lienzo comparten el gris carbón y se separan mediante borde, no mediante negro puro.
- [ ] Todas las cards usan la escala `#282A2C`/`#333537`.
- [ ] Dashboard ya no contiene el banner grande “Hola, Baral”.
- [ ] Existe una sola acción visual dominante en el primer viewport.
- [ ] Ningún texto o control importante usa menos de 12 px.
- [ ] Inputs, botones, cards, modales y tablas provienen de primitivas compartidas.
- [ ] No existen micrográficas con datos inventados.
- [ ] No se mezclan familias de iconos.
- [ ] Focus, contraste y navegación por teclado cumplen WCAG AA.
- [ ] No hay overflow horizontal en 390 px.
- [ ] Se verifican capturas en los cuatro tamaños definidos.
- [ ] Las rutas actuales siguen funcionando durante la migración visual.

---

## 12. Orden de implementación

### Entrega 1 — Limpieza y base visual

- separar `App.css` y eliminar duplicación de estilos;
- tokens Baral Eclipse con fondo `#1B1B1B`;
- primitivas compartidas y estados;
- configuración central de navegación;
- tipos `BusinessDNA`, `CatalogItem` y `BrandAsset`;
- migraciones SQL y Storage.

### Entrega 2 — Shell y Dashboard

- sidebar desktop, colapsada y drawer móvil;
- header compacto;
- nuevo Dashboard sin hero de saludo;
- layout responsive y pruebas visuales.

### Entrega 3 — Primeros pasos

- gate de usuario nuevo;
- selección URL/manual;
- wizard manual con micrófono;
- extracción automática con revisión;
- progreso persistente.

### Entrega 4 — ADN del negocio

- Resumen;
- Detalles;
- Catálogo;
- Recursos;
- edición y estados vacíos.

### Entrega 5 — Clientes 360

- alta y edición manual;
- importación con mapeo, revisión y deduplicación;
- ficha de cliente, etiquetas y estados;
- filtros y segmentos guardados;
- contrato de audiencia para Campañas.

### Entrega 6 — Integración

- exponer contratos para Omar;
- pruebas responsive y accesibilidad;
- pruebas con usuario nuevo y existente;
- documentación de endpoints y tablas.

---

## 13. Criterios de aceptación

- [ ] Un usuario nuevo siempre entra a Primeros pasos.
- [ ] Puede completar el ADN con URL o manualmente.
- [ ] Cada paso textual admite escritura y dictado.
- [ ] El progreso sobrevive a recargas y cambio de dispositivo.
- [ ] El usuario revisa y corrige lo extraído antes de confirmarlo.
- [ ] La barra lateral incluye ADN del negocio con tres vistas funcionales.
- [ ] Resumen muestra identidad, comunicación, visuales y datos operativos.
- [ ] Catálogo permite CRUD de productos y servicios.
- [ ] Recursos permite cargar y administrar imágenes privadas.
- [ ] Clientes permite alta, edición, búsqueda, filtros y ficha individual.
- [ ] El importador permite mapear columnas y revisar duplicados antes de guardar.
- [ ] Se pueden guardar segmentos y enviarlos a Campañas sin incluir `no_contactar`.
- [ ] Omar puede obtener ADN, catálogo y recursos mediante contratos tipados.
- [ ] No se rompe el Brand Brain ni el onboarding existente durante la migración.
- [ ] La interfaz coincide con la dinámica visual oscura de las referencias.
- [ ] TypeScript, lint y build pasan.

---

## 14. Riesgos que Jhamil debe evitar

- No duplicar `brand_brain` en otro perfil incompatible.
- No guardar imágenes grandes como base64 en PostgreSQL.
- No depender de `localStorage` para datos de negocio.
- No afirmar que un dato automático es correcto sin revisión del usuario.
- No permitir URLs internas o privadas en el extractor; aplicar protección SSRF.
- No almacenar recursos de clientes en buckets públicos.
- No bloquear el onboarding por campos secundarios como testimonios o redes.
- No convertir Clientes 360 en un CRM de ventas completo en esta fase.
- No sobrescribir duplicados del CSV sin vista previa y decisión explícita.
- No usar el estado `no_contactar` solo como etiqueta visual: debe excluirse en backend.
- No continuar acumulando reglas duplicadas dentro de `App.css`.
- No convertir cada sección en una card: usar también espacios, divisores y listas.
- No aplicar el gradiente corporativo como fondo de todos los botones o paneles.
