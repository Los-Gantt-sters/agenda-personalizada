// Agenda del día completa (T-06.2, HU-06): une el estado reactivo (useAgendaDia), la vista de tres
// bloques (T-06.1) y el detalle de la tarea. La pantalla app/agenda.tsx le pasa el repositorio.
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { EntradaAgenda, RepositorioAgenda } from "./tipos";
import { useAgendaDia } from "./useAgendaDia";
import { AgendaTresBloques } from "./AgendaTresBloques";
import { DetalleTarea } from "./DetalleTarea";
import { colores } from "./colores";

export function AgendaDelDia({
  repo,
  estudianteId,
  fecha,
}: {
  repo: RepositorioAgenda;
  estudianteId: string;
  fecha?: string;
}) {
  // Se piden hasta 3 por lado; la vista enseña las que quepan en la pantalla.
  const { bloques, entradas, cargando, error, errorGuardado, confirmarFin } = useAgendaDia(
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
        onConfirmarFin={confirmarFin}
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
    </View>
  );
}
