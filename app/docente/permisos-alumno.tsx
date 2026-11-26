/**
 * Ruta `/docente/permisos-alumno` — Pantalla 26d (Permisos del alumno simplificados)
 * conectada a `public.preferencias_alumnos` en Supabase y enlazada con la Pantalla 07e
 * (HU-23 / SCRUM-141 / SCRUM-143).
 */

import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { PantallaPermisosAlumno26d } from "../../src/componentes/permisos-alumno";
import { supabase } from "../../src/lib/supabaseClient";
import {
  crearPermisosAlumnoPorDefecto,
  obtenerPermisosAlumno26d,
} from "../../src/servicios/permisosAlumnoService";
import { useSesion } from "../../src/sesion";
import type { PermisosAlumno26d } from "../../src/tipos/permisosAlumno";

/**
 * Pantalla de ruta Expo Router para configurar los permisos de un alumno real (26d).
 * Si recibe `alumnoId` por parámetro (p. ej. desde la Ficha 37), usa ese alumno;
 * si no, resuelve el primer alumno real disponible en `public.alumnos`.
 * @returns Vista de la Pantalla 26d conectada a `preferencias_alumnos` y a la vista previa 07e
 */
export default function DocentePermisosAlumnoScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();
  const params = useLocalSearchParams<{ alumnoId?: string; nombre?: string }>();

  const alumnoIdParam =
    typeof params.alumnoId === "string" && params.alumnoId.trim().length > 0
      ? params.alumnoId.trim()
      : undefined;
  const nombreParam =
    typeof params.nombre === "string" && params.nombre.trim().length > 0
      ? params.nombre.trim()
      : undefined;

  const [permisos, setPermisos] = useState<PermisosAlumno26d>(() =>
    crearPermisosAlumnoPorDefecto(alumnoIdParam ?? "", nombreParam),
  );
  const [cargado, setCargado] = useState<boolean>(false);

  useEffect(() => {
    let activo = true;

    async function cargarAlumnoYPermisos() {
      let idObjetivo = alumnoIdParam;
      let nombreObjetivo = nombreParam;

      if (!idObjetivo) {
        const { data: primerAlumno } = await supabase
          .from("alumnos")
          .select("id, nombre")
          .order("nombre", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (primerAlumno?.id) {
          idObjetivo = primerAlumno.id as string;
          nombreObjetivo = (primerAlumno.nombre as string | null) ?? nombreObjetivo;
        }
      }

      if (!idObjetivo) {
        if (activo) setCargado(true);
        return;
      }

      const res = await obtenerPermisosAlumno26d(idObjetivo, nombreObjetivo, {
        forzarRemoto: true,
      });
      if (activo) {
        setPermisos(res);
        setCargado(true);
      }
    }

    cargarAlumnoYPermisos().catch(() => {
      if (activo) setCargado(true);
    });

    return () => {
      activo = false;
    };
  }, [alumnoIdParam, nombreParam]);

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  return (
    <>
      <Stack.Screen options={{ title: `Permisos · ${permisos.nombreAlumno}` }} />
      <PantallaPermisosAlumno26d
        key={`${permisos.alumnoId}-${cargado ? permisos.actualizadoEn : "inicial"}`}
        alumnoId={permisos.alumnoId}
        nombreAlumno={permisos.nombreAlumno}
        nombreTutor={sesion?.user?.fullName ?? "Carmen Ruiz"}
        formatosIniciales={permisos.formatosPermitidos}
        entradaInicial={permisos.entradaTrasLogin}
        mostrarPreferenciasInicial={permisos.mostrarBotonPreferencias16}
        alGuardar={(guardados) => {
          setPermisos(guardados);
        }}
        alAbrirVistaPrevia07e={() => {
          router.push({
            pathname: "/ejecucion-restringida",
            params: {
              alumnoId: permisos.alumnoId,
              nombre: permisos.nombreAlumno,
            },
          });
        }}
        alAtras={() => router.back()}
        alCerrarSesion={handleLogout}
      />
    </>
  );
}
