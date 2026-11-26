/**
 * Ruta `/ejecucion-restringida` — Pantalla 07e (Ejecución paso a paso restringida
 * según los permisos guardados en `permisos_alumno_26d`) (HU-23 / SCRUM-141 / SCRUM-143).
 */

import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { PantallaEjecucionRestringida07e } from "../src/componentes/permisos-alumno";
import {
  crearPermisosRestringidosDemo07e,
  obtenerPermisosAlumno26d,
} from "../src/servicios/permisosAlumnoService";
import type { PermisosAlumno26d } from "../src/tipos/permisosAlumno";

/**
 * Pantalla de ruta Expo Router para la ejecución paso a paso restringida del alumno (07e).
 * @returns Vista de la Pantalla 07e con formatos multimedia y Preferencias (16) filtrados desde Supabase
 */
export default function EjecucionRestringidaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alumnoId?: string; nombre?: string }>();

  const alumnoId =
    typeof params.alumnoId === "string" && params.alumnoId.trim().length > 0
      ? params.alumnoId.trim()
      : "ale";
  const nombreParam =
    typeof params.nombre === "string" && params.nombre.trim().length > 0
      ? params.nombre.trim()
      : "Alejandro";

  const [permisos, setPermisos] = useState<PermisosAlumno26d>(() =>
    crearPermisosRestringidosDemo07e(alumnoId, nombreParam),
  );

  useEffect(() => {
    let activo = true;
    obtenerPermisosAlumno26d(alumnoId, nombreParam, { forzarRemoto: true })
      .then((res) => {
        if (activo) setPermisos(res);
      })
      .catch(() => {
        // Conserva el perfil restringido de demostración si no hay conexión
      });
    return () => {
      activo = false;
    };
  }, [alumnoId, nombreParam]);

  return (
    <>
      <Stack.Screen options={{ title: "Ejecución de tarea" }} />
      <PantallaEjecucionRestringida07e
        nombreAlumno={permisos.nombreAlumno}
        formatosPermitidos={permisos.formatosPermitidos}
        mostrarBotonPreferencias16={permisos.mostrarBotonPreferencias16}
        alAtras={() => router.back()}
        alTerminarTarea={() => router.back()}
        alAbrirPreferencias={() => router.push("/preferencias")}
      />
    </>
  );
}
