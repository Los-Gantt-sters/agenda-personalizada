// Barra de estado superior del modo barrido por pulsador (SCRUM-120 · T-05.1).
// Inspirada en .scanbar del prototipo y en las píldoras y tarjetas de BOCETOS_NUEVOS.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMotorBarrido } from "./MotorBarridoProvider";

export interface BarraEstadoBarridoProps {
  testID?: string;
}

export function BarraEstadoBarrido({
  testID = "barra-estado-barrido",
}: BarraEstadoBarridoProps): React.JSX.Element | null {
  const {
    configuracion,
    objetivoEnfocado,
    indiceFoco,
    objetivosActivos,
    avanzarFoco,
    accionarPulsadorUnico,
  } = useMotorBarrido();

  if (configuracion.modo === "desactivado" || !configuracion.mostrarBarraEstado) {
    return null;
  }

  const segundosTexto = (configuracion.intervaloMs / 1000).toFixed(1).replace(".", ",");

  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      accessibilityLiveRegion="polite"
      style={estilos.barra}
    >
      <View style={estilos.bloqueInfo}>
        <Text style={estilos.textoPrincipal}>
          {configuracion.modo === "automatico"
            ? `🎯 Modo barrido · 1 pulsador (${segundosTexto} s): el marco pasa solo; pulsa para elegir`
            : "🎯 Modo barrido manual · 2 pulsadores: avanza el foco y pulsa para elegir"}
        </Text>
        <Text testID="barra-barrido-foco-actual" style={estilos.textoFoco}>
          {objetivoEnfocado
            ? `Foco actual (${indiceFoco + 1}/${objetivosActivos.length}): ${objetivoEnfocado.etiqueta}`
            : "Sin elementos activos para barrer"}
        </Text>
      </View>

      <View style={estilos.accionesSimuladas}>
        {configuracion.modo === "manual" ? (
          <Pressable
            testID="btn-barrido-avanzar"
            accessibilityRole="button"
            accessibilityLabel="Pulsador 1: Siguiente elemento"
            onPress={avanzarFoco}
            style={estilos.botonSimuladoSecundario}
          >
            <Text style={estilos.textoBotonSecundario}>⇥ Siguiente</Text>
          </Pressable>
        ) : null}
        <Pressable
          testID="btn-barrido-pulsador"
          accessibilityRole="button"
          accessibilityLabel="Pulsador: Elegir elemento enfocado"
          onPress={() => accionarPulsadorUnico("pulsador_unico")}
          style={estilos.botonSimuladoPrimario}
        >
          <Text style={estilos.textoBotonPrimario}>🔘 Pulsador (Elegir)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    backgroundColor: "#FEF3DC",
    borderWidth: 2,
    borderColor: "#9A5B00",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bloqueInfo: {
    flex: 1,
    minWidth: 240,
    gap: 2,
  },
  textoPrincipal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2328",
  },
  textoFoco: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  accionesSimuladas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botonSimuladoSecundario: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonSecundario: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  botonSimuladoPrimario: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#7A1F4D",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonPrimario: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
