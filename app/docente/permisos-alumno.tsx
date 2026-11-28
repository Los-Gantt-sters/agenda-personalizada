/**
 * Ruta `/docente/permisos-alumno` — Pantalla 26d (Permisos del alumno simplificados)
 * conectada a `public.preferencias_alumnos` en Supabase y enlazada con la Pantalla 07e
 * (HU-23 / SCRUM-141 / SCRUM-143).
 *
 * - Con `?alumnoId=<uuid>` (p. ej. desde la ficha 37) abre directamente la 26d de ese alumno.
 * - Sin él (desde el panel del tutor), primero se elige el alumno entre los del tutor; si solo
 *   tiene uno, se abre el suyo. «Atrás» en la 26d vuelve a la lista para elegir otro.
 */

import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ElegirAlumno26d,
  PantallaPermisosAlumno26d,
  type AlumnoElegible26d,
} from "../../src/componentes/permisos-alumno";
import { obtenerAlumnos } from "../../src/servicios/alumnosService";
import {
  crearPermisosAlumnoPorDefecto,
  obtenerPermisosAlumno26d,
} from "../../src/servicios/permisosAlumnoService";
import { useSesion } from "../../src/sesion";
import type { PermisosAlumno26d } from "../../src/tipos/permisosAlumno";

const ERROR_CARGA = "No se han podido cargar tus alumnos. Inténtalo otra vez.";

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

  // Alumno cuya 26d se está viendo (null = toca elegirlo).
  const [elegido, setElegido] = useState<AlumnoElegible26d | null>(
    alumnoIdParam ? { id: alumnoIdParam, nombre: nombreParam ?? "" } : null,
  );
  // Lista de los alumnos del tutor (solo hace falta si no viene el alumno en la ruta).
  const [alumnos, setAlumnos] = useState<AlumnoElegible26d[]>([]);
  const [cargandoAlumnos, setCargandoAlumnos] = useState<boolean>(!alumnoIdParam);
  const [errorAlumnos, setErrorAlumnos] = useState<string | null>(null);

  // Permisos leídos de Supabase; solo valen si son del alumno elegido ahora.
  const [leidos, setPermisos] = useState<PermisosAlumno26d | null>(null);
  const permisos = elegido && leidos?.alumnoId === elegido.id ? leidos : null;

  useEffect(() => {
    if (alumnoIdParam) return;
    let activo = true;
    obtenerAlumnos()
      .then((res) => {
        if (!activo) return;
        if (!res.success || !res.data) {
          setErrorAlumnos(ERROR_CARGA);
          return;
        }
        const lista = res.data.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          apellidos: a.apellidos,
          color: a.colorIdentificativo,
        }));
        setAlumnos(lista);
        // Con un solo alumno no hay nada que elegir.
        if (lista.length === 1) setElegido(lista[0]);
      })
      .catch(() => {
        if (activo) setErrorAlumnos(ERROR_CARGA);
      })
      .finally(() => {
        if (activo) setCargandoAlumnos(false);
      });
    return () => {
      activo = false;
    };
  }, [alumnoIdParam]);

  useEffect(() => {
    if (!elegido) return;
    let activo = true;
    obtenerPermisosAlumno26d(elegido.id, elegido.nombre || undefined, { forzarRemoto: true })
      .then((res) => {
        if (activo) setPermisos(res);
      })
      .catch(() => {
        if (activo) setPermisos(crearPermisosAlumnoPorDefecto(elegido.id, elegido.nombre));
      });
    return () => {
      activo = false;
    };
  }, [elegido]);

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  const volverAlPanel = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace("/docente/agenda");
  };

  if (!elegido) {
    return (
      <>
        <Stack.Screen options={{ title: "Permisos del alumno" }} />
        <ElegirAlumno26d
          alumnos={alumnos}
          cargando={cargandoAlumnos}
          error={errorAlumnos}
          alElegir={setElegido}
          alAtras={volverAlPanel}
          alCerrarSesion={handleLogout}
        />
      </>
    );
  }

  // Si se llegó eligiendo de la lista (y había más de uno), «Atrás» vuelve a la lista.
  const atrasALista = !alumnoIdParam && alumnos.length > 1;
  const datos = permisos ?? crearPermisosAlumnoPorDefecto(elegido.id, elegido.nombre);

  return (
    <>
      <Stack.Screen options={{ title: `Permisos · ${datos.nombreAlumno}` }} />
      <PantallaPermisosAlumno26d
        // Se vuelve a montar al llegar los datos guardados, para que salgan marcados.
        key={`${datos.alumnoId}-${permisos ? permisos.actualizadoEn : "cargando"}`}
        alumnoId={datos.alumnoId}
        nombreAlumno={elegido.nombre || datos.nombreAlumno}
        nombreTutor={sesion?.user?.fullName ?? "Tutor"}
        formatosIniciales={datos.formatosPermitidos}
        entradaInicial={datos.entradaTrasLogin}
        mostrarPreferenciasInicial={datos.mostrarBotonPreferencias16}
        alGuardar={(guardados) => setPermisos(guardados)}
        alAbrirVistaPrevia07e={() => {
          router.push({
            pathname: "/ejecucion-restringida",
            params: { alumnoId: datos.alumnoId, nombre: elegido.nombre || datos.nombreAlumno },
          });
        }}
        alAtras={atrasALista ? () => setElegido(null) : volverAlPanel}
        alCerrarSesion={handleLogout}
      />
    </>
  );
}
