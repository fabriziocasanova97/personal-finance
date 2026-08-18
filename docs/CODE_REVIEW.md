# Revisión de código — FinClear (finanzas personales)

**Fecha:** 2026-08-18
**Revisor:** `revisor-de-codigo`
**Commit base:** `0af88b7` (`fix: db silent failures and strict type mapping`)
**Nota de estado:** durante esta revisión el working tree cambió por trabajo concurrente ajeno a esta entrega (ver *Alcance y metodología*). Las líneas citadas corresponden al working tree tal como estaba a las 14:19 del 2026-08-18.

---

## Resumen ejecutivo

La aplicación funciona bien como app local. Lo que no funciona, y nunca funcionó, es la capa de sincronización con Supabase.

La migración `supabase/migrations/20260312000000_init.sql` **nunca se aplicó** al proyecto de la nube. Las cinco tablas de datos financieros (`income`, `fixed_costs`, `expenses`, `savings`, `budgets`) no existen en `gmwlvwnylokgcdjwifti.supabase.co`. Toda petición REST contra ellas devuelve `404 PGRST205`. Verificado hoy con la anon key del proyecto.

Sin embargo, la segunda migración (`20260403000000_add_user_settings.sql`) **sí se aplicó**: `user_settings` responde `HTTP 200` con `[]`. Es decir, se aplicó la migración posterior y no la anterior. PostgREST incluso lo delata: al pedir `savings` responde con el hint *"Perhaps you meant the table 'public.user_settings'"*, porque `user_settings` es la única tabla que conoce en el esquema `public`.

Las consecuencias, en orden de gravedad:

1. **Cero respaldo en la nube.** Cada "guardado" contra la nube ha fallado en silencio desde el primer día. La nube tiene 0 filas de datos financieros. El único respaldo real que existe es el export manual verificado en `/Users/fabrizio/Documents/2 | Personal/My Apps/finclear_backup_2026-04-03.json` (93 gastos, 17 costos fijos, 9 ahorros, ingreso semanal de 1350). Ese archivo tiene fecha del 3 de abril: **todo lo capturado desde entonces existe únicamente en el `localStorage` de un navegador.**

2. **Riesgo activo de borrado total.** Confirmado, no hipotético. `dbFetchAll` hace sus `select()` sin `.throwOnError()`, así que ante el 404 supabase-js resuelve con `{ data: null, error }` en vez de lanzar. La función devuelve un objeto *truthy* con arrays vacíos, la guarda `if (cloudData)` pasa, y `AuthProvider` ejecuta los seis setters con datos vacíos. **Cualquier evento de auth —login, refresh de token, recuperación de sesión al abrir la app— vacía el estado local completo y lo persiste a `localStorage`.** No hay merge, no hay confirmación, no hay error visible.

3. **Escrituras que no existen.** Ni `budgets` ni `income` tienen writer en `src/lib/db.ts`. Aunque las tablas existieran, esos dos datos nunca subirían — y `budgets` sí se *lee* y se usa para sobreescribir el estado local.

Se documentan 15 hallazgos: 5 críticos, 3 altos, 3 medios, 4 bajos. Ninguno se arregla en esta entrega.

**La acción más urgente no es de código:** exportar un backup fresco desde el navegador que hoy tenga los datos buenos, antes de volver a abrir la app o de tocar el login. El riesgo de pérdida es mayor mientras el hallazgo H2 siga vivo.

---

## Alcance y metodología

**Proyecto:** Next.js 16, app de finanzas personales de un solo usuario. Zustand con `persist` sobre `localStorage` (clave `finclear_data`) es la fuente de verdad. Supabase es capa de sync y de auth.

**Qué se revisó:**

- `src/lib/` completo — `db.ts`, `store.ts`, `supabase.ts`, `utils.ts`
- `src/components/` completo — auth, features (dashboard, expenses, fixed-costs, savings, monthly-review, analytics), layout, ui
- `src/app/` completo — páginas de expenses, fixed-costs, savings, monthly-review, login, layout raíz
- `supabase/migrations/` — ambas migraciones
- `.env.local` — solo para obtener la URL del proyecto y la anon key con las que sondear

**Cómo se verificó:**

1. **Lectura directa de cada archivo citado.** Toda línea reproducida en este documento se copió del archivo real. Los números de línea corresponden al commit `0af88b7`.

2. **Sonda REST en vivo, solo lectura.** Se hicieron peticiones `GET` con la anon key contra cada tabla del esquema para distinguir entre "el sync falla" y "el sync nunca tuvo destino". Resultado:

   | Tabla | HTTP | Respuesta |
   |---|---|---|
   | `expenses` | 404 | `PGRST205 Could not find the table 'public.expenses' in the schema cache` |
   | `fixed_costs` | 404 | `PGRST205 Could not find the table 'public.fixed_costs' in the schema cache` |
   | `savings` | 404 | `PGRST205 ...` + hint `Perhaps you meant the table 'public.user_settings'` |
   | `budgets` | 404 | `PGRST205 Could not find the table 'public.budgets' in the schema cache` |
   | `income` | 404 | `PGRST205 Could not find the table 'public.income' in the schema cache` |
   | `user_settings` | **200** | `[]` |

3. **Inspección del backup.** Se abrió y contó el contenido de `/Users/fabrizio/Documents/2 | Personal/My Apps/finclear_backup_2026-04-03.json`: 93 gastos, 17 costos fijos, 9 ahorros, 0 budgets, e `income.weekly_amount = 1350`. Las claves presentes en `state` son `budgets`, `expenses`, `fixedCosts`, `idealExpenses`, `income`, `savings`.

**Cambio del working tree a mitad de la revisión.** Al comenzar, `git status --porcelain` estaba vacío: el árbol coincidía exactamente con el commit `0af88b7`. Durante la revisión apareció trabajo concurrente ajeno a esta entrega, con marca de tiempo 14:03-14:07 del 2026-08-18: se extrajeron `src/lib/categories.ts` y `src/lib/expenses.ts`, se añadió `src/components/features/expenses/QuickExpenseInput.tsx` y `src/app/api/`, y se modificaron `package.json`, `package-lock.json`, `src/app/page.tsx`, `src/app/expenses/page.tsx` y `src/components/features/expenses/AddExpenseModal.tsx`.

De todos los archivos citados en este informe, **el único afectado fue `AddExpenseModal.tsx`**. Los demás (`src/lib/db.ts`, `src/lib/supabase.ts`, `src/lib/store.ts`, `monthly-review/page.tsx`, `DashboardSummary.tsx`, `WeeklyIncomeEditor.tsx`, `DataSync.tsx`, `BudgetModal.tsx`, `FixedCostModal.tsx`, `AddContributionModal.tsx` y ambas migraciones) permanecen sin cambios respecto a `0af88b7`.

Las citas de H6 y H8 se **re-anclaron** al estado actual del árbol, porque el refactor movió el código sin corregir el defecto:

- El camino de alta de gasto salió de `AddExpenseModal.handleSave` y ahora vive en `src/lib/expenses.ts`. El `.catch(console.error)` viajó con él intacto (`expenses.ts:20`), así que H6 sigue vigente y ahora tiene **9** apariciones en vez de 8.
- El literal `"temp-user"` se duplicó: sigue en `AddExpenseModal.tsx` (línea 54, antes 63) y apareció además en `expenses.ts:12`. H8 pasa de 5 a **6** sitios.

Ninguno de los 15 hallazgos quedó resuelto ni invalidado por ese trabajo concurrente. Se documenta aquí porque los números de línea de un informe de revisión solo son verificables contra un estado conocido del árbol.

**Qué NO se hizo:**

- No se ejecutó la aplicación ni se abrió un navegador. El comportamiento en runtime de H2 se deduce del contrato documentado de supabase-js (los `select()` sin `.throwOnError()` resuelven con `{data: null, error}`, no lanzan) más la lectura del código. Es una deducción sólida, pero no una observación directa en el navegador.
- No se aplicaron migraciones, no se escribió en la nube, no se modificó ningún archivo fuera de este documento.
- No se auditó la seguridad de la anon key ni la configuración de RLS más allá de leer las políticas de las migraciones.

**Un límite honesto de esta revisión:** al no poder inspeccionar el `localStorage` real del navegador del usuario, no puedo cuantificar cuántos datos posteriores al 3 de abril están en riesgo. Solo puedo afirmar que no están en la nube.

---

## Hallazgos

### H1 — Las tablas de datos financieros nunca se crearon en la nube

**Severidad:** Crítico
**Archivo:** `supabase/migrations/20260312000000_init.sql:20`

```sql
CREATE TABLE expenses (
```

Contrasta con la segunda migración, que sí llegó a aplicarse — `supabase/migrations/20260403000000_add_user_settings.sql:2`:

```sql
CREATE TABLE user_settings (
```

**Impacto.** La migración inicial existe en el repositorio pero nunca se aplicó al proyecto de la nube. Ninguna de las cinco tablas que declara (`income`, `fixed_costs`, `expenses`, `savings`, `budgets`) existe en `gmwlvwnylokgcdjwifti.supabase.co`. Toda escritura y toda lectura contra ellas devuelve `404 PGRST205`. La nube tiene 0 filas de datos financieros y siempre las ha tenido.

El detalle revelador es que la migración *posterior* sí se aplicó: `user_settings` responde `200`. Esto descarta la hipótesis de "el proyecto de Supabase está mal configurado" o "las credenciales están mal" — el proyecto funciona, la auth funciona, y una de las dos migraciones llegó. Simplemente se aplicó la del 3 de abril y nunca la del 12 de marzo. Probablemente `user_settings` se creó a mano desde el dashboard de Supabase mientras se trabajaba en la feature de ideales, sin notar que la base nunca había sido inicializada.

Consecuencia práctica: el único respaldo real de las finanzas es el export manual en `/Users/fabrizio/Documents/2 | Personal/My Apps/finclear_backup_2026-04-03.json` (93 gastos, 17 costos fijos, 9 ahorros — verificado). Todo lo capturado después del 3 de abril vive solo en `localStorage`.

**Reproducción.**

```bash
curl -s -w "\nHTTP %{http_code}\n" \
  "https://gmwlvwnylokgcdjwifti.supabase.co/rest/v1/expenses?select=*&limit=1" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
# → HTTP 404
# {"code":"PGRST205","message":"Could not find the table 'public.expenses' in the schema cache"}

# Y para contraste, la tabla que sí existe:
curl -s -w "\nHTTP %{http_code}\n" \
  "https://gmwlvwnylokgcdjwifti.supabase.co/rest/v1/user_settings?select=*&limit=1" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
# → HTTP 200, cuerpo []
```

---

### H2 — El login sobreescribe el estado local con la nube sin merge; hoy eso significa borrado total

**Severidad:** Crítico
**Archivo:** `src/components/auth/AuthProvider.tsx:66` (y el bloque gemelo en `:39-48`)

```tsx
        if (cloudData) {
          useStore.getState().setExpenses(cloudData.expenses);
```

El mismo patrón aparece dos veces: en `initializeAuth` (líneas 39-48) y en el listener `onAuthStateChange` (líneas 64-73). Ambos ejecutan seis setters seguidos sin comparar contra lo que ya había en local.

**Impacto.** Este es el hallazgo más peligroso del repositorio, porque su peor caso está confirmado y activo hoy.

La pregunta clave es qué hace `dbFetchAll` cuando las tablas devuelven 404. La respuesta: **devuelve arrays vacíos, no lanza error.** En `src/lib/db.ts:23-28` los `select()` se emiten sin `.throwOnError()`, y supabase-js resuelve la promesa con `{ data: null, error }` ante un 404 de PostgREST en vez de rechazarla. El destructuring en `db.ts:17-21` extrae `data: null` para las cinco tablas, y las expresiones `expenses || []` de las líneas 31-34 lo convierten en `[]`.

El resultado es que `dbFetchAll` retorna un objeto perfectamente *truthy*:

```
{ expenses: [], fixedCosts: [], savings: [], budgets: [], idealExpenses: {}, idealSavings: {} }
```

La guarda `if (cloudData)` pasa sin problema. Se ejecutan los seis setters con datos vacíos. Zustand `persist` escribe inmediatamente ese estado vacío a `localStorage` bajo `finclear_data`.

**Es decir: cualquier evento de auth vacía todas las finanzas locales y lo persiste a disco.** Y no hace falta un login explícito — `onAuthStateChange` dispara también en el refresh automático de token (`autoRefreshToken: true` en `supabase.ts:10`) y en la recuperación de sesión al abrir la app. No hay confirmación previa, no aparece ningún error en pantalla, y el `catch` de la línea 50 solo escribe a `console.error` (que además no se alcanza, porque nada lanzó).

Nótese que la rama del `else` (líneas 74-79) sí vacía el estado deliberadamente al cerrar sesión, lo cual es intencional y defendible. El problema es la rama del `if`, donde el vaciado es accidental.

Incluso una vez aplicada la migración de H1, este hallazgo sigue siendo un bug: la nube estaría vacía y el primer login post-migración borraría todo lo local igual. Arreglar H1 sin arreglar H2 no reduce el riesgo, lo mantiene.

**Reproducción.** Con datos en `localStorage` y las tablas ausentes: abrir la app estando autenticado, o esperar el refresh de token. El dashboard queda en ceros. Inspeccionar `localStorage.getItem('finclear_data')` en DevTools muestra los arrays vacíos ya persistidos. Antes de intentarlo, exportar un backup — la operación es destructiva y no tiene undo.

---

### H3 — `budgets` nunca se escribe en la nube, pero sí se lee y sobreescribe lo local

**Severidad:** Crítico
**Archivo:** `src/lib/db.ts:26`

```ts
    supabase.from('budgets').select('*'),
```

Y el consumo de ese resultado en `src/components/auth/AuthProvider.tsx:70`:

```tsx
          useStore.getState().setBudgets(cloudData.budgets);
```

**Impacto.** No existe ninguna función `dbUpsertBudget` ni equivalente en `src/lib/db.ts`. El archivo tiene writers para settings, expenses, fixed costs y savings — para budgets, ninguno. `dbOverwriteCloudWithLocal` (líneas 108-164) tampoco los incluye: sube settings, expenses, fixed costs y savings, y salta budgets por completo.

Pero `dbFetchAll` **sí** los selecciona (línea 26) y los expone (línea 34), y `AuthProvider` **sí** los aplica sobre el estado local (líneas 45 y 70).

El flujo es unidireccional en la dirección equivocada: los budgets se leen de una fuente donde nunca se escriben. Cualquier budget creado localmente se pierde en el siguiente evento de auth, sobreescrito por lo que haya en la nube — que es nada, siempre. Es una pérdida de datos garantizada por diseño, no por fallo.

Atenuante circunstancial: el backup del 3 de abril tiene `budgets: []`, y el componente que los crea está muerto (ver H13), así que probablemente nunca se ha perdido un budget real. El defecto estructural sigue presente y se activaría en cuanto se conecte la UI.

**Reproducción.** Crear un budget mediante `setBudgets` desde la consola del navegador, confirmar que persiste en `localStorage`, disparar un evento de auth, observar que `budgets` volvió a `[]`. Buscar `dbUpsertBudget` en el repo no devuelve resultados.

---

### H4 — El ingreso semanal nunca se persiste en Supabase

**Severidad:** Crítico
**Archivo:** `src/components/features/dashboard/WeeklyIncomeEditor.tsx:32`

```tsx
      setIncome(newIncome);
```

La tabla existe en la migración — `supabase/migrations/20260312000000_init.sql:3`:

```sql
CREATE TABLE income (
```

**Impacto.** El editor de ingreso llama únicamente a `setIncome`, que solo toca el store de Zustand. No hay llamada a ninguna función de `db.ts` — y no podría haberla, porque `db.ts` no tiene writer para `income`. Buscar `income` en `src/lib/db.ts` no devuelve ninguna coincidencia.

Simétricamente, `dbFetchAll` tampoco selecciona `income`: la tabla no aparece en el `Promise.all` de las líneas 22-28, y el objeto retornado (líneas 30-37) no incluye la clave. `dbOverwriteCloudWithLocal` tampoco la sube.

El ingreso semanal es el dato del que dependen todos los cálculos derivados de la app —`monthlyIncome`, el disponible por mes, el rollover acumulado, el "Left to Spend"— y es el único que no tiene ninguna ruta hacia la nube, ni de subida ni de bajada. La tabla se declaró en la migración y luego se olvidó por completo en la capa de acceso a datos.

Efecto colateral positivo, y es puro accidente: como `AuthProvider` no llama `setIncome` (no existe `cloudData.income`), el ingreso es el único dato que **sobrevive** al borrado de H2. Es la excepción que confirma la regla.

**Reproducción.** Editar el ingreso semanal en el dashboard, confirmar que se guarda en `localStorage`. Buscar `income` en `src/lib/db.ts`: sin resultados. Consultar la tabla `income` de la nube: 404 (H1), y aunque existiera, estaría vacía.

---

### H5 — Round-trip roto en `fixed_costs`: se escribe `enddate` y se lee `months_left`

**Severidad:** Crítico
**Archivo:** `src/lib/db.ts:32` (lectura) y `src/lib/db.ts:81` (escritura)

La escritura convierte `monthsLeft` en una fecha absoluta:

```ts
    enddate: cost.monthsLeft ? new Date(new Date().setMonth(new Date().getMonth() + cost.monthsLeft)).toISOString() : null,
```

La lectura intenta recuperar una columna que no existe:

```ts
    fixedCosts: (fixedCosts || []).map(fc => ({ ...fc, monthsLeft: fc.months_left ?? null })), // mapped property? (ignoring enddate mapping if not present)
```

El esquema solo declara `enddate` — `supabase/migrations/20260312000000_init.sql:17`:

```sql
  enddate date
```

**Impacto.** No existe ninguna columna `months_left` en el esquema. La conversión es asimétrica: al escribir, `monthsLeft` (un entero de meses restantes) se transforma en `enddate` (una fecha absoluta); al leer, se busca `fc.months_left`, que siempre es `undefined`, y el `?? null` lo convierte en `null` de forma silenciosa. `enddate` se lee del `select('*')` y queda en el objeto como propiedad huérfana que nadie consume, mientras la conversión inversa (de `enddate` a meses restantes) nunca se escribió.

Resultado: **todo `monthsLeft` se vuelve `null` tras un ciclo de recarga desde la nube.** Y eso rompe la lógica de deudas en `src/app/monthly-review/page.tsx:47`:

```tsx
    if (cost.monthsLeft == null) return true;
```

Con `monthsLeft` en `null`, `isDebtActiveInMonth` retorna `true` incondicionalmente: **toda deuda pasa a considerarse activa los doce meses del año.** Los subtotales de deuda se inflan, el disponible mensual se subestima, y el rollover acumulado —que arrastra el error mes a mes en el bucle de las líneas 92-104— propaga la distorsión a todo el año.

El mismo daño alcanza a `DebtCountdown.tsx:16`, donde el filtro `c.monthsLeft` descarta las deudas con `null` y el countdown desaparece del dashboard; y a `src/app/fixed-costs/page.tsx:75` y `:80`, donde la columna de meses y la fecha estimada de liquidación muestran `-`.

El comentario que el propio código arrastra en la línea 32 (`// mapped property? (ignoring enddate mapping if not present)`) sugiere que quien lo escribió ya dudaba del mapeo y lo dejó sin resolver.

Hoy este bug está enmascarado por H1: como el `select` devuelve 404, nunca llega una fila que pudiera perder su `monthsLeft`. **Se manifestará en el momento exacto en que se apliquen las migraciones**, que es justo cuando se creerá que el problema quedó resuelto. Vale la pena arreglarlo en la misma sesión que H1, no después.

**Reproducción.** Requiere las tablas creadas. Guardar una deuda con `monthsLeft = 6`, verificar en la nube que la fila tiene `enddate` poblado y ninguna columna `months_left`, recargar vía `dbFetchAll`, observar `monthsLeft === null`. En Monthly Review la deuda aparece activa los 12 meses.

---

### H6 — Todas las escrituras a la nube se tragan sus errores con `.catch(console.error)`

**Severidad:** Alto
**Archivo:** `src/lib/expenses.ts:20`

```ts
  dbInsertExpense(newExpense).catch(console.error);
```

El patrón se repite en nueve llamadas, todas idénticas en forma:

| Archivo | Líneas |
|---|---|
| `src/lib/expenses.ts` | 20 |
| `src/components/features/expenses/AddExpenseModal.tsx` | 63, 74 |
| `src/app/monthly-review/page.tsx` | 123, 129 |
| `src/components/features/fixed-costs/FixedCostModal.tsx` | 70, 78 |
| `src/components/features/savings/AddContributionModal.tsx` | 72, 80 |

Por ejemplo, en `src/app/monthly-review/page.tsx:123`:

```tsx
    dbUpsertSettings(next, idealSavings).catch(console.error);
```

**Impacto.** Este es el hallazgo que explica *por qué H1 pasó desapercibido cinco meses.*

El patrón en todos los casos es: escribir al store local, disparar la llamada a la nube sin `await`, e ignorar el resultado salvo por un log en consola. La UI cierra el modal y muestra el dato guardado inmediatamente. El usuario recibe confirmación visual de un guardado que en realidad falló.

La ironía es que la capa de datos está bien construida en este aspecto: cada writer de `db.ts` termina en `.throwOnError()`, así que los errores de PostgREST sí se convierten en excepciones. El problema es que la capa de UI las descarta una por una. Los 404 de H1 llevan meses acumulándose en la consola del navegador, invisibles a menos que alguien abra DevTools.

Un fallo silencioso en una app de finanzas es peor que un fallo ruidoso: la confianza en que "está guardado en la nube" es exactamente lo que impide hacer backups manuales.

Vale la pena señalar que el refactor concurrente descrito en *Alcance y metodología* movió este código a `src/lib/expenses.ts` **conservando el `.catch(console.error)` tal cual**. El defecto sobrevivió intacto a una reescritura del camino de alta de gasto, lo que sugiere que se percibe como el patrón normal de la casa y no como una deuda.

El comentario `// Background cloud sync` que precede a varias de estas llamadas indica que el diseño fire-and-forget fue intencional. Es una decisión razonable para latencia percibida; lo que falta es la señal de fallo (un toast, un indicador de estado de sync, una cola de reintentos).

**Reproducción.** Abrir DevTools con la pestaña Console, añadir un gasto. La UI confirma el guardado y cierra el modal. En consola aparece el `PGRST205`. Nada en la interfaz lo indica.

---

### H7 — Sin sesión, los writers retornan temprano como no-op exitoso

**Severidad:** Alto
**Archivo:** `src/lib/db.ts:53-54`

```ts
  const userId = await getUserId();
  if (!userId) return;
```

**Impacto.** La guarda aparece en `dbUpsertSettings` (41-42), `dbInsertExpense` (53-54), `dbUpsertFixedCost` (71-72), `dbInsertSavings` (90-91) y `dbOverwriteCloudWithLocal` (109-110).

`getUserId()` (líneas 7-10) devuelve `session?.user.id`, que es `undefined` cuando no hay sesión: token expirado, refresh fallido, `getSession()` que aún no resolvió. En ese caso la función retorna `undefined` sin lanzar. La promesa **se resuelve**, no se rechaza.

Combinado con H6, el resultado es un no-op que se presenta como éxito: el `.catch(console.error)` no se dispara porque no hubo error, y el dato queda solo en local sin registro de que la subida jamás se intentó. Ni un `console.warn`.

Esta es una guarda defensiva razonable en intención — evita mandar peticiones condenadas al 401 — pero al no distinguir "no aplica" de "falló" hace que un problema de sesión sea indistinguible de un guardado correcto. Un `return { skipped: true }` o un warn serían suficientes para hacerlo observable.

**Reproducción.** Con la app abierta, borrar la clave `finclear-auth` de `localStorage` (el `storageKey` definido en `supabase.ts:9`) sin recargar. Añadir un gasto. Aparece en la UI, se persiste en local, no se emite ninguna petición de red hacia `expenses` y la consola queda limpia.

---

### H8 — `user_id` local es el literal `"temp-user"`; la nube guarda el uid real

**Severidad:** Alto
**Archivo:** `src/lib/expenses.ts:12`

```ts
    user_id: "temp-user",
```

Mientras el insert lo sustituye por el uid de sesión — `src/lib/db.ts:58`:

```ts
    user_id: userId,
```

**Impacto.** El literal está en seis sitios: `src/lib/expenses.ts:12`, `AddExpenseModal.tsx:54`, `AddContributionModal.tsx:58`, `BudgetModal.tsx:45`, `WeeklyIncomeEditor.tsx:28` y `FixedCostModal.tsx:55`. El de `WeeklyIncomeEditor.tsx:28` lleva un comentario explícito: `// to be replaced by auth.uid() later`. Ese "later" no llegó — y el refactor concurrente de hoy añadió una sexta copia en `expenses.ts:12` en vez de resolverlo.

Cada writer de `db.ts` ignora el `user_id` del objeto y lo reemplaza por `userId`. El efecto es que la misma entidad, con el mismo `id` (un UUID de `crypto.randomUUID()`), tiene un `user_id` distinto en local (`"temp-user"`) y en la nube (un UUID real).

Dos problemas concretos. Primero, el esquema declara `user_id uuid REFERENCES auth.users NOT NULL` (`init.sql:22`): `"temp-user"` no es un UUID válido, así que si alguna vez ese valor llegara sin sustitución, el insert fallaría con un error de tipo — y por H6 nadie lo vería. Segundo, y más relevante hoy: el backup verificado del 3 de abril contiene `user_id: "temp-user"` en sus 93 gastos y en el registro de income. Si ese backup se restaura vía `dbOverwriteCloudWithLocal`, el mapeo de las líneas 121-128 lo reescribe con el uid correcto, lo cual funciona — pero deja el JSON local y la nube permanentemente divergentes en ese campo.

Que la app sea de un solo usuario limita el daño real. Sigue siendo un campo que miente de forma consistente, y un `select('*')` que traiga filas de la nube introducirá el uid real en el estado local, dejando el store con dos convenciones mezcladas para el mismo campo.

**Reproducción.** Añadir un gasto e inspeccionar `localStorage.getItem('finclear_data')`: el `user_id` es `"temp-user"`. Contrastar con lo que el insert envía en la pestaña Network: el uid de sesión.

---

### H9 — `DashboardSummary` suma todos los gastos históricos, no los del mes actual

**Severidad:** Medio
**Archivo:** `src/components/features/dashboard/DashboardSummary.tsx:22`

```tsx
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
```

El propio código lo reconoce en la línea inmediatamente anterior:

```tsx
  // Realistically daily spending should be filtered by current month, but for MVP we sum expenses
```

**Impacto.** El `reduce` no filtra por fecha: recorre el array completo de gastos desde el inicio de los tiempos. Ese total alimenta la tarjeta rotulada **"Daily Spending"**, que el usuario lee como gasto del mes en curso.

El problema se agrava en la línea 26:

```tsx
  const leftToSpend = monthlyIncome - monthlyFixedCosts - totalSaved - totalExpenses;
```

Aquí se mezclan magnitudes de periodos distintos en una sola resta: `monthlyIncome` es mensual (`weekly_amount * 4.33`), `monthlyFixedCosts` es mensual, pero `totalExpenses` y `totalSaved` son acumulados históricos. La tarjeta **"Left to Spend"** resta meses de gasto acumulado de un solo mes de ingreso.

Con los 93 gastos y 9 ahorros del backup verificado, el resultado es un "Left to Spend" fuertemente negativo que no corresponde a ninguna realidad financiera. Y empeora monotónicamente con el uso: cada gasto nuevo lo hunde más, sin que ningún cambio de mes lo reinicie. La métrica más prominente del dashboard es la menos fiable de la app.

La página de Monthly Review sí filtra correctamente por mes (`getExpenseForMonth`, líneas 59-67), así que las dos vistas de la app se contradicen entre sí.

**Reproducción.** Cargar el backup del 3 de abril, abrir el dashboard, comparar la tarjeta "Daily Spending" con el subtotal del mes actual en Monthly Review. La primera muestra el acumulado de todos los meses.

---

### H10 — `YEAR = 2026` hardcodeado en Monthly Review

**Severidad:** Medio
**Archivo:** `src/app/monthly-review/page.tsx:13`

```tsx
const YEAR = 2026; // Static for MVP as per previous implementation
```

**Impacto.** La constante se usa como filtro en `getExpenseForMonth` (línea 64, `getYear(d) === YEAR`) y en `getSavingsForMonth` (línea 79), y se muestra en el encabezado de la página (línea 150).

Cualquier gasto o ahorro fuera de 2026 se excluye de todos los cálculos **sin ningún aviso**: no aparece en la tabla, no entra en los subtotales, no afecta al rollover, y no se muestra ninguna nota de que hay datos filtrados. Los datos parecen simplemente no existir.

Hoy el efecto es invisible porque estamos en 2026 y el histórico arranca en marzo de 2026. Se convertirá en un problema silencioso el 1 de enero de 2027, cuando la página siga rotulada "Monthly Review - 2026" y todos los datos nuevos desaparezcan del resumen. Un usuario que revise sus finanzas en enero verá una tabla vacía y no tendrá pista de por qué.

El agravante es la interacción con el rollover: el bucle de las líneas 92-104 arrastra `carryOver` entre meses. Un año mal filtrado no solo pierde sus propios datos, sino que arrastra un saldo acumulado calculado sobre un conjunto incompleto.

También es un límite estructural: no hay forma de consultar un año anterior. La app no tiene selector de año, solo de meses (líneas 158-170).

**Reproducción.** Añadir un gasto con fecha en 2025 o 2027 y abrir Monthly Review. No aparece en ninguna celda ni subtotal. Alternativamente, adelantar el reloj del sistema a 2027 y añadir un gasto: mismo resultado.

---

### H11 — La importación de backup no valida el esquema antes de sobreescribir `localStorage`

**Severidad:** Medio
**Archivo:** `src/components/layout/DataSync.tsx:44`

```tsx
        if (!parsed.state) {
```

Y la escritura que sigue, en la línea 48:

```tsx
        localStorage.setItem('finclear_data', result);
```

**Impacto.** El comentario de la línea 42 es transparente sobre el alcance: `// Very basic validation - just check if it parses as JSON and has 'state'`. La validación completa consiste en (a) que el archivo parsee como JSON y (b) que tenga una propiedad `state` truthy.

No se comprueba que `state.expenses` sea un array, ni que sus elementos tengan `amount` numérico o `date` parseable, ni que `state.income` tenga la forma esperada, ni que los `goal` de savings respeten el CHECK del esquema (`'Emergency Fund'`, `'Tax Savings'`, `'HYS Account'` — `init.sql:32`). Cualquier JSON con la forma `{"state": 1}` pasa la validación.

Lo que se escribe en la línea 48 es **`result`, el string crudo del archivo**, no el objeto validado ni una versión normalizada. La sobreescritura de `finclear_data` es total y destructiva: no hay merge con lo existente, no hay copia de seguridad previa, no hay confirmación del usuario, y no hay undo. La línea 54 luego hace `window.location.reload()`, con lo que el store rehidrata desde ese contenido sin verificar.

Un archivo con la forma correcta pero contenido corrupto —campos faltantes, `amount` como string, fechas mal formadas— reemplaza silenciosamente todas las finanzas y solo se manifiesta después, como `NaN` propagándose por los `reduce` de los subtotales o excepciones en los `parseISO` de Monthly Review. Diagnosticarlo entonces es difícil, porque el dato original ya no existe.

Dado que este import es hoy **el único mecanismo real de recuperación** que tiene la app (por H1, la nube no puede restaurar nada), su fragilidad importa bastante más de lo que sugeriría una severidad media en circunstancias normales.

Nótese además que la línea 51 llama a `dbOverwriteCloudWithLocal(parsed.state)`, y ambas ramas del `.then`/`.catch` (líneas 52-60) recargan la página. El mensaje de éxito de la línea 53 dice "synced to cloud successfully" — hoy, por H1, ese mensaje es simplemente falso, ya que `dbOverwriteCloudWithLocal` retorna temprano por H7 o lanza el 404 hacia el `.catch`.

**Reproducción.** Crear un archivo `{"state": {"expenses": "no soy un array"}}`, importarlo con el botón de Upload Backup. Pasa la validación, sobreescribe `finclear_data`, la app recarga y el dashboard falla al hacer `reduce` sobre un string.

---

### H12 — `withRetry` está definida y nunca se usa

**Severidad:** Bajo
**Archivo:** `src/lib/supabase.ts:21`

```ts
export async function withRetry<T>(
```

**Impacto.** La función ocupa las líneas 21-58 de `supabase.ts`: implementa 3 intentos, timeout de 8 segundos, backoff lineal y normalización de errores a `{ data, error }`. Está exportada y no tiene un solo consumidor — buscar `withRetry` en `src/` solo encuentra su propia definición.

Es código muerto, y su presencia es activamente engañosa: sugiere que la capa de datos tiene resiliencia a fallos de red cuando no la tiene. Ninguna llamada de `db.ts` pasa por ella. El comentario de la línea 31 (`// Though JS Supabase doesn't natively accept abort signals directly on all query builders easily,`) revela que se abandonó a mitad de camino al chocar con la integración.

Hay un detalle a considerar si algún día se conecta: la función lanza cuando `result.error` está poblado (líneas 42-44), lo que significa que **reintentaría tres veces un 404 de PGRST205** — un error permanente de esquema, no transitorio. Conectarla tal cual convertiría cada guardado fallido de H1 en tres peticiones más un backoff de 3 segundos. Necesita distinguir errores reintentables (red, 5xx, timeout) de definitivos (4xx de esquema o permisos) antes de ser útil.

**Reproducción.** `grep -rn "withRetry" src/` devuelve una sola línea: su definición.

---

### H13 — `BudgetModal` no se importa en ningún sitio

**Severidad:** Bajo
**Archivo:** `src/components/features/monthly-review/BudgetModal.tsx:17`

```tsx
export function BudgetModal({ isOpen, onClose, category, existingBudget }: BudgetModalProps) {
```

**Impacto.** El componente está completo y funcional —maneja crear, editar y eliminar budgets vía `setBudgets` (líneas 37, 51, 53)— pero ninguna página ni componente lo importa. Buscar `BudgetModal` en `src/` solo devuelve coincidencias dentro de su propio archivo.

Es la explicación de por qué H3 (budgets sin writer en la nube) no ha causado daño observable: la única UI capaz de crear budgets nunca llegó a montarse. El backup del 3 de abril confirma `budgets: []`.

Los tres se sostienen mutuamente: la feature de budgets está a medias en las tres capas —sin UI conectada (H13), sin writer a la nube (H3), y con lectura que sobreescribe local (H3)—. Si alguien conecta el modal sin arreglar H3, los budgets se crearán y se perderán en el siguiente evento de auth.

`BudgetModal.tsx:45` también contiene el `user_id: "temp-user"` de H8.

**Reproducción.** `grep -rn "BudgetModal" src/` devuelve solo líneas del propio archivo (10, 17). Ningún import externo.

---

### H14 — El ingreso mensual se aproxima como `weekly_amount * 4.33` idéntico para los doce meses

**Severidad:** Bajo
**Archivo:** `src/app/monthly-review/page.tsx:38`

```tsx
  const monthlyIncome = (income?.weekly_amount || 0) * 4.33;
```

La misma expresión, literalmente idéntica, en `src/components/features/dashboard/DashboardSummary.tsx:17`. Y una tercera aparición en `WeeklyIncomeEditor.tsx:38`, con comentario propio: `const currentMonthly = currentWeekly * 4.33; // approx weeks in month`.

**Impacto.** El factor 4.33 (52/12) es el promedio correcto de semanas por mes, así que el total anual cuadra. Lo que no cuadra es la distribución: un mes con 4 pagos semanales y uno con 5 reciben exactamente el mismo ingreso calculado. El comentario de la línea 37 lo asume abiertamente: `// 1. Income (same for all months based on current state)`.

Con el ingreso semanal de 1350 del backup verificado, el cálculo da 5845,50 por mes de forma invariable. Un mes de 4 pagos son 5400 reales (444 de más contabilizados); uno de 5 son 6750 (904 de menos). El error individual es moderado, pero se acumula: el bucle de rollover de las líneas 92-104 arrastra la diferencia mes a mes, así que el "Available" de diciembre carga con el error compuesto de once meses anteriores.

Un segundo efecto es que el ingreso no tiene historia. `monthlyIncome` se calcula del `income` **actual** para todos los meses del año, incluidos los pasados. Cambiar el ingreso semanal reescribe retroactivamente los ingresos de meses ya cerrados, y con ellos toda la cadena de rollover. Combinado con H4 (el ingreso no se persiste en la nube y no existe registro histórico), no hay forma de reconstruir cuál era el ingreso real en un mes anterior.

Severidad baja porque el total anual es correcto y la aproximación es una convención financiera aceptada; se documenta porque la tabla se presenta como un desglose mensual exacto y no advierte en ninguna parte que la fila de Income es una estimación.

**Reproducción.** Fijar el ingreso semanal en 1350, abrir Monthly Review, comprobar que los doce meses muestran 5845,50 en la fila Income. Contarlas contra un calendario: los meses con 5 viernes de pago reciben lo mismo que los de 4.

---

### H15 — Los `dbDelete*` no verifican sesión y dependen solo de RLS *(no verificado de forma independiente)*

**Severidad:** Bajo
**Archivo:** `src/lib/db.ts:66-67`

```ts
export const dbDeleteExpense = async (id: string) => {
  return supabase.from('expenses').delete().eq('id', id).throwOnError();
```

El mismo patrón en `dbDeleteFixedCost` (líneas 85-87) y `dbDeleteSavings` (líneas 103-105).

**Impacto.** A diferencia de todos los writers de inserción, las tres funciones de borrado no llaman a `getUserId()` ni aplican la guarda `if (!userId) return`. Filtran solo por `id`, sin `.eq('user_id', ...)`.

La seguridad recae íntegramente en las políticas RLS de la migración (`init.sql:63-64`, `FOR ALL USING (auth.uid() = user_id)`). Con RLS activo el aislamiento se mantiene: sin sesión válida, `auth.uid()` es null, ninguna fila coincide con la política y el `delete` afecta 0 filas. PostgREST devuelve éxito, no error — así que `.throwOnError()` no dispara y el borrado se reporta como exitoso habiendo eliminado nada. El usuario ve la fila desaparecer de la UI (el store local ya se actualizó) mientras la fila de la nube sobrevive, generando divergencia silenciosa.

Se marca como **no verificado de forma independiente** porque el comportamiento exacto de un `DELETE` bloqueado por RLS a través de PostgREST no se pudo comprobar contra este proyecto: las tablas no existen (H1), así que solo se obtiene el 404. La inconsistencia con los writers de inserción es un hecho verificable en el código; la consecuencia en runtime es una deducción del contrato de RLS.

Con RLS deshabilitado por error, en cambio, un `delete().eq('id', id)` sin filtro de usuario borraría por id sin restricción de propietario. En una app monousuario el riesgo práctico es mínimo.

**Reproducción.** Requiere las tablas creadas. Con una fila en la nube y sin sesión válida en el cliente, invocar `dbDeleteExpense(id)` y comprobar que la promesa resuelve sin error mientras la fila persiste en la base.

---

## Tabla resumen

| ID | Severidad | Archivo | Síntoma |
|---|---|---|---|
| H1 | Crítico | `supabase/migrations/20260312000000_init.sql:20` | La migración init nunca se aplicó: las 5 tablas de datos financieros no existen en la nube (404 PGRST205). `user_settings`, de la migración posterior, sí existe. |
| H2 | Crítico | `src/components/auth/AuthProvider.tsx:66` | Login/refresh de token sobreescribe el estado local sin merge. Con las tablas ausentes, `dbFetchAll` devuelve arrays vacíos truthy: borrado total confirmado en cada evento de auth. |
| H3 | Crítico | `src/lib/db.ts:26` | `budgets` se lee de la nube y sobreescribe lo local, pero no existe ningún writer que los suba. Pérdida garantizada. |
| H4 | Crítico | `src/components/features/dashboard/WeeklyIncomeEditor.tsx:32` | El ingreso semanal solo va al store. `db.ts` no tiene writer para `income` y `dbFetchAll` no la selecciona. |
| H5 | Crítico | `src/lib/db.ts:32` | Round-trip roto: se escribe `enddate` y se lee `fc.months_left`, columna inexistente. `monthsLeft` siempre `null` tras recargar; toda deuda pasa a activa los 12 meses. |
| H6 | Alto | `src/lib/expenses.ts:20` | Las 9 escrituras a la nube usan `.catch(console.error)`. La UI confirma "guardado" sin ninguna garantía. Explica por qué H1 pasó 5 meses inadvertido. |
| H7 | Alto | `src/lib/db.ts:54` | Con `getUserId()` undefined los writers retornan temprano: no-op que resuelve como éxito, sin error ni warn. |
| H8 | Alto | `src/lib/expenses.ts:12` | `user_id` local es el literal `"temp-user"` (6 sitios) mientras el insert lo sustituye por el uid real: local y nube divergen para el mismo `id`. |
| H9 | Medio | `src/components/features/dashboard/DashboardSummary.tsx:22` | "Daily Spending" suma todo el histórico, no el mes actual; "Left to Spend" mezcla ingreso mensual con gasto acumulado. |
| H10 | Medio | `src/app/monthly-review/page.tsx:13` | `YEAR = 2026` hardcodeado: los datos de otros años desaparecen del resumen sin aviso. Rompe en enero de 2027. |
| H11 | Medio | `src/components/layout/DataSync.tsx:44` | El import solo verifica `parsed.state`, luego escribe el JSON crudo a `localStorage` y recarga. Destructivo, sin backup previo ni undo. |
| H12 | Bajo | `src/lib/supabase.ts:21` | `withRetry` definida y exportada, cero consumidores. Sugiere resiliencia que no existe; reintentaría errores permanentes. |
| H13 | Bajo | `src/components/features/monthly-review/BudgetModal.tsx:17` | Componente completo que nadie importa. Es la razón de que H3 no haya causado daño observable aún. |
| H14 | Bajo | `src/app/monthly-review/page.tsx:38` | `weekly_amount * 4.33` idéntico para los 12 meses (3 sitios duplicados); distorsiona meses de 4 vs 5 pagos y el rollover acumula el error. |
| H15 | Bajo | `src/lib/db.ts:66` | Los `dbDelete*` no verifican sesión ni filtran por `user_id`; dependen solo de RLS. *(no verificado de forma independiente)* |

**Distribución:** 5 críticos · 3 altos · 3 medios · 4 bajos · **15 total**

---

## Recomendaciones priorizadas

> ### ⚠️ FUERA DE ALCANCE DE ESTA ENTREGA
>
> **Nada de lo que sigue se arregla esta semana.** Esta entrega es exclusivamente documental: el único archivo creado es este documento. No se modificó ni una línea de `src/`, `supabase/`, `package.json`, configs ni `.env.local`. No se aplicó ninguna migración ni se escribió en la nube.
>
> Las recomendaciones son un plan propuesto para una sesión futura, con el orden razonado. Sirven para decidir, no para ejecutar hoy.

### Orden 0 — Antes de tocar código: asegurar los datos

No es una recomendación de código y por eso va antes que todo lo demás.

El backup verificado es del **3 de abril**. Todo lo capturado desde entonces existe solo en el `localStorage` de un navegador, y H2 está activo: el próximo evento de auth puede vaciarlo. Cinco meses de datos dependen de que nadie abra la app en el estado equivocado.

Antes de cualquier arreglo: abrir la app en el navegador que tenga los datos buenos, usar el botón de Download Backup, y guardar el archivo junto al del 3 de abril. Verificar que el JSON nuevo tiene más de 93 gastos antes de considerarlo hecho.

Es la única acción de esta lista cuyo coste es de un minuto y cuyo valor es todo el histórico.

### Orden 1 — H2: cortar el riesgo de borrado antes de habilitar el sync

**Por qué primero.** Es contraintuitivo pero importa: si se arregla H1 antes que H2, el primer login post-migración encuentra una nube legítimamente vacía y borra todo lo local, esta vez sin ningún 404 de por medio. **Aplicar las migraciones sin arreglar H2 primero es la secuencia que más datos puede destruir.**

Dirección propuesta: hacer que `dbFetchAll` distinguja "la nube no respondió" de "la nube está vacía" —propagando el `error` de cada `select` en vez de colapsarlo a `[]`— y que `AuthProvider` nunca aplique un resultado vacío sobre un estado local poblado. Un merge por `id` es lo correcto a medio plazo; una guarda que rechace el overwrite cuando la nube viene vacía y local no, es suficiente para detener la hemorragia.

### Orden 2 — H6 y H7: hacer visible el fallo

**Por qué antes de las migraciones.** H6 es la razón de que este informe exista en agosto y no en marzo. Mientras los errores sigan yendo a `console.error`, cualquier arreglo posterior se validará a ciegas y el siguiente fallo de sync tardará otros cinco meses en descubrirse.

No hace falta una solución elaborada: un indicador de estado de sincronización, o un toast en el fallo, convierte los siguientes pasos en verificables. Y en H7, distinguir el retorno temprano del éxito real, aunque sea con un `console.warn`.

Este paso es la instrumentación que permite confiar en los resultados de los pasos 3 y 4.

### Orden 3 — H1 y H5 juntos: aplicar migraciones y arreglar el mapeo en la misma sesión

**Por qué juntos.** H5 está hoy enmascarado por H1: no llegan filas, así que ningún `monthsLeft` se pierde. Se manifestará exactamente en el momento en que se apliquen las migraciones — justo cuando se crea que el problema quedó resuelto. Aplicar H1 sin H5 cambia un bug visible (nada sincroniza) por uno sutil (las deudas se muestran activas los 12 meses y los subtotales mienten).

Al aplicar la migración init, verificar que las cinco tablas responden 200 y decidir la dirección del mapeo de `fixed_costs`: o se persiste `months_left` en el esquema, o se escribe la conversión inversa de `enddate` a meses restantes al leer. Cualquiera sirve; lo que no sirve es la asimetría actual.

Tras esto, un `dbOverwriteCloudWithLocal` con el backup fresco del Orden 0 hace la primera subida real de la historia del proyecto.

### Orden 4 — H3 y H4: completar los writers que faltan

`dbUpsertBudget` y un writer para `income`, más incluir `income` en el `select` de `dbFetchAll` y en `dbOverwriteCloudWithLocal`.

**Por qué después.** No son urgentes por razones distintas en cada caso. H3 no ha causado daño porque su UI está desconectada (H13), así que puede esperar. H4 sí afecta un dato crítico —el ingreso alimenta todos los cálculos derivados— pero hoy tiene un blindaje accidental: al no estar en `dbFetchAll`, es el único dato que sobrevive al borrado de H2. Conectarlo a la nube **antes** de arreglar H2 le quitaría esa protección. Su orden es una consecuencia directa de eso.

En H3, decidir primero si la feature de budgets se quiere: si no, borrar `BudgetModal` y quitar `budgets` de `dbFetchAll` y del store cierra H3 y H13 de una vez, y es menos trabajo que completarla.

### Orden 5 — H9, H10, H11: corrección de cálculos y robustez del import

Ya con el sync funcionando y observable, estos son defectos acotados y de arreglo independiente:

- **H9** — filtrar `totalExpenses` por mes actual y homogeneizar los periodos de `leftToSpend`. Es el arreglo con mejor relación valor/esfuerzo de la lista: son las dos métricas más visibles del dashboard y la lógica correcta ya existe en Monthly Review, lista para reutilizar.
- **H10** — sustituir `YEAR` por un selector de año, o al menos por `getYear(new Date())`. Tiene fecha de vencimiento conocida: 1 de enero de 2027.
- **H11** — validar la forma de `state` antes de sobreescribir, y guardar el contenido anterior de `finclear_data` antes de reemplazarlo. Sube de prioridad mientras el import siga siendo el único mecanismo real de recuperación; baja en cuanto el sync de la nube funcione de verdad.

### Orden 6 — H8, H12, H13, H14, H15: limpieza

Sin urgencia, agrupables en una sola sesión de mantenimiento:

- **H8** — sustituir `"temp-user"` por el uid real de sesión en los 6 sitios, o extraer el `user_id` del objeto local si se acepta que el writer lo sobreescriba siempre.
- **H12** — borrar `withRetry` o conectarla. Si se conecta, antes distinguir errores reintentables de definitivos: tal como está, reintentaría tres veces un 404 de esquema.
- **H13** — borrar `BudgetModal` o conectarlo, según lo decidido en el Orden 4.
- **H14** — extraer el `* 4.33` duplicado en 3 archivos a una única función de `utils.ts`. Consolidar primero; decidir después si se quiere ingreso real por mes, que es un cambio de modelo de datos (requiere histórico de ingreso) y no una corrección de fórmula.
- **H15** — añadir la guarda de sesión a los tres `dbDelete*` por consistencia con el resto de los writers, y verificar en el dashboard de Supabase que RLS quedó activo tras aplicar las migraciones.

### Nota final sobre el orden

La secuencia no está ordenada por severidad, y eso es deliberado. Va ordenada por **riesgo de destruir datos al arreglar**. H2 antes que H1 no porque sea más grave, sino porque arreglar H1 primero convierte H2 en un borrado limpio y sin rastro. H6 antes que las migraciones porque sin observabilidad los pasos siguientes no se pueden validar. Y H4 después de H2 porque hoy su propio bug lo está protegiendo.

En un sistema donde los fallos han sido silenciosos durante cinco meses, el orden de los arreglos es tan importante como los arreglos.
