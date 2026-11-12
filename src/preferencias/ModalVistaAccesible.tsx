// Ventana rápida de accesibilidad (a11yPanel en tuagendita-prototipos.html). Se abre con el botón
// «Accesibilidad» de la barra de abajo, en cualquier pantalla. El alumno o el tutor cambian al
// momento qué se ve (solo dibujos, solo texto o ambos) y el tamaño de la letra.
// Áreas táctiles de al menos 48 px, Lectura Fácil y la opción elegida con marca, no solo con color.
import React from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";

import type { Paleta } from "../temas";
import { Icono, type NombreIcono } from "../ui/Icono";
import { Texto } from "../ui/Texto";
import { useApariencia, useEstilos } from "../ui/apariencia";
import { usePreferencias } from "./PreferenciasProvider";
import {
  MODOS_CANAL,
  ORDEN_MODOS_CANAL,
  ORDEN_TAMANOS_LETRA,
  TAMANOS_LETRA,
  type ModoCanal,
} from "./opciones";

export interface ModalVistaAccesibleProps {
  visible: boolean;
  alCerrar: () => void;
  testID?: string;
}

const ICONOS_CANAL: Record<ModoCanal, NombreIcono[]> = {
  ambos: ["imagen", "lista"],
  soloPictograma: ["imagen"],
  soloTexto: ["lista"],
};

export function ModalVistaAccesible({
  visible,
  alCerrar,
  testID = "modal-vista-accesible",
}: ModalVistaAccesibleProps) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const { preferencias, cambiar } = usePreferencias();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={alCerrar}
      testID={testID}
    >
      <View style={e.fondo}>
        <View
          style={e.tarjeta}
          accessibilityRole="dialog"
          accessibilityLabel="Opciones de accesibilidad y vista de la agenda"
        >
          <View style={e.cabecera}>
            <Icono nombre="accesibilidad" color={colores.primario} tam={36} />
            <Texto style={e.titulo} accessibilityRole="header">
              ¿Cómo quieres ver la pantalla?
            </Texto>
          </View>

          <View style={e.seccion}>
            <Texto style={e.etiquetaSeccion}>Qué se ve</Texto>
            <View style={e.fila} accessibilityRole="radiogroup" accessibilityLabel="Qué se ve">
              {ORDEN_MODOS_CANAL.map((modo) => (
                <Opcion
                  key={modo}
                  testID={`opcion-canal-${modo}`}
                  etiqueta={MODOS_CANAL[modo].etiqueta}
                  elegida={preferencias.canal === modo}
                  onPress={() => cambiar({ canal: modo })}
                  iconos={ICONOS_CANAL[modo]}
                />
              ))}
            </View>
          </View>

          <View style={e.seccion}>
            <Texto style={e.etiquetaSeccion}>Tamaño de letra</Texto>
            <View
              style={e.fila}
              accessibilityRole="radiogroup"
              accessibilityLabel="Tamaño de letra"
            >
              {ORDEN_TAMANOS_LETRA.map((tamano) => (
                <Opcion
                  key={tamano}
                  testID={`opcion-letra-${tamano}`}
                  etiqueta={TAMANOS_LETRA[tamano].etiqueta}
                  accessibilityLabel={`Tamaño ${TAMANOS_LETRA[tamano].etiqueta}`}
                  elegida={preferencias.tamanoLetra === tamano}
                  onPress={() => cambiar({ tamanoLetra: tamano })}
                  muestra={
                    <Texto
                      escalar={false}
                      style={[e.letraMuestra, { fontSize: 24 * TAMANOS_LETRA[tamano].escala }]}
                    >
                      A
                    </Texto>
                  }
                />
              ))}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [e.botonListo, pressed && e.pulsado]}
            accessibilityRole="button"
            accessibilityLabel="Cerrar opciones de vista"
            testID="btn-cerrar-modal-vista"
            onPress={alCerrar}
          >
            <Icono nombre="check" color={colores.textoSobrePrimario} tam={28} grosor={3} />
            <Texto style={e.textoListo}>Listo</Texto>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Opcion({
  etiqueta,
  elegida,
  onPress,
  iconos,
  muestra,
  accessibilityLabel,
  testID,
}: {
  etiqueta: string;
  elegida: boolean;
  onPress: () => void;
  iconos?: NombreIcono[];
  muestra?: React.ReactNode;
  accessibilityLabel?: string;
  testID: string;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      accessibilityState={{ checked: elegida, selected: elegida }}
      onPress={onPress}
      style={({ pressed }) => [e.opcion, elegida && e.opcionElegida, pressed && e.pulsado]}
    >
      <View style={e.filaIconos}>
        {iconos?.map((n) => (
          <Icono key={n} nombre={n} color={colores.primario} tam={28} />
        ))}
        {muestra}
      </View>
      <View style={e.filaIconos}>
        {elegida ? <Icono nombre="check" color={colores.primario} tam={22} grosor={3} /> : null}
        <Texto style={e.textoOpcion}>{etiqueta}</Texto>
      </View>
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    fondo: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    tarjeta: {
      maxWidth: 640,
      width: "100%",
      borderRadius: 20,
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      padding: 24,
      gap: 22,
    },
    cabecera: { flexDirection: "row", alignItems: "center", gap: 12 },
    titulo: { flex: 1, fontSize: 26, fontWeight: "700", color: c.texto },
    seccion: { gap: 10 },
    etiquetaSeccion: { fontSize: 20, fontWeight: "700", color: c.texto },
    fila: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    opcion: {
      flexGrow: 1,
      flexBasis: 150,
      minHeight: 84,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    opcionElegida: {
      borderWidth: 4,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    filaIconos: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 28 },
    textoOpcion: { fontSize: 18, fontWeight: "700", color: c.texto },
    letraMuestra: { fontWeight: "700", color: c.primario },
    botonListo: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: 16,
      backgroundColor: c.primario,
    },
    textoListo: { fontSize: 22, fontWeight: "700", color: c.textoSobrePrimario },
    pulsado: { opacity: 0.85 },
  });
