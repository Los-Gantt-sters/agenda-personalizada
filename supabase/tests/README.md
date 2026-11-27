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
- Devuelve también `pendiente_motivo` (SCRUM-265), `requiere_inicio_fin` (si la tarea pide pulsar «Empezar», RF6.8; `true` por defecto) e `inicio_real` / `fin_real` (horas reales de `ejecuciones`, RI6.1; `null` si no se ha empezado). Estos tres últimos, desde `20261124230000_requiere_inicio_fin.sql` (SCRUM-225).
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
`secuencia_dia_test.sql` crea datos de prueba dentro de una transacción que se deshace al final y hace 9 comprobaciones (orden, filtros, estados, duración, hora heredada, pasos, día vacío, permisos, `requiere_inicio_fin` y horas reales). Si alguna falla, se para con `FALLA …`.

```bash
docker run -d --rm --name pg-prueba -e POSTGRES_PASSWORD=prueba postgres:16
# esperar unos segundos a que arranque
for f in supabase/tests/supabase_minimo.sql \
         supabase/migrations/20261105000000_schema_inicial.sql \
         supabase/migrations/20261110000000_secuencia_dia.sql \
         supabase/migrations/20261123100000_auto_pendiente.sql \
         supabase/migrations/20261124230000_requiere_inicio_fin.sql \
         supabase/migrations/20261126000000_seguridad_perfiles_vinculos.sql \
         supabase/migrations/20261128000000_progreso_alumno.sql \
         supabase/migrations/20261128100000_agenda_compartida_y_franjas.sql \
         supabase/migrations/20261129000000_emociones_feedback.sql \
         supabase/tests/secuencia_dia_test.sql \
         supabase/tests/auto_pendiente_test.sql \
         supabase/tests/seguridad_perfiles_vinculos_test.sql \
         supabase/tests/progreso_alumno_test.sql \
         supabase/tests/agenda_compartida_y_franjas_test.sql \
         supabase/tests/emociones_feedback_test.sql; do
  docker exec -i pg-prueba psql -U postgres -q -v ON_ERROR_STOP=1 < "$f" || break
done
docker stop pg-prueba
```

Debe terminar con `NOTICE: secuencia_dia: las 9 comprobaciones pasan`, `NOTICE: auto_pendiente: las 11 comprobaciones pasan`, `NOTICE: seguridad_perfiles_vinculos: las 13 comprobaciones pasan` `NOTICE: progreso_alumno: las 13 comprobaciones pasan`, `NOTICE: agenda_compartida_y_franjas: las 14 comprobaciones pasan` y `NOTICE: SCRUM-136: OK` (el alumno guarda las 5 emociones y no se admite ninguna otra).

## Caducidad automática (SCRUM-265 · T-AUTO.1, SCRUM-237)

`caducar_tareas_agenda()` pasa a `pendiente`, con `pendiente_motivo = 'tiempo_agotado'`, las tareas cuya franja ha terminado sin pulsar «Terminar». En Supabase se ejecuta cada minuto con `pg_cron`; en un PostgreSQL sin esa extensión, la migración avisa y no programa nada.

> **Orden de despliegue:** aplicar `20261123100000_auto_pendiente.sql` solo cuando la pantalla 10b (SCRUM-264) esté en `main`. Sin ella, una tarea caducada se ve como una pendiente normal y vuelve a «Ahora».

`supabase_minimo.sql` crea lo mínimo de Supabase (esquema `auth`, `auth.uid()`, roles `authenticated` y `anon`) para que las migraciones carguen en un PostgreSQL normal. Con Supabase real o `supabase start` no hace falta.

## Seguridad de perfiles y vínculos (SCRUM-278 · T-ADM.6)

La migración `20261126000000_seguridad_perfiles_vinculos.sql` cierra dos políticas de `schema_inicial.sql` que dejaban saltarse la seguridad por filas:

- **`perfiles`:** un usuario podía cambiarse su propio `rol` (un familiar podía hacerse `admin`). Ahora un disparador (`proteger_campos_perfil`) solo deja a administración cambiar `rol`, `activo`, `centro_id` y `email`. El resto del perfil (p. ej. el nombre) lo sigue cambiando cada usuario, y el editor SQL de Supabase y `service_role` no se bloquean.
- **`vinculos_alumno_supervisor`:** cualquier tutor o familiar podía crear o borrar vínculos de cualquier alumno. Ahora solo administración o el tutor de ese alumno (`is_tutor_docente_of_student`). El alta de alumnos de un tutor sigue funcionando si es el tutor titular del aula.

`seguridad_perfiles_vinculos_test.sql` comprueba las dos cosas con usuarios simulados (13 comprobaciones). Sin la migración falla con «una familia ha podido cambiarse el rol».

## Progreso del alumno (SCRUM-145 · T-25.1, HU-25)

`progreso_alumno(p_estudiante, p_desde, p_hasta)` devuelve en un solo JSON lo que necesita la pantalla 43 «Progreso e historial», la misma para tutor y familia:

```ts
const { data, error } = await supabase.rpc("progreso_alumno", {
  p_estudiante: estudianteId, // UUID del alumno
  p_desde: "2026-11-23", // AAAA-MM-DD, incluido
  p_hasta: "2026-11-29", // AAAA-MM-DD, incluido (como mucho, un año después de p_desde)
});
```

- **`alumno`:** `{ id, nombre }`, para el título de la pantalla.
- **`resumen`:** `total`, `hechas`, `pendientes`, `en_curso`, `bloqueadas`, `sin_terminar` (pendientes porque se acabó su tiempo, SCRUM-265) y `planes_b` (con Plan B activado).
- **`emociones`:** `[{ emocion, total }]`, de la más a la menos frecuente (columna `ejecuciones.valoracion_emocional`).
- **`dias`:** `[{ fecha, total, hechas }]` de cada día del periodo que tiene tareas.
- **`tareas`:** la tabla, en orden de día y hora: `fecha`, `hora` (HH:MM, la de la asignación o la de la tarea), `titulo`, `pictograma_url`, `ambito` (`centro` o `hogar`), `estado` (`hecha`, `pendiente`, `en_curso` o `bloqueada`), `pendiente_motivo`, `plan_b`, `emocion`, `inicio_real` y `fin_real`.
- **`avisos`:** lo que ha pedido en «Ayuda» en el periodo (`necesidad`, `urgencia`, `atendido`, `creado_en`), del más reciente al más antiguo. El día se cuenta con la hora de Madrid.

Mismos criterios que `secuencia_dia`: las canceladas no cuentan y `hecho`/`completada` salen como `hecha`. Las tareas desactivadas después sí cuentan, porque son historial.

**Tutor y familia ven todas las tareas del alumno, de clase y de casa**: los dos tienen que saber qué hace en el colegio y en casa. Lo que se reparte es el horario para poner tareas (ver la sección siguiente). La función es `SECURITY DEFINER` y comprueba ella misma quién llama: rechaza (`42501`) a quien no es administración, tutor o especialista del alumno o su familia, y también al rol `authenticated` sin usuario. Así, un alumno no ve el progreso de otro. Desde el editor SQL de Supabase (sin sesión) funciona y lo ve todo.

`progreso_alumno_test.sql` hace 13 comprobaciones: alumno y resumen, emociones, días, orden y campos de la tabla, avisos por día de Madrid, que el tutor ve también las tareas de casa, que la familia ve también las de clase, permisos, periodos no válidos, periodo vacío, sin sesión (app y editor SQL) y que `anon` no pueda ejecutarla.

## Agenda completa y tramos horarios (SCRUM-144, HU-25)

`20261128100000_agenda_compartida_y_franjas.sql` aplica la regla del centro:

- **Tutor y familia ven la agenda completa del alumno**, lo que hace en el colegio y en casa. La política «Tareas: Lectura segregada RGPD» (que dejaba al tutor ver solo las de clase y a la familia solo las de casa) se sustituye por «Tareas: Lectura de la agenda completa». Quien supervisa al alumno (`supervisa_tarea`) ve todas sus tareas y también las del catálogo común que tiene asignadas. Con esto `secuencia_dia` (agenda 39/40) y los pasos (`puede_ver_tarea`, si está la migración de pasos) devuelven a los dos adultos las tareas de clase y de casa.
- **Cada uno pone tareas en su tramo:** el tutor (y los especialistas) de 08:00 a 15:00 y la familia de 15:00 a 08:00, como en la pantalla 28c. Lo comprueba un disparador en `asignaciones` al poner una tarea en la agenda, al cambiarle el día o la hora y al quitarla.
- **Cómo se calcula el tramo:** la franja va de la hora de inicio a la de fin (si no hay fin, el inicio más la duración estimada de la tarea). Si pasa de un tramo a otro (p. ej. de 14:30 a 15:30), no la puede poner ninguno de los dos. Si la tarea no tiene hora, manda su ámbito: `centro` es del tutor y `hogar` de la familia. Al que se sale de su tramo se le rechaza con `42501` y un mensaje que dice qué horario le toca.
- **Lo que no se limita:** los cambios de estado (Empezar, Terminar, bloquear, Plan B) no dependen del tramo, aunque la app reenvíe la misma hora. Administración, el alumno y lo que se hace sin sesión (editor SQL, `service_role`, `pg_cron`) tampoco tienen límite.
- **Lo que no cambia:** crear, cambiar y borrar la definición de una tarea sigue siendo por ámbito: la familia no crea tareas de clase ni el tutor de casa.

`agenda_compartida_y_franjas_test.sql` hace 14 comprobaciones:

1. Los tramos: mañana, tarde, noche, madrugada y los que pasan de uno a otro.
2. La familia lee las tareas de clase y las del catálogo, y la agenda del día le devuelve las tres.
3. El tutor lee también las de casa.
4. Otro tutor y otra familia no ven nada.
5. El tutor pone tareas por la mañana.
6. El tutor no puede poner tareas por la tarde ni que pasen de las 15:00, ni tareas de casa sin hora.
7. El tutor no mueve de hora ni de día la tarea de la familia, ni la quita.
8. El tutor sí cambia su estado.
9. El tutor mueve las suyas.
10. La familia pone tareas por la tarde, de noche y de madrugada.
11. La familia no puede poner tareas por la mañana ni que entren en las 08:00.
12. La familia no mueve las suyas a la mañana ni quita las del tutor, pero sí quita las suyas.
13. La familia no crea tareas de clase.
14. Administración y el editor SQL no tienen límite de horario.
