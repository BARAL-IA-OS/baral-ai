# Plan de trabajo — Omar

## Baral AI · Campañas, Photoshoot, Brand Book y Auditoría

**Responsable:** Omar Quispe  
**Rol:** Tech Lead & Full Stack  
**Rama recomendada:** `feat/omar-creative-suite`  
**Dependencia principal:** contratos `BusinessDNA`, catálogo, recursos y segmentos de clientes entregados por Jhamil

---

## 1. Objetivo

Convertir el Estudio actual en una suite de ejecución creativa basada en el ADN real del negocio. El usuario debe comenzar con una instrucción sencilla, recibir sugerencias relevantes, generar una campaña y continuar hacia el preview multicanal existente. En la misma familia de herramientas tendrá generación publicitaria de imágenes, Brand Book y auditoría web.

La experiencia debe tomar la composición de las capturas entregadas: fondo oscuro, sidebar estable, tarjetas grandes, compositor central tipo chat, accesos mediante iconos y lila Baral como acento.

---

## 2. Alcance asignado

Omar es responsable de:

1. Reemplazar la entrada “Estudio” por una experiencia inicial de **Campañas**.
2. Conectar Campañas con la vista multicanal del Studio existente.
3. Crear la herramienta **Photoshoot** para imágenes publicitarias.
4. Crear el flujo **Brand Book** y exportación PDF.
5. Integrar **Auditoría de página** usando la lógica de Baral Audit/Ale.
6. Extender backend, persistencia, costos, seguridad y contratos necesarios.
7. Integrar los módulos con ADN, catálogo, recursos y segmentos creados por Jhamil.

No debe reconstruir Sidebar, tokens ni tablas del ADN en paralelo. Debe consumir las interfaces compartidas entregadas por Jhamil.

---

## 3. Navegación objetivo

Después de integrar el trabajo de Jhamil, la estructura recomendada es:

```text
TRABAJO
  Dashboard
  Campañas
  Historial

ADN DEL NEGOCIO
  Resumen
  Catálogo
  Recursos

CREACIÓN
  Photoshoot
  Brand Book
  Auditoría web

GESTIÓN
  Clientes
  Reportes y Analítica
```

Rutas recomendadas:

- `/campaigns` — entrada conversacional y sugerencias;
- `/studio/:campaignId` — edición y preview multicanal;
- `/photoshoot` — imágenes publicitarias;
- `/brand-book` — creación, edición y exportación;
- `/audit` — consentimiento, ejecución y dashboard de auditoría.

Mantener temporalmente una redirección `/studio → /campaigns` para no romper enlaces antiguos.

---

## 4. Campañas

### 4.1 Pantalla inicial

La primera vista no debe mostrar directamente la interfaz compleja del Studio. Debe ser una entrada simple, inspirada en la primera captura:

- título **Campañas**;
- subtítulo breve;
- caja central tipo chat para describir el objetivo;
- micrófono con estado escuchando;
- selector de producto o servicio del catálogo;
- selector de recursos/imágenes;
- selector de formato o relación de aspecto;
- selector de canales;
- selector de audiencia usando los segmentos de Clientes 360;
- acción principal **Generar brief**;
- sugerencias visuales basadas en el ADN del negocio.

Ejemplos de sugerencias:

- “Presenta el producto destacado de esta semana”.
- “Crea una campaña de reactivación para clientes inactivos”.
- “Promociona una oferta para Instagram y WhatsApp”.
- “Genera contenido educativo usando el tono de mi marca”.

Las sugerencias no deben ser cards genéricas fijas. Deben usar industria, productos, fechas y canales del ADN cuando estén disponibles.

### 4.2 Brief estructurado

El texto del usuario se transforma en un brief editable antes de generar:

- objetivo;
- producto/servicio;
- audiencia;
- oferta y CTA;
- tono;
- canales;
- formato;
- recursos seleccionados;
- restricciones de marca.

El usuario confirma el brief y continúa al Studio.

### 4.3 Integración con Studio

Conservar lo valioso de `Studio.tsx`, pero hacerlo dependiente de una campaña persistida:

```text
Campañas
    → crear brief
    → generar contenido
    → guardar campaignId
    → Studio multicanal
    → editar
    → aprobar/exportar
```

Cambios necesarios:

- eliminar la marca fija “Studio Foto”;
- usar nombre, logo, colores y handle del ADN;
- conservar contenido distinto por canal;
- permitir regenerar un solo canal sin perder los demás;
- registrar texto, imagen, tokens, costo y proveedor;
- mostrar estados y errores reales;
- permitir seleccionar o cambiar recursos;
- excluir siempre a clientes marcados como `no_contactar`;
- separar generación de texto y generación de imagen para controlar costos;
- persistir versiones del contenido.

El MVP genera y previsualiza Instagram, Facebook, TikTok, WhatsApp y email. La publicación directa a redes queda fuera hasta disponer de OAuth y permisos por plataforma.

---

## 5. Photoshoot

### 5.1 Alcance de la primera versión

Crear imágenes publicitarias profesionales usando productos y recursos del ADN.

La pantalla tendrá dos tarjetas principales como en las referencias:

- **Crear sesión de producto:** flujo guiado con producto, referencia y plantilla.
- **Generar o editar imagen:** prompt libre, imágenes de entrada y formato.

Controles mínimos:

- producto del catálogo;
- una o varias imágenes de referencia;
- escenario/fondo;
- estilo visual;
- relación de aspecto;
- cantidad de variantes;
- prompt y prompt negativo opcional;
- generar, descargar y guardar en Recursos.

### 5.2 Flujo

```text
Seleccionar producto
    → elegir fotografía o subirla
    → elegir plantilla/escenario
    → describir resultado
    → generar variantes
    → comparar
    → guardar en Recursos o enviar a Campañas
```

### 5.3 Video

La primera entrega es únicamente imagen. Mostrar **Animar imagen / Video — Próximamente** sin ejecutar cobros ni llamadas incompletas.

La segunda fase podrá:

- animar una imagen seleccionada;
- elegir duración y movimiento;
- generar una vista previa;
- guardar el video como recurso;
- enviarlo al Studio.

No mezclar video con el primer MVP hasta que imágenes, costos, almacenamiento y estados sean confiables.

---

## 6. Brand Book

Generar un documento visual a partir del ADN confirmado, nunca a partir de datos inventados.

### 6.1 Flujo en dos pasos

**Paso 1 — Portada**

- seleccionar imagen existente;
- subir imagen;
- generar portada;
- mostrar varias plantillas;
- confirmar una opción.

**Paso 2 — Imágenes interiores**

- seleccionar de 3 a 7 recursos;
- subir nuevos recursos;
- mostrar la composición antes de confirmar;
- permitir omitir y continuar con elementos gráficos.

### 6.2 Contenido del documento

- portada;
- esencia y propósito de la marca;
- logo y usos;
- colores con códigos;
- tipografías;
- personalidad y tono;
- audiencia;
- mensajes clave;
- CTA recomendados;
- ejemplos de uso correcto e incorrecto;
- productos/servicios destacados;
- datos de contacto y redes.

### 6.3 Salidas

- preview dentro de Baral AI;
- edición por secciones;
- descarga PDF;
- abrir en nueva pestaña;
- guardar versión y fecha;
- publicar mediante enlace compartible solo en una fase posterior.

La generación PDF debe ocurrir desde datos estructurados y componentes preparados para impresión, no mediante una captura frágil de toda la pantalla.

---

## 7. Auditoría web — integración con Baral Audit/Ale

### 7.1 Entrada con autorización

Antes de escanear, mostrar un modal de consentimiento:

- URL que se auditará;
- confirmación de que el usuario posee el sitio o tiene autorización;
- alcance del análisis;
- aviso de que se harán solicitudes automáticas a páginas públicas;
- estimación de duración;
- botón **Autorizar e iniciar auditoría**.

Guardar fecha, usuario, dominio y versión del consentimiento.

### 7.2 Ejecución

Después de autorizar:

- validar URL y bloquear destinos internos/privados;
- crear un `audit_run`;
- mostrar progreso por etapas;
- ejecutar el motor de Baral Audit;
- persistir el resultado normalizado;
- mostrar recuperación/reintento si se interrumpe.

### 7.3 Dashboard

Reutilizar la lógica útil de `baral-audit`:

- score general;
- SEO;
- rendimiento y Core Web Vitals;
- accesibilidad;
- conversión;
- hallazgos P0–P3;
- evidencias visuales por dispositivo;
- enlaces rotos;
- stack tecnológico;
- preparación para agentes/IA;
- competencia;
- roadmap priorizado;
- exportación PDF/JSON.

### 7.4 Estrategia de integración

No duplicar el motor completo dentro del frontend de Baral AI.

Crear una capa adaptadora:

```text
Baral AI frontend
    → FastAPI autenticado
    → adaptador/proxy de auditoría
    → motor Baral Audit
    → resultado normalizado
    → dashboard Baral AI
```

Esto evita CORS, centraliza autenticación y permite registrar costos, consentimiento e historial. Si inicialmente Baral Audit permanece como servicio separado, el backend de Baral AI debe comunicarse con él; no usar un `iframe` como solución final.

Entidades recomendadas:

- `website_audit_consents`;
- `website_audit_runs`;
- `website_audit_results` o resultado JSONB versionado.

---

## 8. Backend y contratos

Omar debe mantener contratos tipados para:

```ts
createCampaignBrief()
generateCampaignContent()
regenerateCampaignChannel()
generatePhotoshoot()
getGenerationStatus()
saveGeneratedAsset()
createBrandBook()
exportBrandBookPdf()
authorizeWebsiteAudit()
runWebsiteAudit()
getWebsiteAuditResult()
```

Requisitos transversales:

- validación de inputs y límites;
- rate limiting por usuario;
- registro de tokens y costos por operación;
- idempotencia en generación y auditoría;
- estados `CREATED`, `PROCESSING`, `READY`, `FAILED`;
- reintentos controlados;
- Storage privado con URLs firmadas;
- ownership por `user_id` en todas las operaciones;
- errores legibles sin filtrar secretos;
- migraciones SQL versionadas.

---

## 9. Dirección visual obligatoria — tema “Baral Eclipse”

Consumir el sistema visual creado por Jhamil; no crear una segunda identidad.

Patrones de las capturas que se deben conservar:

- sidebar oscura persistente;
- título editorial centrado;
- gran compositor de instrucciones;
- acciones en pills con iconos;
- tarjetas de sugerencias en cuadrícula;
- paneles gris carbón;
- modales grandes con pasos claros;
- imágenes protagonistas;
- navegación con selección lila;
- acciones primarias visibles sin saturar la pantalla.

Usar los tokens compartidos:

```css
--baral-bg-canvas: #1b1b1b;
--baral-bg-sidebar: #1b1b1b;
--baral-surface-1: #282a2c;
--baral-surface-2: #333537;
--baral-surface-brand: #342d43;
--baral-border: #414346;
--baral-primary: #a77bff;
--baral-primary-hover: #b99cff;
--baral-primary-strong: #8600ef;
--baral-primary-soft: #d9ccff;
--baral-cyan: #2cffc0;
--baral-blue: #118dff;
--baral-text: #e5e3d9;
--baral-text-strong: #f7f5ef;
--baral-text-muted: #a6a7a1;

--baral-gradient-brand: linear-gradient(160deg, #2cffc0 0%, #118dff 45%, #8600ef 100%);
--baral-gradient-action: linear-gradient(135deg, #8600ef 0%, #118dff 100%);
```

No copiar el verde amarillento de las referencias. El fondo debe permanecer en el gris carbón medido de la captura (`#1B1B1B`), no en negro puro ni azul-violeta. El lila funciona como selección, CTA y halo suave; el turquesa corporativo se reserva para progreso, estados positivos e indicadores de IA. Los gradientes aparecen solo en hero o CTA especial, no como relleno repetido en cada tarjeta. El tema oscuro **Baral Eclipse** es el predeterminado del MVP.

---

## 10. Orden de implementación

### Entrega 1 — Campañas

- página de entrada conversacional;
- micrófono y selectores;
- sugerencias basadas en ADN;
- brief estructurado;
- conexión con Studio;
- eliminar marca de ejemplo.

### Entrega 2 — Studio consolidado

- campañas persistidas y versionadas;
- preview real por canal;
- costos y estados;
- selección de recursos;
- regeneración parcial.

### Entrega 3 — Photoshoot de imágenes

- flujo guiado;
- variantes;
- galería;
- guardar en Recursos;
- acceso desde Campañas.

### Entrega 4 — Brand Book

- selección de portada;
- selección de imágenes;
- preview editable;
- generación y descarga PDF.

### Entrega 5 — Auditoría

- autorización;
- adaptador con Baral Audit;
- progreso;
- dashboard;
- historial y exportación.

Video comienza solamente después de completar y estabilizar estas cinco entregas.

---

## 11. Criterios de aceptación

- [ ] “Estudio” se reemplaza por una entrada clara de Campañas.
- [ ] La campaña puede iniciarse escribiendo o dictando.
- [ ] Productos, recursos y sugerencias provienen del ADN real.
- [ ] La audiencia puede elegirse desde un segmento de Clientes 360 y respeta `no_contactar`.
- [ ] Confirmar el brief abre el Studio existente con contenido persistido.
- [ ] Studio no contiene “Studio Foto” ni otros datos de demostración.
- [ ] Cada canal conserva contenido independiente y editable.
- [ ] Photoshoot genera imágenes, muestra variantes y guarda resultados.
- [ ] Video aparece únicamente como función futura hasta estar implementado.
- [ ] Brand Book usa datos confirmados y permite descargar un PDF correcto.
- [ ] Auditoría exige autorización antes de escanear.
- [ ] El dashboard de auditoría muestra datos reales de Baral Audit.
- [ ] Costos, errores y estados quedan registrados.
- [ ] Todas las operaciones verifican ownership y límites.
- [ ] La interfaz sigue el sistema oscuro/lila compartido.
- [ ] TypeScript, lint, build y pruebas backend pasan.

---

## 12. Reglas de coordinación

- Jhamil define primero los tipos y consultas de ADN, catálogo, recursos y segmentos de clientes.
- Jhamil es dueño de Sidebar, primitivas visuales y tokens globales durante su entrega.
- Omar consume `navigation.ts` y solicita/agrega entradas sin duplicar el Sidebar.
- Omar integra `App.tsx` después de incorporar las rutas iniciales de Jhamil.
- No trabajar simultáneamente sobre `App.css` sin dividirlo por módulos; extraer estilos a archivos específicos.
- Cada entrega debe ser un PR pequeño, demostrable y reversible.
- Mantener compatibilidad con las rutas y campañas ya guardadas.

---

## 13. Riesgos que Omar debe evitar

- No enviar campañas ni ejecutar auditorías dos veces por reintentos: usar idempotencia.
- No marcar como éxito una generación o envío simulado.
- No reutilizar una sola imagen para todos los canales sin informarlo.
- No exponer imágenes privadas mediante buckets públicos.
- No generar video antes de controlar costo y almacenamiento de imágenes.
- No auditar dominios internos, IP privadas o sitios sin autorización.
- No copiar Baral Audit dentro del frontend sin una capa de integración mantenible.
- No permitir que la IA invente datos del Brand Book.
