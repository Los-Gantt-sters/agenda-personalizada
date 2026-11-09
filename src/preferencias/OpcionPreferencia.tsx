// Opción elegible del panel, con el aspecto de .cfgopt del prototipo: borde de 3 px y, al estar
// elegida, borde de 5 px, fondo «ahora» y una marca ✓ (la elección no depende solo del color, RNF14.4).
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTema } from "../temas";
import { AREA_TACTIL_MINIMA } from "./estilos";

interface Props {
  etiqueta: string;
  elegida: boolean;
  onPress: () => void;
  /** Contenido de muestra encima del texto (p. ej. el cuadro «Aa» de cada paleta). */
  muestra?: React.ReactNode;
  /** Fuente con la que se escribe la etiqueta (para ver cómo se ve cada tipo de letra). */
  fuente?: string;
  accessibilityLabel?: string;
}

const BORDE = 3;
const BORDE_ELEGIDA = 5;

export function OpcionPreferencia({
  etiqueta,
  elegida,
  onPress,
  muestra,
  fuente,
  accessibilityLabel,
}: Props) {
  const { colores } = useTema();
  const borde = elegida ? BORDE_ELEGIDA : BORDE;
  // El borde elegido es más grueso; se resta del relleno para que la opción no cambie de tamaño
  const relleno = 12 - (borde - BORDE);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      accessibilityState={{ checked: elegida }}
      onPress={onPress}
      style={[
        styles.opcion,
        {
          borderWidth: borde,
          borderColor: elegida ? colores.primario : colores.borde,
          backgroundColor: elegida ? colores.superficieDestacada : colores.superficie,
          paddingHorizontal: relleno,
          paddingVertical: relleno - 4,
        },
      ]}
    >
      {muestra}
      <View style={styles.fila}>
        {elegida && (
          <Text accessibilityElementsHidden style={[styles.marca, { color: colores.primario }]}>
            ✓
          </Text>
        )}
        <Text
          style={[
            styles.texto,
            { color: colores.texto },
            fuente ? { fontFamily: fuente } : undefined,
          ]}
        >
          {etiqueta}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opcion: {
    minWidth: 96,
    minHeight: Math.max(AREA_TACTIL_MINIMA, 72),
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  marca: { fontSize: 18, fontWeight: "800" },
  texto: { fontSize: 16, fontWeight: "700", textAlign: "center" },
});
