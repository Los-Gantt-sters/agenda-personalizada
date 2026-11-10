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
         supabase/tests/secuencia_dia_test.sql; do
  docker exec -i pg-prueba psql -U postgres -q -v ON_ERROR_STOP=1 < "$f" || break
done
docker stop pg-prueba
```

Debe terminar con `NOTICE: secuencia_dia: las 7 comprobaciones pasan`.

`supabase_minimo.sql` crea lo mínimo de Supabase (esquema `auth`, `auth.uid()`, roles `authenticated` y `anon`) para que las migraciones carguen en un PostgreSQL normal. Con Supabase real o `supabase start` no hace falta.
