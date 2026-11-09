/**
 * Componente base del Design System accesible (SCRUM-164 / T-T03.2 · HUT-03).
 * Garantiza área táctil >= 48x48 px (RNF14.3), anillo de foco grueso visible al navegar con
 * teclado o pulsador (RF14.2), anuncio en Lectura Fácil con rol y estado (RF14.1) e icono + texto (RNF14.4).
 */

import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import {
  AREA_TACTIL_MINIMA_PX,
  GROSOR_BORDE_FOCO_PX,
  NombreTemaAccesible,
  PALETAS_COLOR,
} from "./colors";
import {
  ClaveFamiliaTipografica,
  EscalaTamanoBoton,
  EscalaTamanoTexto,
  FormaElementoUI,
  calcularTokensTipografia,
} from "./typography";

export type VarianteBotonAccesible = "primario" | "secundario" | "exito" | "peligro";

export interface BotonTactilAccesibleProps {
  /** Texto visible del botón en Lectura Fácil. */
  etiqueta: string;
  /** Descripción explícita para lectores de pantalla en Lectura Fácil (por defecto usa la etiqueta). */
  descripcionLecturaFacil?: string;
  /** Pista opcional sobre qué ocurrirá al pulsar el botón. */
  pistaAccesible?: string;
  /** Símbolo o pictograma textual de apoyo para no depender solo del color (RNF14.4). */
  icono?: string;
  /** Acción al pulsar con un toque simple (sin gestos complejos, RNF14.3). */
  onPress: () => void;
  /** Variante semántica de color. */
  variante?: VarianteBotonAccesible;
  /** Tema activo del Design System. */
  tema?: NombreTemaAccesible;
  /** Familia tipográfica activa. */
  familiaTipografica?: ClaveFamiliaTipografica;
  /** Escala de tamaño de letra. */
  tamanoTexto?: EscalaTamanoTexto;
  /** Escala de tamaño del botón. */
  tamanoBoton?: EscalaTamanoBoton;
  /** Forma geométrica del botón. */
  forma?: FormaElementoUI;
  /** Indica si el botón está deshabilitado. */
  deshabilitado?: boolean;
  /** Indica si el botón está seleccionado o activo. */
  seleccionado?: boolean;
  /** Fuerza el estado de foco visible (útil para el motor de barrido por pulsador o pruebas). */
  focoForzado?: boolean;
  /** Identificador para pruebas automatizadas. */
  testID?: string;
  /** Estilos adicionales opcionales para el contenedor. */
  estiloContenedor?: ViewStyle;
}

export function BotonTactilAccesible({
  etiqueta,
  descripcionLecturaFacil,
  pistaAccesible,
  icono,
  onPress,
  variante = "primario",
  tema = "claro",
  familiaTipografica = "atkinson",
  tamanoTexto = "normal",
  tamanoBoton = "normal",
  forma = "redondeado",
  deshabilitado = false,
  seleccionado = false,
  focoForzado = false,
  testID,
  estiloContenedor,
}: BotonTactilAccesibleProps): React.JSX.Element {
  const [tieneFocoTeclado, setTieneFocoTeclado] = useState(false);

  const paleta = PALETAS_COLOR[tema];
  const tokens = calcularTokensTipografia({
    familia: familiaTipografica,
    tamanoTexto,
    tamanoBoton,
    forma,
  });

  const coloresVariante = (() => {
    switch (variante) {
      case "secundario":
        return {
          fondo: paleta.superficie,
          texto: paleta.texto,
          borde: paleta.borde,
        };
      case "exito":
        return {
          fondo: paleta.exito,
          texto: paleta.textoSobreExito,
          borde: paleta.exito,
        };
      case "peligro":
        return {
          fondo: paleta.peligro,
          texto: paleta.textoSobrePeligro,
          borde: paleta.peligro,
        };
      case "primario":
      default:
        return {
          fondo: paleta.primario,
          texto: paleta.textoSobrePrimario,
          borde: paleta.primario,
        };
    }
  })();

  const focoActivo = focoForzado || tieneFocoTeclado;
  const etiquetaLector = descripcionLecturaFacil ?? etiqueta;

  return (
    <Pressable
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={etiquetaLector}
      accessibilityHint={pistaAccesible}
      accessibilityState={{
        disabled: deshabilitado,
        selected: seleccionado,
      }}
      disabled={deshabilitado}
      onPress={() => {
        if (!deshabilitado) {
          onPress();
        }
      }}
      onFocus={() => setTieneFocoTeclado(true)}
      onBlur={() => setTieneFocoTeclado(false)}
      style={({ pressed }) => [
        estilos.botonBase,
        {
          minHeight: Math.max(AREA_TACTIL_MINIMA_PX, tokens.altoMinimoBotonPx),
          minWidth: Math.max(AREA_TACTIL_MINIMA_PX, tokens.anchoMinimoBotonPx),
          paddingHorizontal: tokens.paddingHorizontalBotonPx,
          borderRadius: tokens.radioBotonPx,
          backgroundColor: coloresVariante.fondo,
          borderColor: focoActivo ? paleta.foco : coloresVariante.borde,
          borderWidth: focoActivo ? GROSOR_BORDE_FOCO_PX : 3,
          opacity: deshabilitado ? 0.5 : pressed ? 0.88 : 1,
        },
        focoActivo ? estilos.anilloFocoActivo : null,
        estiloContenedor,
      ]}
    >
      <View style={estilos.contenidoInterno}>
        {icono ? (
          <Text
            style={[
              estilos.icono,
              {
                color: coloresVariante.texto,
                fontSize: Math.round(tokens.tamanoTextoBotonPx * 1.15),
              },
            ]}
          >
            {icono}
          </Text>
        ) : null}
        <Text
          style={[
            estilos.texto,
            {
              color: coloresVariante.texto,
              fontFamily: tokens.familiaNegrita,
              fontSize: tokens.tamanoTextoBotonPx,
            },
          ]}
        >
          {etiqueta}
        </Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botonBase: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  anilloFocoActivo: {
    transform: [{ scale: 1.02 }],
  },
  contenidoInterno: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  icono: {
    fontWeight: "700",
  },
  texto: {
    fontWeight: "700",
    textAlign: "center",
  },
});
