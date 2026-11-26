/**
 * Ruta `/docente/plan-b` — Plan B (HU-22 · SCRUM-137).
 *
 * - Sin parámetros (desde el panel del tutor): 47c, Plan B del día de toda su clase.
 * - Con `?alumnoId=<uuid>` (p. ej. desde la ficha 37): 47b de ese alumno.
 * - Con `?alumno=elegir`: primero se elige el alumno y luego se abre su 47b.
 */

import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { hoyISO } from "../../src/componentes/agenda/useAgendaDia";
import { ElegirAlumno26d, type AlumnoElegible26d } from "../../src/componentes/permisos-alumno";
import { PantallaPlanB } from "../../src/componentes/plan-b";
import { MarcoPantalla } from "../../src/pantalla/MarcoPantalla";
import { obtenerAlumnos } from "../../src/servicios/alumnosService";
import { repositorioPlanBSupabase } from "../../src/servicios/planBService";
import { useSesion } from "../../src/sesion";
import { Texto } from "../../src/ui";

const ERROR_CARGA = "No se han podido cargar tus alumnos. Inténtalo otra vez.";

export default function DocentePlanBScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();
  const params = useLocalSearchParams<{ alumnoId?: string; nombre?: string; alumno?: string }>();
  const alumnoIdParam = typeof params.alumnoId === "string" ? params.alumnoId.trim() : "";
  const eligiendoAlumno = params.alumno === "elegir" && !alumnoIdParam;

  // Alumnos del tutor: la base de datos no deja leer los de otros.
  const [alumnos, setAlumnos] = useState<AlumnoElegible26d[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elegido, setElegido] = useState<AlumnoElegible26d | null>(null);

  useEffect(() => {
    let activo = true;
    obtenerAlumnos()
      .then((res) => {
        if (!activo) return;
        if (!res.success || !res.data) {
          setError(ERROR_CARGA);
          return;
        }
        setAlumnos(
          res.data.map((a) => ({
            id: a.id,
            nombre: a.nombre,
            apellidos: a.apellidos,
            color: a.colorIdentificativo,
          })),
        );
      })
      .catch(() => {
        if (activo) setError(ERROR_CARGA);
      });
    return () => {
      activo = false;
    };
  }, []);

  const salir = async () => {
    await cerrarSesion();
    router.replace("/login");
  };
  const volverAlPanel = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace("/docente/agenda");
  };

  if (eligiendoAlumno && !elegido) {
    return (
      <>
        <Stack.Screen options={{ title: "Plan B de un alumno" }} />
        <ElegirAlumno26d
          titulo="Plan B de un alumno"
          pregunta="¿De qué alumno quieres cambiar el Plan B?"
          accion="cambiar su Plan B"
          alumnos={alumnos ?? []}
          cargando={!alumnos && !error}
          error={error}
          alElegir={setElegido}
          alAtras={volverAlPanel}
          alCerrarSesion={salir}
        />
      </>
    );
  }

  const idAlumno = alumnoIdParam || elegido?.id || "";

  // La 47c necesita saber antes quiénes son los alumnos de la clase.
  if (!idAlumno && !alumnos) {
    return (
      <>
        <Stack.Screen options={{ title: "Plan B del día" }} />
        <MarcoPantalla titulo="Plan B del día" atras={volverAlPanel} testID="plan-b-cargando">
          <Texto style={{ fontSize: 20, textAlign: "center", marginTop: 40 }}>
            {error ?? "Cargando tu clase…"}
          </Texto>
        </MarcoPantalla>
      </>
    );
  }
  const nombre = idAlumno
    ? elegido?.nombre ||
      alumnos?.find((a) => a.id === idAlumno)?.nombre ||
      (typeof params.nombre === "string" && params.nombre) ||
      "alumno"
    : undefined;
  const ids = idAlumno ? [idAlumno] : (alumnos ?? []).map((a) => a.id);

  return (
    <>
      <Stack.Screen options={{ title: nombre ? `Plan B · ${nombre}` : "Plan B del día" }} />
      <PantallaPlanB
        key={idAlumno || "clase"}
        repo={repositorioPlanBSupabase}
        estudianteIds={ids}
        fecha={hoyISO()}
        nombreAlumno={nombre}
        nombreTutor={sesion?.user?.fullName}
        alAtras={elegido ? () => setElegido(null) : volverAlPanel}
        alCerrarSesion={salir}
      />
    </>
  );
}
