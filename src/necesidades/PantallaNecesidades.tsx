// Pantalla «¿Qué necesitas?» (14) y «Aviso enviado» (14b), que se abren con «Ayuda» de la barra.
// Mejoras de la profesora (noviembre de 2026):
// - Ya no es una ventana emergente: es una pantalla completa con su cabecera y su barra de abajo.
//   Tapa la pantalla de la que viene sin quitarla, así que al volver todo sigue igual.
// - Sin scroll: las opciones caben siempre en la pantalla.
// - «Atrás» vuelve sin avisar a nadie.
// MOD HU-18 (SCRUM-268, bocetos 14 y 14b de definitiva_v2):
// - Salen las 1-3 ayudas que el adulto eligió en la 26 (de ARASAAC o de Mi biblioteca), cada una
//   con su imagen y su texto guardados, y debajo «Urgencia» siempre, a todo lo ancho.
// - Baño, agua y descanso llevan los textos del boceto 14 («Quiero ir al baño»...).
// - Al pedir algo, la 14b solo enseña un tick verde grande y «Solicitud enviada»; «Adelante» queda
//   apagado y se vuelve con «Atrás».
import React from "react";
import { Image, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import { claveBasicaDeAyuda } from "../preferencias/ayudas";
import { MarcoPantalla } from "../pantalla/MarcoPantalla";
import { ratioContraste } from "../temas";
import { Icono, PictogramaInterfaz, Texto, useApariencia } from "../ui";
import { OPCIONES_NECESIDADES_BASICAS } from "./opcionesNecesidades";
import type { AyudaElegida, PantallaNecesidadesProps } from "./tipos";

/** Blanco o negro, el que más contraste dé sobre `fondo`. */
const textoSobre = (fondo: string) =>
  ratioContraste("#FFFFFF", fondo) >= ratioContraste("#000000", fondo) ? "#FFFFFF" : "#000000";

/** Texto de la tarjeta: el del boceto 14 si es baño, agua o descanso; si no, el guardado. */
function textoEnLa14(ayuda: AyudaElegida): string {
  const clave = claveBasicaDeAyuda(ayuda);
  return OPCIONES_NECESIDADES_BASICAS.find((o) => o.clave === clave)?.etiqueta ?? ayuda.texto;
}

export const PantallaNecesidades: React.FC<PantallaNecesidadesProps> = ({
  visible,
  ayudas,
  alSolicitar,
  alCerrar,
  solicitudEnviada = null,
  canal = "ambos",
}) => {
  // Los colores salen del tema activo (claro, oscuro, pastel o alto contraste).
  const { colores } = useApariencia();
  if (!visible) return null;

  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";
  const colorTexto = colores.texto;
  const colorUrgencia = colores.peligro;
  const colorTextoUrgencia = textoSobre(colorUrgencia);
  const enviada = solicitudEnviada !== null;

  return (
    <MarcoPantalla
      encima
      testID="pantalla-necesidades"
      titulo={enviada ? "Aviso enviado" : "¿Qué necesitas?"}
      simbolo={
        enviada ? (
          <Icono nombre="check" color={colores.primario} tam={36} grosor={3} />
        ) : (
          <PictogramaInterfaz nombre="ayuda" etiqueta="Ayuda" tam={44} />
        )
      }
      atras={alCerrar}
      etiquetaAtras={enviada ? "Atrás" : "Atrás: volver sin avisar"}
      adelante={null}
      idTitulo="titulo-necesidades"
      idAtras="btn-cerrar-necesidades"
      idAdelante="btn-vale-confirmacion"
    >
      {!enviada ? (
        <View style={estilos.contenido}>
          {/* Las 1-3 ayudas que eligió el adulto en la 26, en su orden. */}
          <View style={estilos.cuadriculaOpciones} testID="cuadricula-opciones-necesidades">
            {ayudas.map((ayuda) => {
              const texto = textoEnLa14(ayuda);
              return (
                <TouchableOpacity
                  key={ayuda.id}
                  testID={`opcion-ayuda-${ayuda.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={texto}
                  accessibilityHint={`Pulsa para pedir: ${texto}`}
                  activeOpacity={0.75}
                  onPress={() => alSolicitar(ayuda)}
                  style={[
                    estilos.botonOpcionGigante,
                    { backgroundColor: colores.superficie, borderColor: colores.primario },
                  ]}
                >
                  {verDibujo && (
                    <View
                      style={[
                        estilos.contenedorPictograma,
                        canal === "soloPictograma" && estilos.contenedorPictogramaGigante,
                      ]}
                    >
                      <Image
                        source={{ uri: ayuda.imagenUrl }}
                        style={[
                          estilos.imagenPictograma,
                          canal === "soloPictograma" && estilos.imagenPictogramaGigante,
                        ]}
                        accessibilityIgnoresInvertColors
                        testID={`img-ayuda-${ayuda.id}`}
                      />
                    </View>
                  )}
                  {verTexto && (
                    <Texto
                      style={[
                        estilos.etiquetaOpcion,
                        { color: colorTexto },
                        canal === "soloTexto" && { fontSize: 26, lineHeight: 32 },
                      ]}
                    >
                      {texto}
                    </Texto>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Urgencia de un toque (RF11.4): sale siempre, a todo lo ancho. */}
          <TouchableOpacity
            testID="opcion-necesidad-urgencia"
            accessibilityRole="button"
            accessibilityLabel="Urgencia. Necesito ayuda ya"
            activeOpacity={0.8}
            onPress={() => alSolicitar("urgencia")}
            style={[
              estilos.botonUrgencia,
              { backgroundColor: colorUrgencia, borderColor: colorUrgencia },
            ]}
          >
            {verDibujo && (
              <>
                <View style={estilos.placaPictogramaUrgencia}>
                  <PictogramaInterfaz nombre="ayuda" etiqueta="" tam={40} />
                </View>
                <Icono
                  nombre="alerta"
                  color={colorTextoUrgencia}
                  tam={canal === "soloPictograma" ? 52 : 36}
                  grosor={3}
                />
              </>
            )}
            {verTexto && (
              <Texto
                style={[
                  estilos.textoUrgencia,
                  { color: colorTextoUrgencia },
                  canal === "soloTexto" && { fontSize: 26 },
                ]}
              >
                Urgencia
              </Texto>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* 14b: pantalla limpia, solo el tick verde grande y «Solicitud enviada». */
        <View style={estilos.contenido} testID="confirmacion-necesidad-enviada">
          <View
            testID="tick-solicitud-enviada"
            style={[estilos.circuloTick, { backgroundColor: colores.exito }]}
            accessible
            accessibilityLabel="Hecho"
          >
            <Icono nombre="check" color={textoSobre(colores.exito)} tam={84} grosor={4} />
          </View>
          <Texto style={[estilos.textoSolicitudEnviada, { color: colorTexto }]}>
            Solicitud enviada
          </Texto>
        </View>
      )}
    </MarcoPantalla>
  );
};

const estilos = StyleSheet.create({
  contenido: {
    flex: 1,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
    padding: 20,
  },
  cuadriculaOpciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    width: "100%",
  },
  botonOpcionGigante: {
    // Opciones gigantes táctiles (>= 180x190 px, muy por encima del mínimo de 48 px).
    flex: 1,
    minWidth: 180,
    maxWidth: 280,
    minHeight: 210,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    ...Platform.select({ web: { cursor: "pointer", userSelect: "none" } }),
  },
  contenedorPictograma: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    // Placa blanca: los trazos de ARASAAC se ven también en los temas oscuros.
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  contenedorPictogramaGigante: { width: 150, height: 150 },
  imagenPictograma: { width: 110, height: 110, resizeMode: "contain" },
  imagenPictogramaGigante: { width: 140, height: 140 },
  etiquetaOpcion: { fontSize: 22, fontWeight: "700", textAlign: "center", lineHeight: 28 },
  botonUrgencia: {
    width: "100%",
    maxWidth: 872,
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  textoUrgencia: { fontSize: 24, fontWeight: "700" },
  placaPictogramaUrgencia: {
    // Placa blanca: el pictograma se ve también sobre el rojo.
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 4,
  },
  circuloTick: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  textoSolicitudEnviada: { fontSize: 40, fontWeight: "700", textAlign: "center" },
});
