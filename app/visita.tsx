// Visita · Escanear código QR (pantalla 13b, HU-15 · SCRUM-113). La pantalla está en
// src/componentes/visita; aquí se leen la hora de inicio y la duración (?inicio=ISO&duracion=min,
// comprobadas en parametrosVisita) y se decide adónde se vuelve.
// Pendiente: abrirla desde la agenda al empezar una tarea de visita (tareas.subtipo = 'visita'),
// cuando secuencia_dia devuelva el subtipo (choca con SCRUM-225).
import { useLocalSearchParams, useRouter } from "expo-router";

import { PantallaVisita, leerDuracion, leerInicio } from "../src/componentes/visita";

export default function Visita() {
  const router = useRouter();
  const { inicio, duracion } = useLocalSearchParams<{ inicio?: string; duracion?: string }>();
  const duracionMin = leerDuracion(duracion);
  return (
    <PantallaVisita
      inicio={leerInicio(inicio, duracionMin ?? 30)}
      duracionMin={duracionMin}
      alSalir={() => (router.canGoBack?.() ? router.back() : router.replace("/agenda"))}
    />
  );
}
