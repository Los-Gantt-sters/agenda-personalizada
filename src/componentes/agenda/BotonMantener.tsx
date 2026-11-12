// Botón que se mantiene pulsado 1,5 s, como en el prototipo (T-06.1, HU-06).
// T-08.1 (HU-08): admite color, una versión grande en mayúsculas para «EMPEZAR» y «TERMINAR» y un
// texto de ayuda debajo («Mantén pulsado»).
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
  color = colores.primario,
  colorRelleno = colores.exito,
  grande = false,
  ayuda,
  testID,
}: {
  texto: string;
  onConfirmar: () => void;
  duracionMs?: number;
  desactivado?: boolean;
  color?: string;
  /** Color con el que se va llenando mientras se mantiene pulsado. */
  colorRelleno?: string;
  /** Botón más grande con el texto en mayúsculas (lo lee igual el lector de pantalla). */
  grande?: boolean;
  /** Texto pequeño bajo el principal, p. ej. «Mantén pulsado». */
  ayuda?: string;
  testID?: string;
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
      testID={testID}
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
        { backgroundColor: color },
        grande && estilos.botonGrande,
        (pressed || pulsando) && estilos.pulsado,
        desactivado && { opacity: 0.5 },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[estilos.relleno, { width: ancho, backgroundColor: colorRelleno }]}
      />
      <View style={estilos.contenido} pointerEvents="none">
        <Text style={[estilos.texto, grande && estilos.textoGrande]}>
          {pulsando ? "Sigue pulsando…" : texto}
        </Text>
        {ayuda && !pulsando ? <Text style={estilos.ayuda}>{ayuda}</Text> : null}
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
  botonGrande: { minHeight: 96, minWidth: 300 },
  relleno: { position: "absolute", left: 0, top: 0, bottom: 0 },
  contenido: { paddingHorizontal: 28, paddingVertical: 14, alignItems: "center" },
  texto: { color: colores.textoSobrePrimario, fontSize: 26, fontWeight: "700" },
  ayuda: { color: colores.textoSobrePrimario, fontSize: 18, fontWeight: "600" },
  textoGrande: { fontSize: 38, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
});
