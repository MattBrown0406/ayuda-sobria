# Paridad de Zoom — informe de implementación

## Alcance y coexistencia

Este cambio porta a AyudaSobria el ciclo de vida semanal de Zoom observado en SoberHelpline, sin copiar ni enlazar el directorio de proveedores. Son dos reuniones distintas:

- SoberHelpline en inglés: lunes, 7:00 PM, `America/Los_Angeles`; permanece intacta.
- AyudaSobria / La Sobremesa en español: lunes, 8:00 PM, `America/Los_Angeles`; es una reunión adicional.

AyudaSobria usa la serie `ayuda_sobria_la_sobremesa_es_8pm`, el tema `La Sobremesa — AyudaSobria — Español 8 PM Pacific`, tablas en el proyecto AyudaSobria y una lista permitida por ID de reunión. No existe una configuración global que pueda sustituir la reunión inglesa.

## Arquitectura de referencia confirmada

Se trazaron código, migraciones y configuración de SoberHelpline, no solo el texto visible. Los puntos de referencia principales incluyen:

- `supabase/functions/auto-create-monday-zoom`
- `public-register-monday-zoom`, `register-zoom-meeting`, `auto-register-zoom`
- `send-zoom-registration-email`, `resend-zoom-links`, `send-member-zoom-reminder`
- `score-family-squares-registration`, `process-family-squares-followups`
- `zoom-webhook`, `sync-zoom-attendance`, `sync-zoom-recording-passcode`
- `src/components/admin/ZoomLinkSettings.tsx`, `RecordingManagement.tsx`
- `src/pages/ZoomRecordings.tsx`

El modelo de referencia crea una reunión nueva por semana, registra preguntas, reenvía enlaces, recuerda a asistentes, procesa eventos y grabaciones, deja las grabaciones sin publicar y permite administración/publicación. Algunas partes antiguas de la referencia usan una configuración global o deduplicación por fecha; la adaptación evita esas colisiones con ocurrencias y IDs de proveedor.

## Arquitectura de AyudaSobria

AyudaSobria conserva su stack TanStack Start + servidor Node + Supabase:

- `src/lib/zoom/time.ts`: cálculo determinista del próximo lunes y conversión DST de las 8 PM del Pacífico.
- `src/lib/zoom/client.server.ts`: OAuth Server-to-Server, creación/búsqueda de reunión y registro/búsqueda de participante.
- `src/lib/zoom/schedule.server.ts`: reclamación idempotente de ocurrencia, recuperación por tema+hora y creación de enlace nuevo.
- `src/lib/zoom/registration.server.ts`: validación española, persistencia previa a Zoom, preguntas, reintentos, enlace personal y confirmación.
- `src/lib/zoom/automation.server.ts`: registro recurrente, recordatorios arrendados y seguimientos consentidos.
- `src/lib/zoom/webhook.server.ts`: cuerpo crudo, HMAC, frescura, lista permitida, replay/conflicto, asistencia y grabaciones.
- `src/lib/zoom/supabase-store.server.ts`: adaptador de persistencia de servidor.
- `src/routes/api.zoom.{schedule,register,automation,webhook}.ts`: límites HTTP y respuestas veraces.
- `src/lib/admin.functions.ts` y `src/routes/admin.tsx`: ocurrencias, inscritos, preguntas, asistencia, estados y publicación.
- `src/lib/zoom.functions.ts` y `src/routes/grabaciones.tsx`: solo miembros activos/no vencidos y solo grabaciones publicadas.
- `src/routes/registro.tsx`: Turnstile, honeypot, consentimiento de confidencialidad, pregunta, registro recurrente y resultado real.
- `supabase/migrations/20260720053312_zoom_lifecycle_parity.sql`: migración nueva base; crea ocurrencias, registros, preguntas, asistencia, grabaciones privadas, archivos privados y funciones de reclamación.
- `supabase/migrations/20260720061324_harden_zoom_webhook_replay_and_reminders.sql`: migración nueva correctiva; reconcilia el posible esquema Lovable divergente, añade aislamiento 8 PM/DST, leasing, seguimiento, autorización de roles y contratos finales.

El estado remoto de estas migraciones no pudo consultarse porque Supabase CLI no tiene `SUPABASE_ACCESS_TOKEN`. Aunque una migración previa de roles aparece en la rama remota divergente `origin/lovable-sync-1784515493`, eso no demuestra qué DDL existe en producción. Por eso no se afirma que ninguna de estas dos migraciones Zoom esté desplegada.

## Ledger de cierre requisito → código

| Requisito                               | Implementado localmente                                                                | Verificación local                                                   | Despliegue / prueba viva              |
| --------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- |
| Coexistencia inglés 7 PM + español 8 PM | Serie, tema, repositorio y tablas Ayuda aislados; SoberHelpline no se modifica         | Pruebas de serie/8 PM y worktree fuente limpio                       | No desplegado; inglés vivo no tocado  |
| Ocurrencia/enlace nuevo por lunes       | `claim_zoom_occurrence`, unicidad serie+fecha/inicio, creación Zoom por ocurrencia     | DST PDT/PST, lunes distintos, retry y recuperación por tema+instante | Zoom real no probado                  |
| Registro, preguntas y reintentos        | Persistencia antes de Zoom, pregunta, seguimiento, recurrente, recuperación por correo | Pruebas unitarias y SQL de unicidad/leases                           | Proveedor/correo real no probado      |
| Admin de inscritos/preguntas/asistencia | `/admin`, rol propio validado y consultas Zoom limitadas a la serie Ayuda              | Typecheck/build y pruebas fail-closed                                | Cuenta/rol remoto no probado          |
| Grabación e ingestión                   | Webhook firmado, UUID/archivo proveedor, URL proveedor privada                         | Firma/frescura/allowlist/replay/concurrencia y SQL                   | Webhook Zoom real no probado          |
| Publicar/retirar grabaciones            | Mutación server-side admin; `published=false`; URL HTTPS explícita                     | Acceso miembro vigente y grabación privada por defecto               | No probado con cuenta real            |
| Exclusión de directorio                 | Sin navegación/sitemap/promesa de directorio español                                   | Auditoría de rutas                                                   | Producción no comprobada en este pase |

## Datos y ciclo de vida

1. Un disparador autenticado llama `POST /api/zoom/schedule`; siempre apunta al siguiente lunes y reclama `(series_key, occurrence_date)` antes de usar Zoom.
2. Zoom crea una reunión programada distinta con grabación en nube. Tema, fecha, ID y enlaces quedan asociados a una sola ocurrencia.
3. `POST /api/zoom/register` verifica abuso, persiste nombre/correo/pregunta/consentimientos y después registra a la persona con Zoom. Reintentos adoptan el registrante existente por correo.
4. `POST /api/zoom/automation` acepta `auto-register`, `reminders` o `followups` con `ZOOM_AUTOMATION_SECRET`. Recordatorios y seguimientos usan reclamación con `SKIP LOCKED` y vencimiento de lease.
5. `POST /api/zoom/webhook` ignora cualquier ID no administrado por AyudaSobria. Los eventos válidos se reclaman con lease; entregas concurrentes reciben un error reintentable, eventos completados se reconocen como replay y cargas con el mismo ID pero contenido distinto se rechazan. Luego se actualiza estado/asistencia o se ingieren grabaciones, archivos y el código privado de reproducción de Zoom.
6. Las grabaciones nacen con `published=false`. El `share_url` y `recording_play_passcode` recibidos de Zoom quedan separados como datos privados del proveedor; nunca se convierten automáticamente en valores visibles. Matt revisa/copia una URL HTTPS y, cuando sea necesario, el código para miembros, añade título y descripción, y publica o retira desde `/admin`.
7. `/grabaciones` solicita datos en servidor; solo una membresía activa o cancelada aún vigente recibe filas publicadas. Nunca salen URLs de descarga del proveedor, IDs de Zoom ni filas sin publicar.

## Controles de seguridad

- Credenciales Zoom y clave `service_role` solo se importan en servidor.
- Administración exige JWT validado y consulta `public.user_roles`; no confía en `user_metadata`.
- RLS está habilitado; `anon`/`authenticated` no tienen privilegios directos sobre PII, asistencia, eventos, archivos ni grabaciones.
- Funciones de reclamación son `SECURITY INVOKER`, fijan `search_path=''`, revocan `PUBLIC EXECUTE` y conceden solo a `service_role`.
- Webhook: firma sobre cuerpo crudo, comparación constante, ventana de 5 minutos, hash de carga, evento duradero, conflicto para mismo ID/carga distinta y liberación ante fallo reintentable.
- La lista permitida se resuelve desde `zoom_occurrences` y la serie española antes de cualquier efecto secundario.
- Unicidad por serie/fecha, serie/instante, ID de reunión, ocurrencia/correo, UUID de grabación y archivo de Zoom.
- Restricción de base de datos comprueba lunes 8 PM con `America/Los_Angeles`; no usa offset UTC fijo.
- Turnstile falla cerrado si falta configuración; además hay honeypot, trampa temporal, límite de 16 KiB y rate limit de proceso.
- Grabaciones privadas por defecto; los tokens/URLs de archivos quedan en una tabla exclusivamente de servidor.

## Variables de entorno requeridas (solo nombres)

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ZOOM_ACCOUNT_ID`
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_HOST_USER_ID` (requerido; anfitrión dedicado para la serie española)
- `ZOOM_WEBHOOK_SECRET_TOKEN`
- `ZOOM_AUTOMATION_SECRET`
- `RESEND_API_KEY`
- `LOVABLE_API_KEY`
- `REGISTRATION_FROM_EMAIL` (opcional)
- `REGISTRATION_TO_EMAIL` (opcional)
- `TURNSTILE_SECRET_KEY`
- `VITE_TURNSTILE_SITE_KEY`

## Programación y DST

`Intl.DateTimeFormat` calcula la fecha local y la conversión de `20:00` en `America/Los_Angeles`. Las pruebas cubren PDT (`03:00Z` del martes), PST (`04:00Z` del martes), recuperación durante el lunes antes del inicio y avance al lunes siguiente a partir de las 8 PM.

`.github/workflows/ayuda-zoom-automation.yml` ejecuta cada hora un flujo idempotente: crea o recupera la ocurrencia administrada, pasa su `occurrence.id` a `auto-register`, y procesa recordatorios y seguimientos. GitHub reintenta en la siguiente hora si Zoom, correo o la aplicación devuelve un error. El flujo queda inactivo hasta configurar sus dos secretos de repositorio.

## Verificación final local

- `npm run typecheck`: aprobado, 0 diagnósticos.
- `npm test`: auditoría de rutas + 13 pruebas Zoom, 13 aprobadas.
- `npm run lint`: exit 0, 0 errores; 6 advertencias preexistentes de Fast Refresh en componentes UI.
- `npm run build`: aprobado; generó cliente, SSR y worker Nitro. Solo avisos de API deprecada/tamaño de chunk ya existentes.
- `npx supabase db reset --local --no-seed`: cadena completa reconstruida con ambas migraciones.
- `tests/zoom-schema-smoke.sql` con `psql -v ON_ERROR_STOP=1` dentro del contenedor local: aprobado y revertido.
- `npx supabase db lint --local --level error`: sin errores de esquema.
- `git diff --check`: aprobado.
- Escaneo de secretos del diff y archivos nuevos: 0 hallazgos. El escaneo completo solo detectó el marcador de ejemplo `RESEND_API_KEY` en `.env.example`, confirmado como placeholder.
- No se llamó a Zoom real, no se consultó/aplicó la base remota y no se publicó Lovable. La sincronización de Git no despliega por sí sola las migraciones ni configura secretos externos.

## Acciones no desplegadas / manuales

1. Obtener acceso aprobado de solo lectura al historial remoto y ejecutar `supabase migration list` antes de desplegar. Si ambas migraciones Zoom están pendientes, aplicarlas en orden (`20260720053312`, luego `20260720061324`) mediante el flujo de CI/Lovable/Supabase aprobado. Si el historial remoto indica aplicación parcial, detenerse y reconciliar historial/esquema antes de cualquier push de base de datos; no editar una migración ya aplicada.
2. Configurar las variables anteriores en el entorno de servidor, sin exponer `SUPABASE_SERVICE_ROLE_KEY`, secretos Zoom, Turnstile ni Resend en variables `VITE_*`.
3. En el proyecto Supabase de AyudaSobria, asignar a la cuenta autenticada de Matt una fila `user_roles.role = 'admin'` mediante un flujo administrativo/service-role aprobado; la migración no concede admin automáticamente por correo.
4. En la app Server-to-Server OAuth de Zoom usada por AyudaSobria, habilitar acceso para listar/crear reuniones y listar/crear/eliminar registrantes del anfitrión dedicado configurado. Confirmar que ese usuario es distinto del anfitrión de SoberHelpline o que la cuenta tiene capacidad de reuniones concurrentes, y probar el relevo 7 PM/8 PM. Configurar el webhook de AyudaSobria hacia `/api/zoom/webhook` para `meeting.started`, `meeting.ended`, `meeting.participant_joined`, `meeting.participant_left` y `recording.completed`.
5. Configurar los secretos de GitHub Actions `AYUDA_ZOOM_BASE_URL` (por ejemplo, `https://ayudasobria.com`) y `ZOOM_AUTOMATION_SECRET`; ejecutar manualmente `AyudaSobria Zoom automation` una vez y verificar su resultado. El flujo versionado hace creación, auto-registro, recordatorios y seguimientos cada hora.
6. Ejecutar una prueba controlada no productiva con Zoom y correo válidos; confirmar creación 8 PM, identidad distinta, registro, enlace personal, pregunta en admin, recordatorio, replay/concurrencia, grabación privada, publicación y retiro.
7. Revisar las plantillas españolas de seguimiento antes de activar `followups` en producción.
8. La revisión independiente de seguridad, backend y producto se completó y sus bloqueadores se corrigieron antes de sincronizar `main`, que está conectado a Lovable.
