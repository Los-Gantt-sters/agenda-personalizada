# Pruebas de la base de datos

## `secuencia_dia` (SCRUM-71 · T-06.3, HU-06)

Función de la migración `supabase/migrations/20261110000000_secuencia_dia.sql`. Devuelve las tareas del día de un estudiante **en orden cronológico** (RF4.1), con el mismo formato que `EntradaAgenda` de la agenda (`src/componentes/agenda/tipos.ts`).

```ts
const { data, error } = await supabase.rpc("secuencia_dia", {
  p_estudiante: estudianteId, // UUID del alumno
  p_fecha: "2026-11-12", // AAAA-MM-DD
});
```

### Qué hace
- Lee `asignaciones` + `tareas` + `pasos_tarea` del esquema (T-T01.2).
- Solo las asignaciones de **ese alumno y ese día**; quita las **canceladas** y las de tareas **desactivadas** (`tareas.activo = false`).
- Ordena por **hora de inicio** (la de la asignación o, si no tiene, la de la tarea), luego por **orden**; las que no tienen hora van **al final**.
- Traduce al formato de la agenda: estado `hecho` / `completada` → `hecha`; duración = de `hora_inicio` a `hora_fin` de la asignación o, si no hay, `duracion_estimada_minutos` de la tarea; pasos ordenados con `imagen_url` → `pictograma_url`.
- `SECURITY INVOKER`: respeta las políticas RLS de quien la llama. Solo pueden ejecutarla usuarios con sesión (`authenticated`).

### Ejemplo de una fila
```json
{
  "id": "…a03",
  "estudiante_id": "…001",
  "tarea_id": "…e2",
  "fecha": "2026-11-12",
  "hora_inicio": "09:30:00",
  "duracion_prevista_min": 10,
  "orden": 2,
  "estado": "en_curso",
  "tarea": {
    "id": "…e2",
    "titulo": "Ordenar mi mesa",
    "pictograma_url": null,
    "descripcion": null,
    "pasos": [
      { "orden": 1, "texto": "Recoge los papeles", "pictograma_url": "https://picto/papeles.png" },
      { "orden": 2, "texto": "Guarda los lápices", "pictograma_url": "https://picto/lapices.png" }
    ]
  }
}
```

> **Nota:** el servicio de la agenda (`src/servicios/agendaService.ts`) todavía lee de las tablas `entrada_agenda` y `tarea`, que no existen en el esquema. Se ha acordado con Ana dejarlo así en el Sprint 1; para conectarlo basta con sustituir la consulta de `obtenerSecuenciaDia` por la llamada de arriba (su propio `TODO(T-06.3)`).

### Cómo repetir la prueba (PostgreSQL en Docker)
`secuencia_dia_test.sql` crea datos de prueba dentro de una transacción que se deshace al final y hace 7 comprobaciones (orden, filtros, estados, duración, hora heredada, pasos, día vacío y permisos). Si alguna falla, se para con `FALLA …`.

```bash
docker run -d --rm --name pg-prueba -e POSTGRES_PASSWORD=prueba postgres:16
# esperar unos segundos a que arranque
for f in supabase/tests/supabase_minimo.sql \
         supabase/migrations/20261105000000_schema_inicial.sql \
         supabase/migrations/20261110000000_secuencia_dia.sql \
         supabase/migrations/20261123100000_auto_pendiente.sql \
         supabase/tests/secuencia_dia_test.sql \
         supabase/migrations/20261124000000_aulas_configurables.sql \
         supabase/migrations/20261125000000_acceso_alumnos_sin_sesion.sql \
         supabase/tests/auto_pendiente_test.sql \
         supabase/tests/acceso_alumnos_test.sql; do
  docker exec -i pg-prueba psql -U postgres -q -v ON_ERROR_STOP=1 < "$f" || break
done
docker stop pg-prueba
```

Debe terminar con `NOTICE: secuencia_dia: las 7 comprobaciones pasan`, `NOTICE: auto_pendiente: las 11 comprobaciones pasan` y `NOTICE: acceso_alumnos: las 6 comprobaciones pasan`.

## Caducidad automática (SCRUM-265 · T-AUTO.1, SCRUM-237)

`caducar_tareas_agenda()` pasa a `pendiente`, con `pendiente_motivo = 'tiempo_agotado'`, las tareas cuya franja ha terminado sin pulsar «Terminar». En Supabase se ejecuta cada minuto con `pg_cron`; en un PostgreSQL sin esa extensión, la migración avisa y no programa nada.

> **Orden de despliegue:** aplicar `20261123100000_auto_pendiente.sql` solo cuando la pantalla 10b (SCRUM-264) esté en `main`. Sin ella, una tarea caducada se ve como una pendiente normal y vuelve a «Ahora».

`supabase_minimo.sql` crea lo mínimo de Supabase (esquema `auth`, `auth.uid()`, roles `authenticated` y `anon`) para que las migraciones carguen en un PostgreSQL normal. Con Supabase real o `supabase start` no hace falta.

## Acceso del alumno sin sesión (SCRUM-249 · T-01.7, MOD HU-01)

La pantalla de acceso del alumno (01 y 02) se ve **antes** de iniciar sesión, y las políticas RLS de `aulas` y `alumnos` solo dejan leer a usuarios con sesión. La migración `20261125000000_acceso_alumnos_sin_sesion.sql` crea dos funciones que puede llamar `anon` y que devuelven solo lo que pinta la pantalla:

| Función | Devuelve | Pantalla |
|---|---|---|
| `aulas_acceso()` | `id`, `nombre`, `icono_forma`, `icono_url`, `orden` (en el orden de la 48b) | 01 / 01b |
| `alumnos_acceso(p_aula)` | `id`, `nombre` (de pila), `icono_personal`, `color_identificativo` de los alumnos **activos** del aula | 02 / 02b |

**Protección de datos:** no salen apellidos, expediente, fecha de nacimiento, dieta, método ni secuencia de acceso. La **foto** tampoco, de momento: junto al `id` y con solo 729 contraseñas posibles (3 dibujos de 9) facilitaría intentar entrar a ciegas; queda pendiente de decidir en el equipo cómo protegerla. `acceso_alumnos_test.sql` comprueba el orden, que solo salen los alumnos activos del aula, las columnas exactas que devuelven, los permisos de `anon` y que `anon` sigue sin políticas sobre las tablas. En la app las usa `src/servicios/accesoAlumnosService.ts`; si fallan o no hay Supabase configurado, la pantalla usa sus datos de prueba.
