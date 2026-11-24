// Comedor · Recuento por aulas (pantalla 11, HU-12 · SCRUM-104): la tarea del alumno encargado del
// comedor. La pantalla está en src/componentes/comedor; aquí solo se decide adónde se vuelve.
// Pendiente: abrirla desde la agenda al empezar la tarea «Recuento comedor» (tareas.subtipo =
// 'comedor'), cuando secuencia_dia devuelva el subtipo (choca con SCRUM-225).
import { useRouter } from "expo-router";

import { PantallaRecuentoComedor } from "../src/componentes/comedor";

export default function RecuentoComedor() {
  const router = useRouter();
  return (
    <PantallaRecuentoComedor
      alSalir={() => (router.canGoBack?.() ? router.back() : router.replace("/agenda"))}
    />
  );
}
