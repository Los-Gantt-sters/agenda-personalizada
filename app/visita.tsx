// Visita · Escanear código QR (pantalla 13b, HU-15 · SCRUM-113). La pantalla está en
// src/componentes/visita; aquí se lee la hora de inicio y la duración (?inicio=ISO&duracion=min) y se
// decide adónde se vuelve.
// Pendiente: abrirla desde la agenda al empezar una tarea de visita (tareas.subtipo = 'visita'),
// cuando secuencia_dia devuelva el subtipo (choca con SCRUM-225).
import { useLocalSearchParams, useRouter } from "expo-router";

import { PantallaVisita } from "../src/componentes/visita";

export default function Visita() {
  const router = useRouter();
  const { inicio, duracion } = useLocalSearchParams<{ inicio?: string; duracion?: string }>();
  const minutos = Number(duracion);
  return (
    <PantallaVisita
      inicio={typeof inicio === "string" && !Number.isNaN(Date.parse(inicio)) ? inicio : undefined}
      duracionMin={Number.isFinite(minutos) && minutos > 0 ? minutos : undefined}
      alSalir={() => (router.canGoBack?.() ? router.back() : router.replace("/agenda"))}
    />
  );
}
