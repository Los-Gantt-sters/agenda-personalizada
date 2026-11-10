// Modal accesible de configuración rápida de vista (a11yPanel en tuagendita-prototipos.html).
// Permite al estudiante o tutor cambiar al momento qué información se ve en pantalla:
// solo pictogramas, solo texto o ambos a la vez, garantizando áreas táctiles >= 48px y Lectura Fácil.
import React from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useTema } from "../temas";
import { usePreferencias } from "./PreferenciasProvider";
import { MODOS_CANAL, ORDEN_MODOS_CANAL, ORDEN_TAMANOS_LETRA, TAMANOS_LETRA } from "./opciones";

export interface ModalVistaAccesibleProps {
  visible: boolean;
  alCerrar: () => void;
  testID?: string;
}

export function ModalVistaAccesible({
  visible,
  alCerrar,
  testID = "modal-vista-accesible",
}: ModalVistaAccesibleProps) {
  const { colores } = useTema();
  const { preferencias, estilos, cambiar } = usePreferencias();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={alCerrar}
      testID={testID}
    >
      <View style={styles.fondoOscurecido}>
        <View
          style={[
            styles.tarjetaModal,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.primario,
            },
          ]}
          accessibilityRole="dialog"
          accessibilityLabel="Opciones de accesibilidad y vista de la agenda"
        >
          {/* Cabecera con título y botón de cierre */}
          <View style={styles.cabecera}>
            <View style={styles.tituloFila}>
              <Text style={styles.iconoCabecera} accessibilityElementsHidden>
                ♿
              </Text>
              <Text
                style={[
                  styles.tituloTexto,
                  {
                    color: colores.texto,
                    fontFamily: estilos.fuenteNegrita,
                  },
                ]}
              >
                ¿Cómo quieres ver la pantalla?
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.botonListo,
                {
                  backgroundColor: colores.primario,
                  borderColor: colores.primario,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cerrar opciones de vista"
              testID="btn-cerrar-modal-vista"
              onPress={alCerrar}
            >
              <Text
                style={[
                  styles.textoBotonListo,
                  {
                    color: colores.textoSobrePrimario,
                    fontFamily: estilos.fuenteNegrita,
                  },
                ]}
              >
                ✓ Listo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sección 1: Canal de información (Qué se ve) */}
          <View style={styles.seccion}>
            <Text
              style={[
                styles.etiquetaSeccion,
                {
                  color: colores.texto,
                  fontFamily: estilos.fuenteNegrita,
                },
              ]}
            >
              1. Qué se ve (Dibujos y palabras)
            </Text>
            <View style={styles.filaOpciones}>
              {ORDEN_MODOS_CANAL.map((modo) => {
                const info = MODOS_CANAL[modo];
                const seleccionado = preferencias.canal === modo;
                return (
                  <TouchableOpacity
                    key={modo}
                    testID={`opcion-canal-${modo}`}
                    accessibilityRole="button"
                    accessibilityLabel={info.etiqueta}
                    accessibilityState={{ selected: seleccionado }}
                    onPress={() => cambiar({ canal: modo })}
                    style={[
                      styles.chipOpcion,
                      {
                        backgroundColor: seleccionado
                          ? colores.superficieDestacada
                          : colores.superficie,
                        borderColor: seleccionado ? colores.primario : colores.borde,
                        borderWidth: seleccionado ? 3 : 2,
                      },
                    ]}
                  >
                    <Text style={styles.iconoChip}>{info.icono}</Text>
                    <Text
                      style={[
                        styles.textoChip,
                        {
                          color: colores.texto,
                          fontFamily: seleccionado ? estilos.fuenteNegrita : estilos.fuenteNormal,
                          fontWeight: seleccionado ? "700" : "500",
                        },
                      ]}
                    >
                      {info.etiqueta}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sección 2: Tamaño de letra rápido */}
          <View style={styles.seccion}>
            <Text
              style={[
                styles.etiquetaSeccion,
                {
                  color: colores.texto,
                  fontFamily: estilos.fuenteNegrita,
                },
              ]}
            >
              2. Tamaño de letra
            </Text>
            <View style={styles.filaOpciones}>
              {ORDEN_TAMANOS_LETRA.map((tamano) => {
                const info = TAMANOS_LETRA[tamano];
                const seleccionado = preferencias.tamanoLetra === tamano;
                return (
                  <TouchableOpacity
                    key={tamano}
                    testID={`opcion-letra-${tamano}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Tamaño ${info.etiqueta}`}
                    accessibilityState={{ selected: seleccionado }}
                    onPress={() => cambiar({ tamanoLetra: tamano })}
                    style={[
                      styles.chipOpcion,
                      {
                        backgroundColor: seleccionado
                          ? colores.superficieDestacada
                          : colores.superficie,
                        borderColor: seleccionado ? colores.primario : colores.borde,
                        borderWidth: seleccionado ? 3 : 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoChip,
                        {
                          color: colores.texto,
                          fontFamily: seleccionado ? estilos.fuenteNegrita : estilos.fuenteNormal,
                          fontWeight: seleccionado ? "700" : "500",
                        },
                      ]}
                    >
                      {info.etiqueta}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondoOscurecido: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  tarjetaModal: {
    maxWidth: 580,
    width: "100%",
    borderRadius: 24,
    borderWidth: 4,
    padding: 24,
    gap: 20,
    ...Platform.select({
      web: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25)",
      },
      default: {
        elevation: 8,
      },
    }),
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  tituloFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconoCabecera: {
    fontSize: 28,
  },
  tituloTexto: {
    fontSize: 22,
    fontWeight: "800",
  },
  botonListo: {
    minHeight: 48,
    minWidth: 90,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  textoBotonListo: {
    fontSize: 16,
    fontWeight: "700",
  },
  seccion: {
    gap: 10,
  },
  etiquetaSeccion: {
    fontSize: 17,
    fontWeight: "700",
  },
  filaOpciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chipOpcion: {
    minHeight: 52, // >= 48px WCAG
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexGrow: 1,
  },
  iconoChip: {
    fontSize: 22,
  },
  textoChip: {
    fontSize: 16,
  },
});
