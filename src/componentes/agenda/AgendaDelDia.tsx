// Agenda del día completa (T-06.2, HU-06): une el estado reactivo (useAgendaDia), la vista de tres
// bloques (T-06.1) y el detalle de la tarea. La pantalla app/agenda.tsx le pasa el repositorio.
// T-08.1 (HU-08): «Empezar» y «Terminar»; al terminar, refuerzo positivo según el perfil (RF6.4).
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { EntradaAgenda, RepositorioAgenda } from "./tipos";
import { useAgendaDia } from "./useAgendaDia";
import { AgendaTresBloques } from "./AgendaTresBloques";
import { DetalleTarea } from "./DetalleTarea";
import { colores } from "./colores";
import { RefuerzoPositivo } from "../ejecucion-tarea/RefuerzoPositivo";
import {
  PREFERENCIAS_EJECUCION_POR_DEFECTO,
  type PreferenciasEjecucion,
} from "../ejecucion-tarea/tipos";

export function AgendaDelDia({
  repo,
  estudianteId,
  fecha,
  nombre,
  preferencias = PREFERENCIAS_EJECUCION_POR_DEFECTO,
}: {
  repo: RepositorioAgenda;
  estudianteId: string;
  fecha?: string;
  /** Nombre del estudiante para el refuerzo («¡Muy bien, Marcos!»). */
  nombre?: string;
  preferencias?: PreferenciasEjecucion;
}) {
  // Se piden hasta 3 por lado; la vista enseña las que quepan en la pantalla.
  const { bloques, entradas, cargando, error, errorGuardado, empezar, confirmarFin } = useAgendaDia(
    repo,
    estudianteId,
    fecha,
    {
      maxHecho: 3,
      maxDespues: 3,
    },
  );
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  // Se guarda el id y no la entrada: si el tutor la cambia con el detalle abierto, se ve al momento.
  const abierta = entradas.find((e) => e.id === abiertaId) ?? null;
  // Título de la tarea recién terminada mientras se enseña el refuerzo positivo.
  const [terminada, setTerminada] = useState<string | null>(null);

  // El refuerzo sale al momento, igual que la tarea pasa a «Hecho» al momento (actualización
  // optimista); si no se guarda, la tarea vuelve a «Ahora» y se avisa abajo.
  const terminar = (idEntrada: string) => {
    if (bloques.ahora?.id !== idEntrada) return;
    setTerminada(bloques.ahora.tarea.titulo);
    void confirmarFin(idEntrada);
  };

  if (cargando && entradas.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colores.fondo,
        }}
      >
        <ActivityIndicator
          size="large"
          color={colores.primario}
          accessibilityLabel="Cargando tu agenda"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <AgendaTresBloques
        bloques={bloques}
        onEmpezar={empezar}
        onConfirmarFin={terminar}
        onAbrir={(e: EntradaAgenda) => setAbiertaId(e.id)}
      />
      {/* Aviso discreto solo si algo falla; no tapa la tarea de «Ahora». */}
      {(error || errorGuardado) && (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            bottom: 4,
            alignSelf: "center",
            color: colores.textoSecundario,
            fontSize: 14,
          }}
        >
          {errorGuardado ? "No se ha guardado. Prueba otra vez." : "Sin conexión con el colegio."}
        </Text>
      )}
      <DetalleTarea entrada={abierta} onCerrar={() => setAbiertaId(null)} />
      <RefuerzoPositivo
        tarea={terminada}
        nombre={nombre}
        preferencias={preferencias.refuerzo}
        onSeguir={() => setTerminada(null)}
      />
    </View>
  );
}
