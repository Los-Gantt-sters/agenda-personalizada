// Pantalla 43 «Progreso e historial» (HU-25 · SCRUM-144), la misma para el tutor y la familia.
// Con /progreso?estudiante=<id> usa los datos de Supabase (función progreso_alumno, SCRUM-145); sin
// ese parámetro, o con un alumno de ejemplo, abre la demo con datos de ejemplo.
// Se llega desde la ficha del alumno (pantalla 37) y desde el panel de la familia (pantalla 34):
// esas pantallas solo tienen que abrir esta ruta con el id del alumno.
import { useEffect } from "react";
import { Platform } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import {
  ESTUDIANTE_DEMO_PROGRESO,
  ProgresoHistorial43,
  repositorioProgresoDemo,
} from "../src/componentes/progreso";
import { esIdDeAlumnoReal } from "../src/servicios/destinoAgendaAlumno";
import { repositorioProgresoSupabase } from "../src/servicios/progresoService";
import { useSesionOpcional } from "../src/sesion";
import type { UserRole } from "../src/tipos/auth";

/** Panel al que vuelve cada adulto con «Atrás» si no hay pantalla anterior (p. ej. tras recargar). */
const PANEL_DE: Partial<Record<UserRole, Href>> = {
  tutor_docente: "/docente/agenda",
  especialista: "/docente/agenda",
  familiar: "/familiar/resumen",
  admin: "/admin",
};

export default function PantallaProgreso() {
  const { estudiante } = useLocalSearchParams<{ estudiante?: string }>();
  const router = useRouter();
  const sesion = useSesionOpcional();
  const usuario = sesion?.sesion?.user;
  const rol = usuario?.role;
  const real = Boolean(estudiante && esIdDeAlumnoReal(estudiante));

  // En el navegador, la pestaña lleva el nombre de la pantalla, como en las demás.
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "Progreso e historial · Agensible";
    }
  }, []);

  return (
    <ProgresoHistorial43
      repo={real ? repositorioProgresoSupabase : repositorioProgresoDemo}
      estudianteId={real ? estudiante! : ESTUDIANTE_DEMO_PROGRESO}
      alAtras={() => {
        if (router.canGoBack?.()) router.back();
        else router.replace((rol && PANEL_DE[rol]) || "/");
      }}
      // Arriba a la derecha: quién ha entrado y «Salir» (cierra la sesión y vuelve al acceso).
      usuario={usuario ? usuario.fullName || usuario.email : undefined}
      alCerrarSesion={
        sesion?.sesion
          ? async () => {
              await sesion.cerrarSesion();
              router.replace("/login");
            }
          : undefined
      }
    />
  );
}
