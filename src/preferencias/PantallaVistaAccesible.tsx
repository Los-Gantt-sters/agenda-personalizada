// Pantalla rápida de accesibilidad (a11yPanel en tuagendita-prototipos.html). Se abre con el botón
// «Accesibilidad» de la barra de abajo, en cualquier pantalla. El alumno o el tutor cambian al
// momento qué se ve (solo dibujos, solo texto o ambos) y el tamaño de la letra.
// Mejora de la profesora (noviembre de 2026): ya no es una ventana emergente sino una pantalla
// completa, con su cabecera y su barra de abajo. Tapa la pantalla de la que viene sin quitarla:
// «Atrás» o «Listo» vuelven a ella tal como estaba.
// Áreas táctiles de al menos 48 px, Lectura Fácil y la opción elegida con marca, no solo con color.
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { MarcoPantalla } from "../pantalla/MarcoPantalla";
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

export interface PantallaVistaAccesibleProps {
  visible: boolean;
  alCerrar: () => void;
  testID?: string;
}

const ICONOS_CANAL: Record<ModoCanal, NombreIcono[]> = {
  ambos: ["imagen", "lista"],
  soloPictograma: ["imagen"],
  soloTexto: ["lista"],
};

export function PantallaVistaAccesible({
  visible,
  alCerrar,
  testID = "pantalla-vista-accesible",
}: PantallaVistaAccesibleProps) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const { preferencias, cambiar } = usePreferencias();
  if (!visible) return null;

  return (
    <MarcoPantalla
      encima
      testID={testID}
      titulo="¿Cómo quieres ver la pantalla?"
      simbolo={<Icono nombre="accesibilidad" color={colores.primario} tam={36} />}
      atras={alCerrar}
      etiquetaAtras="Atrás: volver a la pantalla de antes"
      adelante={alCerrar}
      textoAdelante="Listo"
      etiquetaAdelante="Listo, volver a la pantalla de antes"
      idTitulo="titulo-accesibilidad"
      idAtras="btn-cerrar-vista"
      idAdelante="btn-cerrar-modal-vista"
    >
      <View style={e.contenido}>
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
          <View style={e.fila} accessibilityRole="radiogroup" accessibilityLabel="Tamaño de letra">
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
      </View>
    </MarcoPantalla>
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
          <Icono key={n} nombre={n} color={colores.primario} tam={32} />
        ))}
        {muestra}
      </View>
      <View style={e.filaIconos}>
        {elegida ? <Icono nombre="check" color={colores.primario} tam={24} grosor={3} /> : null}
        <Texto style={e.textoOpcion}>{etiqueta}</Texto>
      </View>
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenido: {
      flex: 1,
      width: "100%",
      maxWidth: 860,
      alignSelf: "center",
      justifyContent: "center",
      gap: 32,
      padding: 20,
    },
    seccion: { gap: 12 },
    etiquetaSeccion: { fontSize: 22, fontWeight: "700", color: c.texto },
    fila: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
    opcion: {
      flexGrow: 1,
      flexBasis: 200,
      minHeight: 104,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
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
    filaIconos: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32 },
    textoOpcion: { fontSize: 20, fontWeight: "700", color: c.texto },
    letraMuestra: { fontWeight: "700", color: c.primario },
    pulsado: { opacity: 0.85 },
  });
