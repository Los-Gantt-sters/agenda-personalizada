// Refuerzo positivo al terminar una tarea (T-08.1, HU-08), como la pantalla 12 del prototipo.
// RF6.4: animación y sonido según el perfil del estudiante. Con «reducir movimiento» del sistema o
// con la animación «ninguna», el dibujo aparece sin moverse.
// RNF6.4: solo un botón «Seguir», sin texto que escribir.
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Modal, StyleSheet, Text, View } from "react-native";
import { colores } from "../agenda/colores";
import { BotonGrande } from "./BotonGrande";
import { reproducirSonido } from "../../servicios/sonidos";
import type { PreferenciasRefuerzo } from "./tipos";

const ESTRELLAS = 6;

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

export function RefuerzoPositivo({
  tarea,
  nombre,
  preferencias,
  onSeguir,
}: {
  /** Título de la tarea terminada; con null no se enseña nada. */
  tarea: string | null;
  /** Nombre del estudiante para «¡Muy bien, Marcos!». */
  nombre?: string;
  preferencias: PreferenciasRefuerzo;
  onSeguir: () => void;
}) {
  const reducir = useReducirMovimiento();
  const conMovimiento = preferencias.animacion !== "ninguna" && !reducir;
  const [escala] = useState(() => new Animated.Value(1));
  const [salida] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!tarea) return;
    if (preferencias.sonido) reproducirSonido("refuerzo", 0.5);
    if (!conMovimiento) {
      escala.setValue(1);
      salida.setValue(1);
      return;
    }
    escala.setValue(0.3);
    salida.setValue(0);
    Animated.parallel([
      Animated.spring(escala, { toValue: 1, friction: 5, tension: 80, useNativeDriver: false }),
      Animated.timing(salida, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [tarea, preferencias.sonido, conMovimiento, escala, salida]);

  const visible = tarea !== null;
  const titulo = nombre ? `¡Muy bien, ${nombre}!` : "¡Muy bien!";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSeguir}>
      <View
        testID="refuerzo-positivo"
        style={estilos.fondo}
        accessibilityViewIsModal
        accessibilityLiveRegion="assertive"
      >
        <View style={estilos.centro}>
          <View style={estilos.escenario}>
            {preferencias.animacion === "estrellas" &&
              Array.from({ length: ESTRELLAS }, (_, i) => {
                const angulo = (i / ESTRELLAS) * 2 * Math.PI - Math.PI / 2;
                const r = 125;
                return (
                  <Animated.Text
                    key={i}
                    importantForAccessibility="no"
                    accessibilityElementsHidden
                    style={[
                      estilos.estrella,
                      {
                        opacity: salida,
                        transform: [
                          { translateX: Animated.multiply(salida, Math.cos(angulo) * r) },
                          { translateY: Animated.multiply(salida, Math.sin(angulo) * r) },
                        ],
                      },
                    ]}
                  >
                    ⭐
                  </Animated.Text>
                );
              })}
            <Animated.View
              accessible
              accessibilityRole="image"
              accessibilityLabel="Tarea terminada"
              style={[estilos.circulo, { transform: [{ scale: escala }] }]}
            >
              <Text style={estilos.check}>✓</Text>
            </Animated.View>
          </View>
          <Text style={estilos.titulo} accessibilityRole="header">
            {titulo}
          </Text>
          {tarea ? <Text style={estilos.subtitulo}>Has terminado: {tarea}</Text> : null}
          <BotonGrande texto="Seguir ➜" onPress={onSeguir} />
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: colores.fondo,
    alignItems: "center",
    justifyContent: "center",
  },
  centro: { alignItems: "center", gap: 22, padding: 24 },
  escenario: { width: 300, height: 220, alignItems: "center", justifyContent: "center" },
  circulo: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colores.exito,
    alignItems: "center",
    justifyContent: "center",
  },
  check: { color: colores.textoSobrePrimario, fontSize: 110, fontWeight: "900", lineHeight: 130 },
  estrella: { position: "absolute", fontSize: 40 },
  titulo: { fontSize: 40, fontWeight: "800", color: colores.texto, textAlign: "center" },
  subtitulo: { fontSize: 24, color: colores.textoSecundario, textAlign: "center" },
});
