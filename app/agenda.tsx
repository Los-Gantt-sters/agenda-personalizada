// Pantalla «Mi agenda» del estudiante (T-06.1, HU-06). De momento con datos de ejemplo: la carga
// desde Supabase y el avance al pulsar «He terminado» llegan con T-06.2 (SCRUM-70).
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import {
  AgendaTresBloques,
  DetalleTarea,
  agendaDemo,
  colores,
  dividirEnBloques,
  type EntradaAgenda,
} from "../src/componentes/agenda";

export default function PantallaAgenda() {
  const [abierta, setAbierta] = useState<EntradaAgenda | null>(null);
  const fecha = new Date().toISOString().slice(0, 10);
  const bloques = dividirEnBloques(agendaDemo(fecha), { maxHecho: 3, maxDespues: 3 });

  return (
    <View style={estilos.raiz}>
      {/* Sin cabecera de navegación: en la vista del alumno distrae (RNF4.1). */}
      <Stack.Screen options={{ headerShown: false, title: "Mi agenda" }} />
      <AgendaTresBloques bloques={bloques} onConfirmarFin={() => {}} onAbrir={setAbierta} />
      <DetalleTarea entrada={abierta} onCerrar={() => setAbierta(null)} />
    </View>
  );
}

const estilos = StyleSheet.create({ raiz: { flex: 1, backgroundColor: colores.fondo } });
