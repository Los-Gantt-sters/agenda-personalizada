// Puente React y barra de captura de eventos de pulsador externo (switch/USB/Bluetooth/Teclado)
// conectado al MotorBarridoProvider (SCRUM-121 · T-05.2, HU-05).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ControladorPulsadorExterno,
  type ConfiguracionPulsadorExterno,
  type EventoEntradaPulsador,
  type ResultadoCapturaPulsador,
} from "../../servicios/pulsadorExternoService";
import { useMotorBarrido } from "./MotorBarridoProvider";

export interface CapturadorPulsadorExternoProps {
  configuracionPulsador?: Partial<ConfiguracionPulsadorExterno>;
  mostrarPanelDisparo?: boolean;
  alCapturarEvento?: (resultado: ResultadoCapturaPulsador) => void;
  testID?: string;
}

export function useCapturaPulsadorExterno(
  configuracionPulsador?: Partial<ConfiguracionPulsadorExterno>,
  alCapturarEvento?: (resultado: ResultadoCapturaPulsador) => void,
) {
  const { configuracion, avanzarFoco, retrocederFoco, seleccionarActual, accionarPulsadorUnico } =
    useMotorBarrido();

  const controladorRef = useRef<ControladorPulsadorExterno>(
    new ControladorPulsadorExterno(configuracionPulsador),
  );
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoCapturaPulsador | null>(null);

  useEffect(() => {
    if (configuracionPulsador) {
      controladorRef.current.actualizarConfiguracion(configuracionPulsador);
    }
  }, [configuracionPulsador]);

  const dispararEvento = useCallback(
    (evento: EventoEntradaPulsador): ResultadoCapturaPulsador => {
      const resultado = controladorRef.current.procesarEvento(evento, configuracion.modo, {
        alAvanzar: avanzarFoco,
        alRetroceder: retrocederFoco,
        alSeleccionar: () => {
          if (configuracion.modo === "automatico") {
            accionarPulsadorUnico("pulsador_unico");
          } else {
            seleccionarActual("pulsador_seleccion");
          }
        },
      });
      setUltimoResultado(resultado);
      alCapturarEvento?.(resultado);
      return resultado;
    },
    [
      accionarPulsadorUnico,
      alCapturarEvento,
      avanzarFoco,
      configuracion.modo,
      retrocederFoco,
      seleccionarActual,
    ],
  );

  // Escucha global de eventos keydown en entorno Web / adaptador USB-Bluetooth HID
  useEffect(() => {
    if (
      configuracion.modo === "desactivado" ||
      typeof window === "undefined" ||
      typeof window.addEventListener !== "function"
    ) {
      return undefined;
    }

    const manejadorKeyDown = (e: KeyboardEvent) => {
      const target = e.target as { tagName?: string } | null;
      const resultado = dispararEvento({
        key: e.key,
        code: e.code,
        shiftKey: e.shiftKey,
        repeat: e.repeat,
        targetTagName: target?.tagName,
      });
      if (resultado.ejecutado && typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", manejadorKeyDown);
    return () => {
      window.removeEventListener("keydown", manejadorKeyDown);
    };
  }, [configuracion.modo, dispararEvento]);

  return {
    dispararEvento,
    ultimoResultado,
    obtenerEstadisticas: () => controladorRef.current.obtenerEstadisticas(),
  };
}

export function CapturadorPulsadorExterno({
  configuracionPulsador,
  mostrarPanelDisparo = true,
  alCapturarEvento,
  testID = "capturador-pulsador-externo",
}: CapturadorPulsadorExternoProps): React.JSX.Element | null {
  const { configuracion } = useMotorBarrido();
  const { dispararEvento, ultimoResultado } = useCapturaPulsadorExterno(
    configuracionPulsador,
    alCapturarEvento,
  );

  if (!mostrarPanelDisparo || configuracion.modo === "desactivado") {
    return null;
  }

  return (
    <View testID={testID} style={estilos.panel}>
      <View style={estilos.filaInfo}>
        <View style={estilos.pildoraSwitch}>
          <Text style={estilos.textoPildoraSwitch}>USB / Bluetooth Switch HID</Text>
        </View>
        <Text testID="estado-ultimo-evento-pulsador" style={estilos.textoEstado}>
          {ultimoResultado?.ejecutado
            ? `Acción: ${ultimoResultado.accion.toUpperCase()} (${ultimoResultado.tecla})`
            : "Listo para recibir señal de pulsador (Espacio / Intro / Switch)"}
        </Text>
      </View>

      <View style={estilos.filaBotonesSwitch}>
        {configuracion.modo === "manual" ? (
          <Pressable
            testID="btn-switch-externo-1-avanzar"
            accessibilityRole="button"
            accessibilityLabel="Simular Pulsador 1 USB: Avanzar foco"
            onPress={() => dispararEvento({ key: "Switch1", code: "Switch1" })}
            style={estilos.botonSwitchSecundario}
          >
            <Text style={estilos.textoSwitchSecundario}>Pulsador 1 (Avanzar)</Text>
          </Pressable>
        ) : null}

        <Pressable
          testID="btn-switch-externo-seleccionar"
          accessibilityRole="button"
          accessibilityLabel="Simular Pulsador USB: Seleccionar elemento"
          onPress={() =>
            dispararEvento({
              key: configuracion.modo === "automatico" ? " " : "Enter",
              code: configuracion.modo === "automatico" ? "Space" : "Enter",
            })
          }
          style={estilos.botonSwitchPrimario}
        >
          <Text style={estilos.textoSwitchPrimario}>
            {configuracion.modo === "automatico"
              ? "Pulsador Único (Espacio / Switch)"
              : "Pulsador 2 (Intro / Elegir)"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  panel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#C9CED6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filaInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    flex: 1,
  },
  pildoraSwitch: {
    backgroundColor: "#F5E9EF",
    borderWidth: 1,
    borderColor: "#7A1F4D",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  textoPildoraSwitch: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  textoEstado: {
    fontSize: 14,
    fontWeight: "700",
    color: "#555C69",
  },
  filaBotonesSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botonSwitchSecundario: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoSwitchSecundario: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  botonSwitchPrimario: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1E7A46",
    backgroundColor: "#1E7A46",
    alignItems: "center",
    justifyContent: "center",
  },
  textoSwitchPrimario: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
