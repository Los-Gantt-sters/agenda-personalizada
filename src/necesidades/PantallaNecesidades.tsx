// Pantalla «¿Qué necesitas?» (SCRUM-87, T-18.2), que se abre con el botón «Ayuda» de la barra.
// Mejoras de la profesora (noviembre de 2026):
// - Ya no es una ventana emergente: es una pantalla completa con su cabecera y su barra de abajo.
//   Tapa la pantalla de la que viene sin quitarla, así que al volver todo sigue igual.
// - Sin scroll: las opciones caben siempre en la pantalla.
// - En Preferencias se elige qué necesidades salen; «Urgencia» sale siempre. (Como las demás
//   preferencias, de momento vale para esta tableta y no se guarda al recargar ni por alumno.)
// - «Atrás» vuelve sin avisar a nadie. Al elegir una, la misma pantalla enseña «Ya lo sabe».
import React from "react";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { PictogramaTarea } from "../componentes/agenda/PictogramaTarea";
import { MarcoPantalla } from "../pantalla/MarcoPantalla";
import { ratioContraste } from "../temas";
import { Icono, PictogramaInterfaz, Texto, useApariencia } from "../ui";
import { OPCIONES_NECESIDADES_BASICAS, obtenerInfoNecesidad } from "./opcionesNecesidades";
import type { PantallaNecesidadesProps } from "./tipos";

/** Blanco o negro, el que más contraste dé sobre `fondo`. */
const textoSobre = (fondo: string) =>
  ratioContraste("#FFFFFF", fondo) >= ratioContraste("#000000", fondo) ? "#FFFFFF" : "#000000";

export const PantallaNecesidades: React.FC<PantallaNecesidadesProps> = ({
  visible,
  alSeleccionarNecesidad,
  alCerrar,
  necesidadEnviada = null,
  alConfirmarAvisoEnviado,
  nombreTutora = "Carmen",
  canal = "ambos",
  mostrarImagenArasaac = true,
  necesidades,
}) => {
  // Los colores salen del tema activo (claro, oscuro, pastel o alto contraste).
  const { colores } = useApariencia();
  if (!visible) return null;

  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";
  const colorTexto = colores.texto;
  const colorUrgencia = colores.peligro;
  const colorTextoUrgencia = textoSobre(colorUrgencia);
  const opciones = OPCIONES_NECESIDADES_BASICAS.filter(
    (o) => !necesidades || necesidades.includes(o.clave),
  );

  const infoEnviada = necesidadEnviada ? obtenerInfoNecesidad(necesidadEnviada) : null;
  const esUrgenciaEnviada = necesidadEnviada === "urgencia";

  return (
    <MarcoPantalla
      encima
      testID="pantalla-necesidades"
      titulo={necesidadEnviada ? "Aviso enviado" : "¿Qué necesitas?"}
      simbolo={<PictogramaInterfaz nombre="ayuda" etiqueta="Ayuda" tam={44} />}
      atras={alCerrar}
      etiquetaAtras="Atrás: volver sin avisar"
      adelante={necesidadEnviada ? (alConfirmarAvisoEnviado ?? alCerrar) : null}
      textoAdelante={necesidadEnviada ? "Vale" : "Adelante"}
      etiquetaAdelante={necesidadEnviada ? "Vale, entendido" : undefined}
      idTitulo="titulo-necesidades"
      idAtras="btn-cerrar-necesidades"
      idAdelante="btn-vale-confirmacion"
    >
      {!necesidadEnviada ? (
        <View style={estilos.contenido}>
          {/* Opciones gigantes ARASAAC: Baño, Agua y Descanso (las que haya elegido el tutor). */}
          <View style={estilos.cuadriculaOpciones} testID="cuadricula-opciones-necesidades">
            {opciones.map((opcion) => (
              <TouchableOpacity
                key={opcion.clave}
                testID={`opcion-necesidad-${opcion.clave}`}
                accessibilityRole="button"
                accessibilityLabel={opcion.etiqueta}
                accessibilityHint={`Pulsa para avisar a ${nombreTutora}: ${opcion.etiqueta}`}
                activeOpacity={0.75}
                onPress={() => alSeleccionarNecesidad(opcion.clave)}
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
                    {mostrarImagenArasaac ? (
                      <Image
                        source={{ uri: opcion.urlPictograma }}
                        style={[
                          estilos.imagenPictograma,
                          canal === "soloPictograma" && estilos.imagenPictogramaGigante,
                        ]}
                        accessibilityLabel={opcion.descripcionAlternativa}
                        testID={`img-arasaac-${opcion.arasaacId}`}
                      />
                    ) : (
                      <Text
                        style={[
                          estilos.simboloPictograma,
                          canal === "soloPictograma" && { fontSize: 56 },
                        ]}
                      >
                        {opcion.simbolo}
                      </Text>
                    )}
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
                    {opcion.etiqueta}
                  </Texto>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Urgencia de un toque (RF11.4): sale siempre. */}
          <TouchableOpacity
            testID="opcion-necesidad-urgencia"
            accessibilityRole="button"
            accessibilityLabel="Urgencia. Necesito ayuda ya"
            activeOpacity={0.8}
            onPress={() => alSeleccionarNecesidad("urgencia")}
            style={[
              estilos.botonUrgencia,
              { backgroundColor: colorUrgencia, borderColor: colorUrgencia },
            ]}
          >
            {verDibujo && (
              <Icono
                nombre="alerta"
                color={colorTextoUrgencia}
                tam={canal === "soloPictograma" ? 52 : 36}
                grosor={3}
              />
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
        /* Confirmación tranquila en la misma pantalla (E.ovl.sent en el prototipo). */
        <View style={estilos.contenido} testID="confirmacion-necesidad-enviada">
          <View style={estilos.flujoVisualConfirmacion}>
            <View
              style={[
                estilos.cajaFiguraConfirmacion,
                { backgroundColor: colores.superficie, borderColor: colores.borde },
              ]}
            >
              {verDibujo && infoEnviada && !esUrgenciaEnviada && (
                <PictogramaTarea
                  tarea={{
                    titulo: infoEnviada.etiqueta,
                    emoji: infoEnviada.simbolo,
                    pictograma_url: mostrarImagenArasaac ? infoEnviada.urlPictograma : null,
                  }}
                  tam={120}
                />
              )}
              {verDibujo && esUrgenciaEnviada && (
                <Icono nombre="alerta" color={colores.peligro} tam={96} grosor={2.6} />
              )}
              {verTexto && (
                <Texto style={[estilos.pieFiguraConfirmacion, { color: colorTexto }]}>
                  {infoEnviada?.etiqueta}
                </Texto>
              )}
            </View>

            <Icono nombre="adelante" color={colorTexto} tam={48} grosor={3} />

            <View
              style={[
                estilos.cajaFiguraConfirmacion,
                { backgroundColor: colores.superficie, borderColor: colores.primario },
              ]}
            >
              {verDibujo && (
                <PictogramaInterfaz nombre="profesora" etiqueta={nombreTutora} tam={120} />
              )}
              {verTexto && (
                <View style={estilos.filaIcono}>
                  <Icono nombre="check" color={colores.exito} tam={26} grosor={3} />
                  <Texto style={[estilos.pieFiguraConfirmacion, { color: colorTexto }]}>
                    {esUrgenciaEnviada
                      ? `${nombreTutora} viene ahora`
                      : `${nombreTutora} ya lo sabe`}
                  </Texto>
                </View>
              )}
            </View>
          </View>

          {verTexto && (
            <Texto style={[estilos.mensajeTranquilizador, { color: colorTexto }]}>
              {esUrgenciaEnviada
                ? "Quédate donde estás. Ya viene."
                : "Espera un momento, por favor."}
            </Texto>
          )}
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
  simboloPictograma: { fontSize: 48, textAlign: "center" },
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
  flujoVisualConfirmacion: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  cajaFiguraConfirmacion: {
    minWidth: 220,
    minHeight: 200,
    padding: 18,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  pieFiguraConfirmacion: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  filaIcono: { flexDirection: "row", alignItems: "center", gap: 8 },
  mensajeTranquilizador: { fontSize: 28, fontWeight: "700", textAlign: "center" },
});
