# Business DNA — contrato de integración

Este documento describe la interfaz estable entre ADN del negocio, Clientes 360 y las herramientas creativas.

## Puesta en marcha

Aplicar en orden las migraciones de `supabase/migrations`:

1. `202609040001_business_dna.sql`
2. `202609040002_clients_360.sql`

La primera migración amplía `brand_brain` sin eliminar sus seis campos originales y crea el bucket privado `brand-assets`. La segunda amplía `clients` usando campos opcionales y añade importaciones y segmentos.

No es necesario ejecutar `doc/sql_website_url.sql` después de estas migraciones: la primera ya incorpora `website_url`.

## Compatibilidad con Campañas y Studio

| Sección nueva | Campo histórico |
| --- | --- |
| `identity.industry` | `industria` |
| `positioning.valueProposition` | `propuesta` |
| `positioning.differentiators` | `diferenciador` |
| `audience_profile.targetAudience` | `audiencia` |
| `communication.tone` | `tono` |
| `communication.forbiddenWords` | `prohibiciones` |

Omar puede migrar sus consumidores por separado. Mientras tanto, el pipeline actual continúa recibiendo los mismos campos.

## ADN del negocio

Funciones frontend estables en `frontend/src/features/business-dna/api.ts`:

```ts
getBusinessDNA()
saveBusinessDNASection(section, value, options?)
getCatalogItems(status?)
getBrandAssets()
getOnboardingProgress()
completeOnboarding(confirmedSourceIds?)
```

Endpoints equivalentes:

- `GET /api/business-dna`
- `PATCH /api/business-dna/sections/{section}`
- `GET /api/business-dna/onboarding`
- `POST /api/business-dna/onboarding/complete`
- `POST /api/business-dna/extractions`
- `GET /api/business-dna/extractions/{jobId}`
- `POST /api/business-dna/extractions/{jobId}/confirm`
- CRUD `/api/catalog-items`
- CRUD y carga `/api/brand-assets`

El onboarding solamente se completa cuando el backend encuentra nombre, industria o descripción, propuesta de valor, audiencia, tono y al menos un producto o servicio activo.

## Recursos privados

Los archivos se almacenan en `brand-assets/{user_id}/{asset_id}/{filename}`. El bucket no es público y la API devuelve URLs firmadas por una hora. Frontend y backend limitan los archivos a PNG, JPEG o WebP y 10 MB.

## Clientes 360

Funciones frontend estables en `frontend/src/features/clients/api.ts`:

```ts
getClients(filters)
createClient(input)
updateClient(clientId, input)
previewClientImport(file)
mapClientImport(importId, mapping)
confirmClientImport(importId, duplicateStrategy)
getClientSegments()
saveClientSegment(input)
getSegmentRecipients(segmentId)
```

Los destinatarios con `lifecycle_status = 'do_not_contact'` o `contact_consent = false` se excluyen en `client_audience_service.py`. La validación se ejecuta al generar, regenerar y justo antes de enviar una campaña.

Clientes 360 entrega el segmento a Studio mediante `/studio?segmentId={segmentId}`. El módulo consumidor debe volver a solicitar los destinatarios al backend antes de enviar y no confiar en una lista almacenada en el navegador.
