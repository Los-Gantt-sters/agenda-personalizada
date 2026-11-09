// Pantalla «Mi agenda» del estudiante (HU-06).
// T-06.1: vista de tres bloques. T-06.2: la agenda se carga de Supabase, avanza al pulsar
// «He terminado» y se actualiza sola con los cambios del tutor (Supabase Realtime).
// Con /agenda?estudiante=<id> usa Supabase; sin ese parámetro abre la demo con datos de ejemplo
// (hasta que el inicio de sesión del estudiante, HU-01, dé el id).
// HU-08 (T-08.2): con ?confirmacion=simple se prueba el modo «¿Seguro?» en lugar de mantener
// pulsado, hasta que salga del perfil del estudiante (SCRUM-66).
// HU-16: con ?aviso=prueba la demo mueve las horas para que el aviso de «Reprografía» salga en menos
// de un minuto; con ?aviso=visual el aviso es solo visual, sin sonido ni vibración (RNF4.3). Se
// pueden juntar: ?aviso=prueba,visual.
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  AgendaDelDia,
  agendaDemo,
  agendaDemoAviso,
  ESTUDIANTE_DEMO,
  colores,
  crearRepositorioMemoria,
  hoyISO,
} from "../src/componentes/agenda";
import { PREFERENCIAS_EJECUCION_POR_DEFECTO } from "../src/componentes/ejecucion-tarea";
import { AVISO_POR_DEFECTO, type PreferenciasAviso } from "../src/componentes/aviso-anticipado";
import { repositorioAgendaSupabase } from "../src/servicios/agendaService";

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

  return (
    <View style={estilos.raiz}>
      {/* Sin cabecera de navegación: en la vista del alumno distrae (RNF4.1). */}
      <Stack.Screen options={{ headerShown: false, title: "Mi agenda" }} />
      <AgendaDelDia
        repo={repo}
        estudianteId={estudianteId}
        preferencias={preferencias}
        preferenciasAviso={preferenciasAviso}
      />
    </View>
  );
}

const estilos = StyleSheet.create({ raiz: { flex: 1, backgroundColor: colores.fondo } });
