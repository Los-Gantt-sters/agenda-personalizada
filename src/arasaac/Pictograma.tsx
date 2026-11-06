// Muestra un pictograma de ARASAAC con el estilo de tarjeta .pic / .mpic de tuagendita-prototipos.html
// y con su descripción alternativa para lectores de pantalla (RF14.7).
import React from "react";
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { PictogramaArasaac } from "./tipos";

interface Props {
  pictograma: PictogramaArasaac;
  /** Lado en píxeles. Mínimo 48 en modo normal (RNF14.3) y 34 en variante "mini" (.mpic). */
  tamano?: number;
  /** "normal" (.pic de la agenda/tarjetas) o "mini" (.mpic de pasos y tabla de biblioteca). */
  variante?: "normal" | "mini";
  /** Si es true, pinta la insignia verde de tarea completada (✓) como .pic.done en el prototipo. */
  completado?: boolean;
  /** Etiqueta accesible personalizada (por defecto usa pictograma.descripcion). */
  etiqueta?: string;
  /** Color del borde de la tarjeta (por defecto #C6D1E2, igual que --d-line en el prototipo). */
  colorBorde?: string;
  style?: StyleProp<ImageStyle>;
  contenedorStyle?: StyleProp<ViewStyle>;
}

export const TAMANO_MINIMO_PICTOGRAMA = 48;
export const TAMANO_MINI_PICTOGRAMA = 34;

export function Pictograma({
  pictograma,
  tamano = 120,
  variante = "normal",
  completado = false,
  etiqueta,
  colorBorde = "#C6D1E2",
  style,
  contenedorStyle,
}: Props) {
  const esMini = variante === "mini";
  const lado = esMini
    ? Math.max(TAMANO_MINI_PICTOGRAMA, tamano)
    : Math.max(TAMANO_MINIMO_PICTOGRAMA, tamano);
  const radio = esMini ? 7 : Math.min(22, Math.round(lado * 0.2));
  const grosorBorde = esMini ? 1 : 3;
  const ladoImagen = Math.max(20, lado - grosorBorde * 2 - (esMini ? 4 : 8));
  const descripcionFinal = etiqueta ?? pictograma.descripcion;
  const labelAccesible = completado ? `${descripcionFinal} (hecho)` : descripcionFinal;

  return (
    <View
      style={[
        styles.marco,
        {
          width: lado,
          height: lado,
          borderRadius: radio,
          borderWidth: grosorBorde,
          borderColor: colorBorde,
        },
        contenedorStyle,
      ]}
    >
      <Image
        source={{ uri: pictograma.urlImagen }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={labelAccesible}
        resizeMode="contain"
        style={[{ width: ladoImagen, height: ladoImagen }, style]}
      />
      {completado && (
        <View
          style={styles.insigniaHecho}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Text style={styles.textoHecho}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  marco: {
    // Fondo blanco fijo igual que .pic en tuagendita-prototipos.html para que los trazos negros
    // de los PNG de ARASAAC conserven siempre el contraste en temas oscuros y de alto contraste.
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  insigniaHecho: {
    position: "absolute",
    right: -8,
    bottom: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2B7A4B",
    alignItems: "center",
    justifyContent: "center",
  },
  textoHecho: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
});
