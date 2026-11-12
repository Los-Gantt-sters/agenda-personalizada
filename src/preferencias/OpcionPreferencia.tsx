// Opción elegible del panel, con el aspecto de .cfgopt del prototipo: borde de 3 px y, al estar
// elegida, borde de 5 px, fondo «ahora» y un icono de marca (la elección no depende solo del color, RNF14.4).
import React from "react";
import { Pressable, StyleSheet, View, type TextStyle } from "react-native";

import { useTema } from "../temas";
import { Icono } from "../ui/Icono";
import { Texto as Text } from "../ui/Texto";
import { AREA_TACTIL_MINIMA } from "./estilos";

interface Props {
  etiqueta: string;
  elegida: boolean;
  onPress: () => void;
  /** Contenido de muestra encima del texto (p. ej. el cuadro «Aa» de cada paleta). */
  muestra?: React.ReactNode;
  /** Fuente con la que se escribe la etiqueta (para ver cómo se ve cada tipo de letra). */
  fuente?: string;
  /** Estilo extra de la etiqueta (p. ej. que «Minúsculas» no salga en mayúsculas). */
  estiloTexto?: TextStyle;
  accessibilityLabel?: string;
  testID?: string;
}

const BORDE = 3;
const BORDE_ELEGIDA = 5;

export function OpcionPreferencia({
  etiqueta,
  elegida,
  onPress,
  muestra,
  fuente,
  estiloTexto,
  accessibilityLabel,
  testID,
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
      testID={testID}
      style={[
        styles.opcion,
        {
          borderWidth: borde,
          borderColor: elegida ? colores.primario : colores.borde,
          backgroundColor: elegida ? colores.superficieDestacada : colores.superficie,
          paddingHorizontal: relleno + 4,
          paddingVertical: relleno - 2,
        },
      ]}
    >
      {muestra}
      <View style={styles.fila}>
        {elegida && <Icono nombre="check" color={colores.primario} tam={26} grosor={3} />}
        <Text
          style={[
            styles.texto,
            { color: colores.texto },
            fuente ? { fontFamily: fuente } : undefined,
            estiloTexto,
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
    minWidth: 150,
    minHeight: Math.max(AREA_TACTIL_MINIMA, 88),
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  texto: { fontSize: 20, fontWeight: "700", textAlign: "center" },
});
