// Ventana emergente del aviso anticipatorio (T-16.2, HU-16), como la pantalla 08 del prototipo.
// RF4.6: tarjeta flotante con el pictograma de la tarea que viene y «Dentro de 5 minutos: …».
// Se cierra al tocarla o a los 15 s. No es un modal: no tapa la pantalla ni toca la tarea en curso.
// Al aparecer vibra un poco (si el dispositivo puede) y, si el aviso es «sonoro», suena suave.
// RNF4.3: con el tipo «visual» no suena nada. Con «reducir movimiento» aparece sin deslizarse.
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
} from "react-native";
import { colores, RADIO } from "../agenda/colores";
import { PictogramaTarea } from "../agenda/PictogramaTarea";
import { reproducirSonido } from "../../servicios/sonidos";
import { AVISO_POR_DEFECTO, type EventoAviso, type PreferenciasAviso } from "./tipos";

/** Vibración leve: un solo pulso corto. */
export const VIBRACION_MS = 200;

function useReducirMovimiento(): boolean {
  const [reducir, setReducir] = useState(false);
  useEffect(() => {
    let montado = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => montado && setReducir(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReducir);
    return () => {
      montado = false;
      sub?.remove();
    };
  }, []);
  return reducir;
}

export function AvisoFlotante({
  aviso,
  preferencias = AVISO_POR_DEFECTO,
  onCerrar,
}: {
  /** Aviso que se enseña; con null no se enseña nada. */
  aviso: EventoAviso | null;
  preferencias?: Pick<PreferenciasAviso, "vibracion" | "duracionMs">;
  onCerrar: () => void;
}) {
  const reducir = useReducirMovimiento();
  const [entrada] = useState(() => new Animated.Value(1));
  const { vibracion, duracionMs } = preferencias;

  // Se guarda la última versión del callback para no reiniciar los 15 s cuando cambie
  const onCerrarRef = useRef(onCerrar);
  useEffect(() => {
    onCerrarRef.current = onCerrar;
  });

  // Cada aviso nuevo (otra hora de emisión) vibra, suena si toca y vuelve a contar los 15 s.
  const emitido = aviso?.emitido_en;
  const tipo = aviso?.tipo;
  useEffect(() => {
    if (!emitido) return;
    if (vibracion) {
      try {
        Vibration.vibrate(VIBRACION_MS);
      } catch {
        // Sin vibración (tableta sin motor, navegador que no la permite): basta con la tarjeta.
      }
    }
    if (tipo === "sonoro") reproducirSonido("aviso", 0.4);
    const t = setTimeout(() => onCerrarRef.current(), duracionMs);
    return () => clearTimeout(t);
  }, [emitido, tipo, vibracion, duracionMs]);

  useEffect(() => {
    if (!emitido) return;
    if (reducir) {
      entrada.setValue(1);
      return;
    }
    entrada.setValue(0);
    Animated.timing(entrada, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.quad),
      // El driver nativo no existe en web
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [emitido, reducir, entrada]);

  if (!aviso) return null;
  const { tarea } = aviso.entrada;
  const cuando = `Dentro de ${aviso.antelacion_min} minutos:`;

  return (
    <Animated.View
      style={[
        estilos.contenedor,
        {
          opacity: entrada,
          transform: [
            { translateX: entrada.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
          ],
        },
      ]}
    >
      <Pressable
        testID="aviso-anticipado"
        onPress={onCerrar}
        accessibilityRole="button"
        accessibilityLabel={`${cuando} ${tarea.titulo}. Toca para cerrar.`}
        accessibilityLiveRegion="polite"
        style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.85 }]}
      >
        <PictogramaTarea tarea={tarea} tam={64} />
        <Text style={estilos.texto}>
          {cuando}
          {"\n"}
          <Text style={estilos.titulo}>{tarea.titulo}</Text>
          {"\n"}
          <Text style={estilos.pista}>Toca para cerrar</Text>
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 15,
    maxWidth: 420,
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colores.superficie,
    borderWidth: 4,
    borderColor: colores.primario,
    borderRadius: RADIO,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  texto: { flexShrink: 1, fontSize: 20, fontWeight: "700", color: colores.texto },
  titulo: { fontSize: 24, fontWeight: "800" },
  pista: { fontSize: 16, fontWeight: "400", color: colores.textoSecundario },
});
