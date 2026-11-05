// Botón «He terminado» que se mantiene pulsado 1,5 s, como en el prototipo (T-06.1, HU-06).
import { useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { colores } from "./colores";

/**
 * Botón de «mantener pulsado» para confirmar (como en los prototipos: 1,5 s).
 * Evita que un toque sin querer dé la tarea por terminada. Mientras se
 * mantiene, el botón se va llenando; si se suelta antes, se vacía.
 * Con lector de pantalla basta con activarlo (doble toque) y en web, con
 * teclado, con Intro o Espacio.
 */
export function BotonMantener({
  texto,
  onConfirmar,
  duracionMs = 1500,
  desactivado = false,
}: {
  texto: string;
  onConfirmar: () => void;
  duracionMs?: number;
  desactivado?: boolean;
}) {
  const [progreso] = useState(() => new Animated.Value(0));
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const [pulsando, setPulsando] = useState(false);
  const porTeclado = useRef(true);

  const empezar = () => {
    porTeclado.current = false;
    if (desactivado) return;
    if (duracionMs <= 0) return;
    setPulsando(true);
    anim.current = Animated.timing(progreso, {
      toValue: 1,
      duration: duracionMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.current.start(({ finished }) => {
      if (finished) {
        progreso.setValue(0);
        setPulsando(false);
        onConfirmar();
      }
    });
  };

  const soltar = () => {
    anim.current?.stop();
    setPulsando(false);
    Animated.timing(progreso, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const ancho = progreso.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={duracionMs > 0 ? "Mantén pulsado para confirmar" : undefined}
      accessibilityState={{ disabled: desactivado }}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={(e) =>
        e.nativeEvent.actionName === "activate" && !desactivado && onConfirmar()
      }
      onPressIn={empezar}
      onPressOut={soltar}
      onPress={() => {
        // Teclado (web): no hay pressIn previo, se confirma directamente.
        if (porTeclado.current && !desactivado) onConfirmar();
        porTeclado.current = true;
      }}
      disabled={desactivado}
      style={({ pressed }) => [
        estilos.boton,
        (pressed || pulsando) && estilos.pulsado,
        desactivado && { opacity: 0.5 },
      ]}
    >
      <Animated.View pointerEvents="none" style={[estilos.relleno, { width: ancho }]} />
      <View style={estilos.contenido} pointerEvents="none">
        <Text style={estilos.texto}>{pulsando ? "Sigue pulsando…" : texto}</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: 72,
    minWidth: 240,
    borderRadius: 999,
    backgroundColor: colores.primario,
    overflow: "hidden",
    justifyContent: "center",
  },
  pulsado: { transform: [{ scale: 0.98 }] },
  relleno: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: colores.exito },
  contenido: { paddingHorizontal: 28, paddingVertical: 14, alignItems: "center" },
  texto: { color: colores.textoSobrePrimario, fontSize: 26, fontWeight: "700" },
});
