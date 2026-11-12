// Pantalla «Mi agenda» del estudiante (HU-06).
// T-06.1: vista de tres bloques. T-06.2: la agenda se carga de Supabase, avanza al pulsar
// «He terminado» y se actualiza sola con los cambios del tutor (Supabase Realtime).
// Con /agenda?estudiante=<id> usa Supabase; sin ese parámetro abre la demo con datos de ejemplo
// (hasta que el inicio de sesión del estudiante, HU-01, dé el id).
// HU-08 (T-08.2): con ?confirmacion=simple se prueba el modo «¿Seguro?» en lugar de mantener
// pulsado, hasta que salga del perfil del estudiante (SCRUM-66).
// T-06.4: sin barras de scroll, barra de estado ni gestos del navegador que distraigan.
// Mejoras de la profesora (noviembre de 2026):
// - Como todas las pantallas, lleva cabecera («Mi agenda» y la fecha) y la barra de abajo.
// - Es la misma agenda para el alumno y para los adultos; cambia lo que puede hacer cada uno:
//   el alumno, el tutor y administración pueden empezar y terminar tareas; la familia solo mira.
// - Cuántas tareas se ven en «Hecho» y «Después» sale de las preferencias (1, hasta 3 o todas).
// HU-16: con ?aviso=prueba la demo mueve las horas para que el aviso de «Reprografía» salga en menos
// de un minuto; con ?aviso=visual el aviso es solo visual, sin sonido ni vibración (RNF4.3). Se
// pueden juntar: ?aviso=prueba,visual.
import { useEffect, useMemo } from "react";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AgendaDelDia,
  agendaDemo,
  agendaDemoAviso,
  ESTUDIANTE_DEMO,
  crearRepositorioMemoria,
  hoyISO,
  useModoSinDistracciones,
} from "../src/componentes/agenda";
import { PREFERENCIAS_EJECUCION_POR_DEFECTO } from "../src/componentes/ejecucion-tarea";
import { AVISO_POR_DEFECTO, type PreferenciasAviso } from "../src/componentes/aviso-anticipado";
import { repositorioAgendaSupabase } from "../src/servicios/agendaService";
import { Pantalla } from "../src/pantalla";
import { TAREAS_VISIBLES, usePreferenciasOpcional } from "../src/preferencias";
import { useSesionOpcional } from "../src/sesion";
import { PictogramaInterfaz, Texto, fechaDeHoy, useApariencia } from "../src/ui";
import type { UserRole } from "../src/tipos/auth";

/** Panel al que vuelve cada adulto con «Atrás» si no hay pantalla anterior (p. ej. tras recargar). */
const PANEL_DE: Partial<Record<UserRole, Href>> = {
  tutor_docente: "/docente/agenda",
  especialista: "/docente/agenda",
  familiar: "/familiar/resumen",
  admin: "/admin/vinculos",
};

export default function PantallaAgenda() {
  const { estudiante, confirmacion, aviso } = useLocalSearchParams<{
    estudiante?: string;
    confirmacion?: string;
    aviso?: string;
  }>();
  const opcionesAviso = (aviso ?? "").split(",");
  const avisoPrueba = opcionesAviso.includes("prueba");
  const avisoVisual = opcionesAviso.includes("visual");
  const preferenciasAviso = useMemo<PreferenciasAviso>(
    () =>
      avisoVisual ? { ...AVISO_POR_DEFECTO, tipo: "visual", vibracion: false } : AVISO_POR_DEFECTO,
    [avisoVisual],
  );
  const preferencias = useMemo(
    () =>
      confirmacion === "simple"
        ? {
            ...PREFERENCIAS_EJECUCION_POR_DEFECTO,
            confirmacion: {
              ...PREFERENCIAS_EJECUCION_POR_DEFECTO.confirmacion,
              modo: "simple" as const,
            },
          }
        : PREFERENCIAS_EJECUCION_POR_DEFECTO,
    [confirmacion],
  );
  // T-06.4: sin barras de scroll ni elementos de distracción mientras la agenda está abierta.
  useModoSinDistracciones();

  const { repo, estudianteId, tutorDemo } = useMemo(() => {
    if (estudiante) {
      return { repo: repositorioAgendaSupabase, estudianteId: estudiante, tutorDemo: null };
    }
    const datos = avisoPrueba ? agendaDemoAviso(hoyISO()) : agendaDemo(hoyISO());
    const demo = crearRepositorioMemoria(datos);
    return { repo: demo.repo, estudianteId: ESTUDIANTE_DEMO, tutorDemo: demo.tutor };
  }, [estudiante, avisoPrueba]);

  // Demo: desde la consola del navegador se puede hacer de tutor, p. ej. __tutorDemo.bloquear("e3").
  useEffect(() => {
    if (tutorDemo) Object.assign(globalThis, { __tutorDemo: tutorDemo });
  }, [tutorDemo]);

  const { colores } = useApariencia();
  const router = useRouter();
  const prefs = usePreferenciasOpcional();
  const tareasVisibles = TAREAS_VISIBLES[prefs?.preferencias.tareasVisibles ?? "tres"].maximo;

  // Permisos según quién mira la agenda (sin sesión de adulto, es el alumno).
  const rol = useSesionOpcional()?.sesion?.user.role ?? "estudiante";
  const esAlumno = rol === "estudiante";
  const soloMirar = rol === "familiar";

  return (
    <Pantalla
      titulo={esAlumno ? "Mi agenda" : "Agenda del alumno"}
      simbolo={<PictogramaInterfaz nombre="agenda" etiqueta="agenda" tam={44} />}
      derecha={
        <Texto style={{ fontSize: 20, fontWeight: "700", color: colores.textoSecundario }}>
          {fechaDeHoy()}
        </Texto>
      }
      // El alumno no sale de su agenda por error; los adultos vuelven a su panel.
      alAtras={
        esAlumno
          ? null
          : () => {
              if (router.canGoBack?.()) router.back();
              else router.replace(PANEL_DE[rol] ?? "/");
            }
      }
      conSonido={esAlumno}
    >
      {/* T-06.4: tampoco se ve la barra de estado (hora, batería, notificaciones) en la tableta. */}
      <StatusBar hidden />
      <AgendaDelDia
        repo={repo}
        estudianteId={estudianteId}
        preferencias={preferencias}
        preferenciasAviso={preferenciasAviso}
        tareasVisibles={tareasVisibles}
        soloMirar={soloMirar}
      />
    </Pantalla>
  );
}
