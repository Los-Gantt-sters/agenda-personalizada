// Detalle de una tarea de la agenda (T-06.1, HU-06). RF4.4: se abre al pulsar una tarjeta.
import { useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { EntradaAgenda } from "./tipos";
import { franjaHoraria } from "./logica";
import { colores, RADIO } from "./colores";
import { PictogramaTarea } from "./PictogramaTarea";

/** Lee en voz alta (web). En nativo se puede cambiar por expo-speech. */
function leer(texto: string) {
  if (Platform.OS === "web" && typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }
}
const puedeLeer =
  Platform.OS === "web" && typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * RF4.4: detalle de la tarea con su contenido accesible. Ocupa toda la
 * pantalla y no tiene scroll (RNF4.1): si la tarea tiene pasos, se ven de
 * uno en uno con «Anterior» y «Siguiente».
 */
export function DetalleTarea({
  entrada,
  onCerrar,
}: {
  entrada: EntradaAgenda | null;
  onCerrar: () => void;
}) {
  const { width, height } = useWindowDimensions();
  // El paso se guarda junto al id de la tarea: al abrir otra, vuelve al primero.
  const [estadoPaso, setEstadoPaso] = useState({ id: "", n: 0 });
  const paso = estadoPaso.id === entrada?.id ? estadoPaso.n : 0;
  const setPaso = (f: (n: number) => number) =>
    setEstadoPaso({ id: entrada?.id ?? "", n: f(paso) });
  if (!entrada) return null;

  const t = entrada.tarea;
  const pasos = (t.pasos ?? []).slice().sort((a, b) => a.orden - b.orden);
  const p = pasos[paso];
  const tamPicto = Math.min(width * 0.32, height * 0.32, 260);
  const textoVoz = [
    t.titulo,
    franjaHoraria(entrada),
    t.descripcion,
    p ? `Paso ${paso + 1}. ${p.texto}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      supportedOrientations={["portrait", "landscape"]}
    >
      <View style={estilos.fondo} accessibilityViewIsModal>
        <View style={estilos.hoja}>
          <View style={estilos.cabecera}>
            <PictogramaTarea tarea={t} tam={tamPicto} />
            <View style={{ flexShrink: 1, gap: 8 }}>
              <Text style={estilos.titulo} accessibilityRole="header" numberOfLines={2}>
                {t.titulo}
              </Text>
              <Text style={estilos.hora}>🕘 {franjaHoraria(entrada)}</Text>
              {entrada.estado === "hecha" && (
                <Text style={[estilos.hora, { color: colores.exito }]}>✓ Ya la has hecho</Text>
              )}
              {entrada.estado === "bloqueada" && (
                <Text style={[estilos.hora, { color: colores.aviso }]}>🔒 Hoy no toca</Text>
              )}
            </View>
          </View>

          {!!t.descripcion && (
            <Text style={estilos.texto} numberOfLines={3}>
              {t.descripcion}
            </Text>
          )}

          {p && (
            <View style={estilos.paso}>
              <PictogramaTarea
                tarea={{ titulo: p.texto, pictograma_url: p.pictograma_url, emoji: "👉" }}
                tam={Math.min(tamPicto * 0.6, 120)}
              />
              <Text style={[estilos.texto, { flex: 1 }]} numberOfLines={3}>
                Paso {paso + 1} de {pasos.length}: {p.texto}
              </Text>
            </View>
          )}

          <View style={estilos.botones}>
            {pasos.length > 1 && (
              <Boton
                texto="⬅ Anterior"
                fantasma
                desactivado={paso === 0}
                onPress={() => setPaso((n) => n - 1)}
              />
            )}
            {pasos.length > 1 && (
              <Boton
                texto="Siguiente ➡"
                fantasma
                desactivado={paso >= pasos.length - 1}
                onPress={() => setPaso((n) => n + 1)}
              />
            )}
            {puedeLeer && <Boton texto="🔊 Escuchar" fantasma onPress={() => leer(textoVoz)} />}
            {!!t.video_url && (
              <Boton texto="▶ Ver vídeo" fantasma onPress={() => Linking.openURL(t.video_url!)} />
            )}
            <Boton texto="✕ Cerrar" onPress={onCerrar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Boton({
  texto,
  onPress,
  fantasma,
  desactivado,
}: {
  texto: string;
  onPress: () => void;
  fantasma?: boolean;
  desactivado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desactivado }}
      disabled={desactivado}
      onPress={onPress}
      style={[estilos.boton, fantasma && estilos.botonFantasma, desactivado && { opacity: 0.4 }]}
    >
      <Text style={[estilos.botonTexto, fantasma && { color: colores.primario }]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(20,33,61,0.55)",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  hoja: {
    width: "100%",
    maxWidth: 900,
    maxHeight: "100%",
    backgroundColor: colores.superficie,
    borderRadius: RADIO,
    padding: 24,
    gap: 18,
    overflow: "hidden",
  },
  cabecera: { flexDirection: "row", alignItems: "center", gap: 20 },
  titulo: { fontSize: 38, fontWeight: "800", color: colores.texto },
  hora: { fontSize: 22, fontWeight: "700", color: colores.textoSecundario },
  texto: { fontSize: 24, lineHeight: 32, color: colores.texto },
  paso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colores.superficieSuave,
    borderRadius: RADIO * 0.7,
    padding: 12,
  },
  botones: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "flex-end" },
  boton: {
    minHeight: 60,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: colores.primario,
    justifyContent: "center",
  },
  botonFantasma: {
    backgroundColor: colores.superficie,
    borderWidth: 3,
    borderColor: colores.primario,
  },
  botonTexto: { fontSize: 22, fontWeight: "700", color: colores.textoSobrePrimario },
});
