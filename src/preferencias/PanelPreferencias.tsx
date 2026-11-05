// Panel de preferencias de apariencia (T-04.3, HU-04). Todo se configura en una sola pantalla y
// sin pasos técnicos (RNF3.3); cada cambio se ve al momento en la vista previa (RF3.15).
// Cubre RF3.1 (paleta y canal de información), RF3.2 (tipo de letra), RF3.3 (tamaño de letra),
// RF3.4 (tamaño de botones, tres opciones) y RF3.5 (forma de los botones).
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { NOMBRES_TEMAS, TEMAS, useTema } from "../temas";
import { BotonAccesible } from "./BotonAccesible";
import { OpcionPreferencia } from "./OpcionPreferencia";
import { usePreferencias } from "./PreferenciasProvider";
import {
  FORMAS_BOTON,
  FUENTES,
  MODOS_CANAL,
  ORDEN_FORMAS,
  ORDEN_FUENTES,
  ORDEN_MODOS_CANAL,
  ORDEN_TAMANOS_BOTON,
  ORDEN_TAMANOS_LETRA,
  TAMANOS_BOTON,
  TAMANOS_LETRA,
} from "./opciones";

interface GrupoProps {
  titulo: string;
  ayuda?: string;
  children: React.ReactNode;
}

function Grupo({ titulo, ayuda, children }: GrupoProps) {
  const { colores } = useTema();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={titulo}
      style={[styles.grupo, { borderColor: colores.borde }]}
    >
      <Text style={[styles.leyenda, { color: colores.texto }]}>{titulo}</Text>
      {ayuda ? (
        <Text style={[styles.ayuda, { color: colores.textoSecundario }]}>{ayuda}</Text>
      ) : null}
      <View style={styles.opciones}>{children}</View>
    </View>
  );
}

export function PanelPreferencias() {
  const { colores } = useTema();
  const { preferencias, estilos, cambiar, restablecer } = usePreferencias();

  const verDibujo = preferencias.canal === "ambos" || preferencias.canal === "soloPictograma";
  const verTexto = preferencias.canal === "ambos" || preferencias.canal === "soloTexto";

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={styles.pantalla}>
      <Text accessibilityRole="header" style={[styles.titulo, { color: colores.texto }]}>
        Cómo quieres ver la agenda
      </Text>
      <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>
        Elige y mira abajo cómo queda. Los cambios se ven al momento.
      </Text>

      <View style={styles.columnas}>
        <View style={styles.columna}>
          <Grupo
            titulo="Qué se ve (Dibujos y palabras)"
            ayuda="Elige si quieres ver solo dibujos, solo texto en letra grande o ambos a la vez."
          >
            {ORDEN_MODOS_CANAL.map((modo) => (
              <OpcionPreferencia
                key={modo}
                etiqueta={`${MODOS_CANAL[modo].icono} ${MODOS_CANAL[modo].etiqueta}`}
                elegida={preferencias.canal === modo}
                onPress={() => cambiar({ canal: modo })}
              />
            ))}
          </Grupo>

          <Grupo titulo="Fondo y colores">
            {NOMBRES_TEMAS.map((nombre) => {
              const tema = TEMAS[nombre];
              return (
                <OpcionPreferencia
                  key={nombre}
                  etiqueta={tema.etiqueta}
                  elegida={preferencias.tema === nombre}
                  onPress={() => cambiar({ tema: nombre })}
                  muestra={
                    <View
                      accessibilityElementsHidden
                      style={[
                        styles.muestraColor,
                        { backgroundColor: tema.paleta.fondo, borderColor: tema.paleta.borde },
                      ]}
                    >
                      <Text style={[styles.textoMuestra, { color: tema.paleta.primario }]}>Aa</Text>
                    </View>
                  }
                />
              );
            })}
          </Grupo>

          <Grupo titulo="Tipo de letra" ayuda="Son letras pensadas para leer con más facilidad.">
            {ORDEN_FUENTES.map((fuente) => (
              <OpcionPreferencia
                key={fuente}
                etiqueta={FUENTES[fuente].etiqueta}
                elegida={preferencias.fuente === fuente}
                onPress={() => cambiar({ fuente })}
                fuente={FUENTES[fuente].familiaNegrita}
              />
            ))}
          </Grupo>

          <Grupo titulo="Tamaño de letra">
            {ORDEN_TAMANOS_LETRA.map((tamano) => (
              <OpcionPreferencia
                key={tamano}
                etiqueta={TAMANOS_LETRA[tamano].etiqueta}
                elegida={preferencias.tamanoLetra === tamano}
                onPress={() => cambiar({ tamanoLetra: tamano })}
              />
            ))}
          </Grupo>

          <Grupo titulo="Tamaño de los botones">
            {ORDEN_TAMANOS_BOTON.map((tamano) => (
              <OpcionPreferencia
                key={tamano}
                etiqueta={TAMANOS_BOTON[tamano].etiqueta}
                elegida={preferencias.tamanoBoton === tamano}
                onPress={() => cambiar({ tamanoBoton: tamano })}
              />
            ))}
          </Grupo>

          <Grupo titulo="Forma de los botones">
            {ORDEN_FORMAS.map((forma) => (
              <OpcionPreferencia
                key={forma}
                etiqueta={FORMAS_BOTON[forma].etiqueta}
                elegida={preferencias.forma === forma}
                onPress={() => cambiar({ forma })}
              />
            ))}
          </Grupo>

          <BotonAccesible
            variante="suave"
            etiqueta="Volver a lo de siempre"
            onPress={restablecer}
            style={styles.botonRestablecer}
          />
        </View>

        <View style={styles.columna}>
          <Text style={[styles.leyenda, { color: colores.texto }]}>Así se ve</Text>
          <View
            accessibilityLabel="Vista previa de la agenda con tus elecciones"
            style={[
              styles.vistaPrevia,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.borde,
                borderRadius: estilos.radioTarjeta,
              },
            ]}
          >
            <View
              style={[
                styles.tareaAhora,
                { backgroundColor: colores.superficieDestacada, borderColor: colores.primario },
                { borderRadius: estilos.radioTarjeta },
              ]}
            >
              <Text
                style={{
                  color: colores.textoSecundario,
                  fontFamily: estilos.fuenteNormal,
                  fontSize: estilos.texto(14),
                }}
              >
                AHORA
              </Text>

              <View style={styles.filaContenidoTarea}>
                {verDibujo && (
                  <View
                    testID="preview-pictograma"
                    style={[
                      styles.cajaPictograma,
                      {
                        borderColor: colores.borde,
                        width: preferencias.canal === "soloPictograma" ? 90 : 64,
                        height: preferencias.canal === "soloPictograma" ? 90 : 64,
                      },
                    ]}
                  >
                    <Text
                      style={{ fontSize: preferencias.canal === "soloPictograma" ? 54 : 38 }}
                      accessibilityLabel="Lavarse las manos"
                    >
                      🧼
                    </Text>
                  </View>
                )}

                {verTexto && (
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      testID="preview-titulo-texto"
                      style={{
                        color: colores.texto,
                        fontFamily: estilos.fuenteNegrita,
                        fontSize:
                          preferencias.canal === "soloTexto"
                            ? estilos.texto(26)
                            : estilos.texto(22),
                        fontWeight: "700",
                      }}
                    >
                      Lavarse las manos
                    </Text>
                    <Text
                      testID="preview-descripcion-texto"
                      style={{
                        color: colores.textoSecundario,
                        fontFamily: estilos.fuenteNormal,
                        fontSize: estilos.tamanoTexto,
                      }}
                    >
                      Faltan 5 minutos. Usa agua y jabón.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.botonesVista}>
              <BotonAccesible etiqueta="Empezar" onPress={() => {}} />
              <BotonAccesible etiqueta="Más tarde" variante="suave" onPress={() => {}} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pantalla: { padding: 20, gap: 14 },
  titulo: { fontSize: 28, fontWeight: "800" },
  subtitulo: { fontSize: 16 },
  columnas: { flexDirection: "row", flexWrap: "wrap", gap: 20, alignItems: "flex-start" },
  columna: { flexGrow: 1, flexBasis: 340, gap: 14, minWidth: 280 },
  grupo: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  leyenda: { fontSize: 16, fontWeight: "800" },
  ayuda: { fontSize: 14 },
  opciones: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  muestraColor: {
    width: 64,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  textoMuestra: { fontSize: 21, fontWeight: "700" },
  botonRestablecer: { alignSelf: "flex-start" },
  vistaPrevia: { borderWidth: 3, padding: 16, gap: 16 },
  tareaAhora: { borderWidth: 3, padding: 14, gap: 6 },
  filaContenidoTarea: { flexDirection: "row", alignItems: "center", gap: 14 },
  cajaPictograma: {
    borderWidth: 2,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  botonesVista: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
