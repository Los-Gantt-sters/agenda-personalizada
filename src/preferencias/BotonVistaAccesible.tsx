// Botón flotante accesible de Vista / Accesibilidad (.a11yb de tuagendita-prototipos.html).
// Situado de forma fija en la esquina inferior derecha (bottom: 16, right: 16), es el gemelo
// del botón de necesidades (bottom: 16, left: 16) y permite conmutar rápidamente cómo se ve
// la pantalla (solo pictogramas, solo texto o ambos, RNF4.4, RF3.1).
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

import { useTema } from "../temas";
import { usePreferencias } from "./PreferenciasProvider";

export interface BotonVistaAccesibleProps {
  onPress: () => void;
  posicion?: "inferior-derecha" | "inferior-izquierda" | "superior-derecha";
  tamanio?: number;
  testID?: string;
  estiloAdicional?: ViewStyle;
}

export function BotonVistaAccesible({
  onPress,
  posicion = "inferior-derecha",
  tamanio = 84,
  testID = "btn-vista-accesible-flotante",
  estiloAdicional,
}: BotonVistaAccesibleProps) {
  const { colores } = useTema();
  const { estilos } = usePreferencias();
  const dimension = Math.max(tamanio, 48);

  const estiloPosicion: ViewStyle = (() => {
    switch (posicion) {
      case "superior-derecha":
        return { top: 16, right: 16 };
      case "inferior-izquierda":
        return { bottom: 16, left: 16 };
      case "inferior-derecha":
      default:
        return { bottom: 16, right: 16 };
    }
  })();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Accesibilidad y vista de pantalla"
      accessibilityHint="Abre opciones para elegir ver solo pictogramas, solo texto o ambos"
      testID={testID}
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.botonFlotante,
        estiloPosicion,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2, // Circular como en el prototipo
          backgroundColor: colores.superficie,
          borderColor: colores.primario,
        },
        estiloAdicional,
      ]}
    >
      <Text style={styles.iconoAccesibilidad}>♿</Text>
      <Text
        style={[
          styles.textoEtiqueta,
          {
            color: colores.texto,
            fontFamily: estilos.fuenteNegrita,
          },
        ]}
      >
        Vista
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botonFlotante: {
    position: "absolute",
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    gap: 2,
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 6px 14px rgba(0, 0, 0, 0.25)",
      },
      default: {
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
    }),
  },
  iconoAccesibilidad: {
    fontSize: 28,
    lineHeight: 30,
  },
  textoEtiqueta: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
