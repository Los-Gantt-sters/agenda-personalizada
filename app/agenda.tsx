// Pantalla «Mi agenda» del estudiante (HU-06).
// T-06.1: vista de tres bloques. T-06.2: la agenda se carga de Supabase, avanza al pulsar
// «He terminado» y se actualiza sola con los cambios del tutor (Supabase Realtime).
// Con /agenda?estudiante=<id> usa Supabase; sin ese parámetro abre la demo con datos de ejemplo
// (hasta que el inicio de sesión del estudiante, HU-01, dé el id).
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  AgendaDelDia,
  agendaDemo,
  ESTUDIANTE_DEMO,
  colores,
  crearRepositorioMemoria,
  hoyISO,
} from "../src/componentes/agenda";
import { repositorioAgendaSupabase } from "../src/servicios/agendaService";

export default function PantallaAgenda() {
  const { estudiante } = useLocalSearchParams<{ estudiante?: string }>();

  const { repo, estudianteId, tutorDemo } = useMemo(() => {
    if (estudiante) {
      return { repo: repositorioAgendaSupabase, estudianteId: estudiante, tutorDemo: null };
    }
    const demo = crearRepositorioMemoria(agendaDemo(hoyISO()));
    return { repo: demo.repo, estudianteId: ESTUDIANTE_DEMO, tutorDemo: demo.tutor };
  }, [estudiante]);

  // Demo: desde la consola del navegador se puede hacer de tutor, p. ej. __tutorDemo.bloquear("e3").
  useEffect(() => {
    if (tutorDemo) Object.assign(globalThis, { __tutorDemo: tutorDemo });
  }, [tutorDemo]);

  return (
    <View style={estilos.raiz}>
      {/* Sin cabecera de navegación: en la vista del alumno distrae (RNF4.1). */}
      <Stack.Screen options={{ headerShown: false, title: "Mi agenda" }} />
      <AgendaDelDia repo={repo} estudianteId={estudianteId} />
    </View>
  );
}

const estilos = StyleSheet.create({ raiz: { flex: 1, backgroundColor: colores.fondo } });
