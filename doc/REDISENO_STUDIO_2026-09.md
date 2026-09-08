# Baral AI — espacio creativo y preparación del piloto

## Diseño implementado

Campañas es la entrada después del inicio de sesión y del onboarding. La antigua ruta de Dashboard redirige a Campañas. Métricas y actividad se consultan desde el menú de cuenta.

- Fondo gris carbón: `#1B1B1B`.
- Acento lima cálido: `#D4DF8A`; hover: `#E2ECAB`.
- Superficies grises y texto crema; verde oliva para texto de acento en el tema claro.
- Compositor central con producto, imágenes y formato; canales y audiencia se despliegan cuando hacen falta.
- Tres tarjetas de inspiración con composiciones gráficas originales en CSS. Son ejemplos de dirección creativa, no campañas ya generadas.
- Menú lateral de 248 px en escritorio y panel móvil de 288 px. Configuración y métricas viven en la cuenta; se retiraron accesos duplicados y la notificación sin función.

Los valores base están en `frontend/src/styles/tokens.css`; los estilos del espacio creativo están en `creative-workspace.css`. Los alias de los módulos anteriores usan la misma paleta. Se retiraron reglas móviles antiguas que forzaban una barra horizontal o de iconos.

## Conexiones corregidas

- Productos obtenidos de Catálogo, no inferidos desde Clientes.
- Selección y subida de imágenes contra la biblioteca real de Recursos.
- Campañas guarda IDs de recursos; el backend verifica pertenencia al usuario y estado activo.
- El Estudio vuelve a obtener URLs firmadas al abrirse y muestra la primera imagen seleccionada; informa cuando esa imagen se comparte entre canales.
- El canal de la vista previa sigue al seleccionado en el editor.
- Una falla al consultar onboarding muestra reintento, sin hacer repetir el registro.
- La URL del backend se normaliza para evitar barras duplicadas.
- Errores de generación visibles dentro del diálogo; foco de teclado y Escape en los diálogos de Campañas.

## Verificación y alcance

Se comprobó con fixtures locales el diseño, selección de sugerencias, propuesta editable, navegación móvil y cambio de tema. Los fixtures se retiraron del proyecto después de revisar.

Comprobaciones técnicas: TypeScript, compilación de producción y ESLint sin errores; 18 pruebas de backend aprobadas, incluidas tres para validación y pertenencia de recursos de campañas.

El 8 de septiembre se verificó que `/health` de Render devuelve 200 y reporta Supabase configurado. El preflight CORS de creación de campañas devuelve 200 y permite el origen de Vercel. Esto no prueba una operación autenticada contra las tablas.

No se borraron datos, cambiaron credenciales ni ejecutaron migraciones. Este cambio no necesita SQL nuevo.

## Antes del piloto con clientes

### Ajuste de navegación y ADN

- Se eliminó la tarjeta de progreso superior. El porcentaje real aparece al lado del título de la sección ADN del negocio; si falla su consulta se muestra «—», no un 0% inventado.
- Orden del menú: Tu espacio creativo → Creación → ADN del negocio → Gestión.
- Se eliminaron los espacios acumulados entre grupos y enlaces. En escritorio los enlaces tienen una altura mínima de 37 px y en móvil 44 px.
- Resumen presenta un tablero de marca: nombre y web, acceso al logo en Recursos, tipografías, muestras de colores y contexto estratégico.
- Detalles del negocio agrupa ubicación, contacto, horarios, redes, enlaces y prueba social en tarjetas editables.
- Catálogo presenta una cuadrícula con acciones para agregar desde URL o desde cero y tarjetas de productos/servicios. Conserva búsqueda, filtros, edición, destacado, archivo y eliminación con confirmación.
- Guardar una tarjeta conserva los otros campos de su sección; las listas se convierten al guardar para permitir escribir comas sin perderlas.

Verificado con datos locales de prueba: escritorio de 1440 px, móvil de 390 × 844, menú completo, filtros, apertura de formularios, edición de tipografías sin perder colores y edición de contacto sin perder ubicación/horarios/redes. Estos datos nunca se enviaron a Supabase; los archivos temporales fueron retirados.

Desplegar juntos frontend y backend. Con una cuenta de prueba propia, verificar:

1. Iniciar sesión con onboarding completo: abre Campañas.
2. Crear un producto y subir una imagen; seleccionarlos al preparar una campaña.
3. Confirmar la propuesta y comprobar generación real, persistencia y apertura del Estudio.
4. Recargar la campaña, editar un canal y comprobar su vista previa.
5. Probar en móvil y con una segunda cuenta para confirmar aislamiento de datos.

La generación real con proveedores y la escritura autenticada en Supabase deben validarse después del despliegue. Las comprobaciones visuales locales no sustituyen ese recorrido.
