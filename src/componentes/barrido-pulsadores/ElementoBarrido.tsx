// Contenedor interactivo con resaltado de foco grueso para el motor de barrido (SCRUM-120 · T-05.1).
// Garantiza un anillo de foco de >= 6 px de grosor, alto contraste respecto al tema activo y
// distintivo visual ("🎯 PULSA") para no depender solo del color (RF14.2, RNF3.4, RNF14.4).
import React, { useEffect, useRef, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { useTema } from "../../temas";
import { useMotorBarridoOpcional } from "./MotorBarridoProvider";
import { GROSOR_FOCO_BARRIDO_PX } from "./tiposBarrido";

export interface ElementoBarridoProps {
  id: string;
  etiqueta: string;
  orden?: number;
  deshabilitado?: boolean;
  alActivar: () => void;
  /** Permite forzar el foco grueso en vistas previas o tests unitarios. */
  focoForzado?: boolean;
  mostrarEtiquetaFoco?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode;
}

export function ElementoBarrido({
  id,
  etiqueta,
  orden,
  deshabilitado = false,
  alActivar,
  focoForzado = false,
  mostrarEtiquetaFoco = true,
  style,
  testID,
  children,
}: ElementoBarridoProps): React.JSX.Element {
  const motor = useMotorBarridoOpcional();
  const { nombre: nombreTema, colores } = useTema();
  const alActivarRef = useRef(alActivar);

  useEffect(() => {
    alActivarRef.current = alActivar;
  }, [alActivar]);

  const registrarObjetivo = motor?.registrarObjetivo;
  const desregistrarObjetivo = motor?.desregistrarObjetivo;

  useEffect(() => {
    if (!registrarObjetivo || !desregistrarObjetivo) return undefined;
    registrarObjetivo({
      id,
      etiqueta,
      orden,
      deshabilitado,
      alActivar: () => alActivarRef.current(),
    });
    return () => {
      desregistrarObjetivo(id);
    };
  }, [deshabilitado, desregistrarObjetivo, etiqueta, id, orden, registrarObjetivo]);

  const estaEnfocado =
    focoForzado ||
    (motor !== null &&
      motor.configuracion.modo !== "desactivado" &&
      motor.objetivoEnfocado?.id === id &&
      !deshabilitado);

  // Color de foco grueso según paleta activa para máximo contraste (RF14.2)
  const colorBordeFoco =
    nombreTema === "altoContrasteOscuro" || nombreTema === "oscuro"
      ? "#FFD400"
      : nombreTema === "altoContrasteClaro"
        ? "#000000"
        : "#B42318";

  const colorFondoHalo =
    nombreTema === "altoContrasteOscuro" || nombreTema === "oscuro"
      ? "#2A2400"
      : nombreTema === "altoContrasteClaro"
        ? "#FEF9C3"
        : "#FEF3DC";

  const colorTextoInsignia =
    nombreTema === "altoContrasteOscuro" || nombreTema === "oscuro" ? "#000000" : "#FFFFFF";

  return (
    <Pressable
      testID={testID ?? `elemento-barrido-${id}`}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{
        disabled: deshabilitado,
        selected: estaEnfocado,
      }}
      disabled={deshabilitado}
      onPress={() => {
        if (!deshabilitado) {
          alActivar();
        }
      }}
      style={[
        estilos.contenedorBase,
        {
          borderColor: estaEnfocado ? colorBordeFoco : "transparent",
          borderWidth: estaEnfocado ? GROSOR_FOCO_BARRIDO_PX : 0,
          backgroundColor: estaEnfocado ? colorFondoHalo : "transparent",
        },
        estaEnfocado ? estilos.contenedorEnfocado : null,
        deshabilitado ? estilos.contenedorDeshabilitado : null,
        style,
      ]}
    >
      {estaEnfocado && mostrarEtiquetaFoco ? (
        <View
          testID={`insignia-foco-${id}`}
          style={[
            estilos.insigniaFoco,
            {
              backgroundColor: colorBordeFoco,
              borderColor: colores.superficie,
            },
          ]}
        >
          <Text style={[estilos.textoInsigniaFoco, { color: colorTextoInsignia }]}>
            🎯 FOCO · PULSA
          </Text>
        </View>
      ) : null}
      {children}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedorBase: {
    position: "relative",
    borderRadius: 14,
    padding: 4,
  },
  contenedorEnfocado: {
    transform: [{ scale: 1.02 }],
  },
  contenedorDeshabilitado: {
    opacity: 0.5,
  },
  insigniaFoco: {
    position: "absolute",
    top: -12,
    right: 8,
    zIndex: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 2,
  },
  textoInsigniaFoco: {
    fontSize: 12,
    fontWeight: "700",
  },
});
