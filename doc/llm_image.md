# Generación de imágenes — Decisión y referencia

## ✅ Decisión (Fase 1, 2026-07-02)

**Proveedor elegido: OpenAI Images (`gpt-image-1`).**

- **Por qué:** ya tenemos el SDK de OpenAI y la key cableada (`llm_service`), así que integrar
  imágenes es una función más con la misma auth — cero fricción. Calidad 5/5, integración 5/5.
- **Config económica (defaults en `config.py`):** modelo `gpt-image-1`, tamaño `1024x1024`,
  calidad `low` (~$0.01/imagen). Overridable por env: `OPENAI_IMAGE_MODEL/SIZE/QUALITY`.
- **Costo controlado:** la imagen se genera **bajo demanda, una a la vez** (`POST /api/content/image`),
  NO automáticamente para los 5 canales. `content/generate` sigue devolviendo solo `media_alt`
  (la descripción), y la imagen se produce cuando el usuario la pide.
- **Ruta de escalamiento (Fase 2+):** si el volumen crece, **Google Imagen 4 Fast** ($0.02) o
  **Replicate/fal.ai** como alternativa más barata a escala. Si algún día se necesita **texto
  dentro de la imagen** (flyers/posters), **Ideogram** es el mejor.

> Esta doc dejó de ser una consulta y ahora es el registro de decisión. La tabla de abajo queda
> como referencia comparativa para reevaluar en el futuro.

---

## Referencia comparativa (proveedores de imagen)

> Escala: **5 = excelente**, **4 = muy bueno**, **3 = aceptable / depende del caso**.

| Ranking | API / proveedor                                    | Calidad visual | Costo/calidad | Facilidad de integración | Mejor uso                                                                                                                | Costo aprox.                                                                                                                              | Veredicto                                                                                                           |
| ------: | -------------------------------------------------- | -------------: | ------------: | -----------------------: | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
|   **1** | **Google Vertex AI / Imagen 4 Fast**               |          4.5/5 |       **5/5** |                      4/5 | Apps con muchas generaciones, imágenes generales, productos, contenido educativo, marketing.                             | Imagen 4 Fast cuesta **$0.02 por imagen**, Imagen 4 **$0.04** e Imagen 4 Ultra **$0.06**. ([Google Cloud][1])                             | **La mejor opción costo/calidad general.** Muy buena para producción si ya usarás Google Cloud.                     |
|   **2** | **OpenAI Images API**                              |        **5/5** |         4.5/5 |                  **5/5** | Apps donde importa mucho la calidad, edición por prompt, imágenes con instrucciones complejas y flujos conversacionales. | GPT Image 1 Mini desde **$0.005**; GPT Image 2 puede ir aprox. de **$0.005–$0.211** según calidad y tamaño. ([OpenAI Desarrolladores][2]) | **La más completa y fácil de integrar.** Ideal si buscas buena experiencia de desarrollo y resultados consistentes. |
|   **3** | **Replicate**                                      |          4.5/5 |         4.5/5 |                    4.5/5 | Probar muchos modelos como FLUX, Stable Diffusion, Ideogram y modelos nuevos sin cambiar de proveedor.                   | Ejemplos: FLUX Schnell aprox. **$0.025**, FLUX Dev **$0.025–$0.04** por imagen según modelo/proveedor. ([Replicate][3])                   | **Muy buena para experimentar y elegir modelos.** Ideal para prototipos y startups.                                 |
|   **4** | **fal.ai**                                         |          4.5/5 |         4.5/5 |                    4.5/5 | Apps con alto volumen, baja latencia, modelos de imagen/video/audio/3D, generación rápida.                               | Cobra por imagen o megapíxel; los costos cambian según modelo y resolución. ([Fal][4])                                                    | **Excelente para producción técnica.** Muy flexible, pero hay que revisar precio por modelo.                        |
|   **5** | **Black Forest Labs / FLUX API**                   |          4.5/5 |           4/5 |                    3.5/5 | Imágenes de alta calidad, control avanzado, open weights, uso local o comercial con modelos FLUX.                        | Tiene pago por uso y opciones de licenciamiento/open weights; el precio depende del modelo FLUX elegido. ([Black Forest Labs][5])         | **Muy potente para equipos técnicos.** Recomendado si quieres control, personalización o correr modelos propios.    |
|   **6** | **Stability AI API**                               |            4/5 |           4/5 |                      4/5 | Stable Diffusion, generación general, edición, inpainting, control creativo.                                             | Usa créditos: **1 crédito = $0.01**; Stable Image Core suele estar alrededor de **$0.03 por imagen**. ([Stability AI][6])                 | **Buena opción estable y conocida.** No siempre es la mejor calidad/precio frente a Imagen/OpenAI/FLUX.             |
|   **7** | **Ideogram API**                                   |          4.5/5 |         3.5/5 |                      4/5 | Posters, banners, flyers, imágenes con texto, logos simples, social media y marketing visual.                            | Ideogram 3.0 Turbo **$0.04**, Default **$0.07**, Quality **$0.10**; edición instruccional **$0.20**. ([Ideogram][7])                      | **La mejor si necesitas texto dentro de la imagen.** Menos recomendable para alto volumen barato.                   |
|   **8** | **Leonardo AI API**                                |            4/5 |         3.5/5 |                    3.5/5 | Assets creativos, personajes, videojuegos, prototipos visuales, diseño de producto.                                      | Tiene **$5 de crédito API gratis** para empezar y modelo pay-as-you-go. ([Leonardo.ai][8])                                                | **Buena para pruebas creativas.** Menos clara para escalar con costos predecibles.                                  |
|   **9** | **Amazon Bedrock / Titan Image**                   |          3.5/5 |           4/5 |                    3.5/5 | Empresas que ya usan AWS, entornos corporativos, seguridad, cumplimiento, integración cloud.                             | Ejemplo oficial: **1000 imágenes 1024×1024 = $10**, o sea **$0.01 por imagen**. ([Amazon Web Services, Inc.][9])                          | **Barata y empresarial.** Buena si ya estás en AWS, pero no sería mi primera opción por calidad creativa.           |
|  **10** | **Google Gemini API / Nano Banana / Gemini Image** |          4.5/5 |         3.5/5 |                      4/5 | Edición conversacional, generación multimodal, imágenes con contexto, apps que ya usan Gemini.                           | Gemini 3 Pro Image puede rondar **$0.134** por imagen 1K/2K; Flash Image varía por resolución. ([Google Cloud][10])                       | **Muy buena calidad**, pero para costo/calidad puro conviene más Imagen 4 Fast o OpenAI Mini.                       |

## Mi recomendación directa

Para un proyecto o app donde quieres **buena calidad sin gastar demasiado**, usaría este orden:

| Caso                                                        | API recomendada                  |
| ----------------------------------------------------------- | -------------------------------- |
| **Mejor costo/calidad general**                             | **Google Imagen 4 Fast**         |
| **Mejor calidad + facilidad de integración**                | **OpenAI Images API**            |
| **Mejor para probar muchos modelos**                        | **Replicate**                    |
| **Mejor para producción técnica y velocidad**               | **fal.ai**                       |
| **Mejor para texto dentro de imágenes**                     | **Ideogram**                     |
| **Mejor si ya usas AWS**                                    | **Amazon Bedrock / Titan Image** |
| **Mejor si quieres modelos open-weight / control avanzado** | **Black Forest Labs / FLUX**     |

Para tu caso, si estás construyendo una app con generación de imágenes, yo haría esto:

**Opción recomendada:**
**OpenAI Images API** como principal por facilidad y calidad, y **Google Imagen 4 Fast** como alternativa económica para generaciones masivas.

**Arquitectura ideal:**
Usar un sistema interno que elija el modelo según el tipo de imagen:

| Tipo de imagen                       | Modelo/API         |
| ------------------------------------ | ------------------ |
| Imagen general barata                | Imagen 4 Fast      |
| Imagen premium o más detallada       | OpenAI GPT Image   |
| Imagen con texto tipo flyer/poster   | Ideogram           |
| Assets creativos / estilo videojuego | Leonardo o FLUX    |
| Muchas pruebas de modelos            | Replicate o fal.ai |

[1]: https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing "Agent Platform Pricing  |  Google Cloud"
[2]: https://developers.openai.com/api/docs/guides/image-generation "Image generation | OpenAI API"
[3]: https://replicate.com/pricing?utm_source=chatgpt.com "Pricing"
[4]: https://fal.ai/docs/documentation/model-apis/pricing "Pricing - fal"
[5]: https://bfl.ai/pricing?utm_source=chatgpt.com "Pricing"
[6]: https://platform.stability.ai/pricing "Stability AI - Developer Platform"
[7]: https://ideogram.ai/api-pricing/ "API Pricing — Ideogram"
[8]: https://leonardo.ai/pricing "Leonardo.Ai Pricing: Individual, Team & API Plans | Leonardo.Ai"
[9]: https://aws.amazon.com/bedrock/pricing/ "Amazon Bedrock Pricing – AWS"
[10]: https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing?utm_source=chatgpt.com "Agent Platform Pricing"
