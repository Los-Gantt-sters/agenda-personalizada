import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
} from "react-native";
import { ModalNecesidadesProps } from "./tipos";
import { OPCIONES_NECESIDADES_BASICAS, obtenerInfoNecesidad } from "./opcionesNecesidades";
import { ratioContraste } from "../temas";
import { PictogramaTarea } from "../componentes/agenda/PictogramaTarea";
import { Icono, PictogramaInterfaz, Texto, useApariencia } from "../ui";

/** Blanco o negro, el que más contraste dé sobre `fondo`. */
const textoSobre = (fondo: string) =>
  ratioContraste("#FFFFFF", fondo) >= ratioContraste("#000000", fondo) ? "#FFFFFF" : "#000000";

export const ModalNecesidades: React.FC<ModalNecesidadesProps> = ({
  visible,
  alSeleccionarNecesidad,
  alCerrar,
  necesidadEnviada = null,
  alConfirmarAvisoEnviado,
  nombreTutora = "Carmen",
  canal = "ambos",
  mostrarImagenArasaac = true,
}) => {
  // Los colores salen del tema activo (claro, oscuro, pastel o alto contraste), así que la ventana
  // sigue el tema del perfil sin necesitar la `variante` que se usaba antes.
  const { colores } = useApariencia();

  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";

  const colorFondoHoja = colores.superficie;
  const colorBordeHoja = colores.borde;
  const colorTexto = colores.texto;
  const colorFondoTarjeta = colores.fondo;
  const colorBordeTarjeta = colores.primario;
  const colorUrgencia = colores.peligro;
  const colorTextoUrgencia = textoSobre(colorUrgencia);

  const manejarCerrarConfirmacion = () => {
    if (alConfirmarAvisoEnviado) {
      alConfirmarAvisoEnviado();
    } else {
      alCerrar();
    }
  };

  const infoEnviada = necesidadEnviada ? obtenerInfoNecesidad(necesidadEnviada) : null;
  const esUrgenciaEnviada = necesidadEnviada === "urgencia";

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={alCerrar}
      testID="modal-necesidades"
    >
      <View style={estilos.overlay}>
        <View
          style={[
            estilos.hojaModal,
            {
              backgroundColor: colorFondoHoja,
              borderColor: colorBordeHoja,
            },
          ]}
          accessibilityRole="none"
          accessibilityLabel={
            necesidadEnviada ? "Confirmación de aviso enviado a tu tutora" : "¿Qué necesitas?"
          }
        >
          {!necesidadEnviada ? (
            <ScrollView
              contentContainerStyle={estilos.contenidoScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Cabecera del modal (ahead en tuagendita-prototipos.html) */}
              <View style={estilos.cabecera}>
                {verTexto ? (
                  <Texto style={[estilos.tituloModal, { color: colorTexto }]}>
                    ¿Qué necesitas?
                  </Texto>
                ) : (
                  <View
                    accessible
                    accessibilityLabel="¿Qué necesitas?"
                    testID="titulo-modal-solo-picto"
                  >
                    <PictogramaInterfaz nombre="ayuda" etiqueta="¿Qué necesitas?" tam={72} />
                  </View>
                )}
              </View>

              {/* Cuadrícula de 3 opciones gigantes ARASAAC: Baño, Agua, Descanso (needgrid) */}
              <View style={estilos.cuadriculaOpciones} testID="cuadricula-opciones-necesidades">
                {OPCIONES_NECESIDADES_BASICAS.map((opcion) => (
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
                      {
                        backgroundColor: colorFondoTarjeta,
                        borderColor: colorBordeTarjeta,
                      },
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
                          canal === "soloTexto" && { fontSize: 24, lineHeight: 30 },
                        ]}
                      >
                        {opcion.etiqueta}
                      </Texto>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Botón de Urgencia de 1 toque (RF11.4 / prototipo) */}
              <TouchableOpacity
                testID="opcion-necesidad-urgencia"
                accessibilityRole="button"
                accessibilityLabel="Urgencia. Necesito ayuda ya"
                activeOpacity={0.8}
                onPress={() => alSeleccionarNecesidad("urgencia")}
                style={[
                  estilos.botonUrgencia,
                  {
                    backgroundColor: colorUrgencia,
                    borderColor: colorUrgencia,
                  },
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

              {/* Botón de cerrar modal */}
              <TouchableOpacity
                testID="btn-cerrar-modal-necesidades"
                accessibilityRole="button"
                accessibilityLabel="Cerrar ventana de necesidades"
                onPress={alCerrar}
                style={[
                  estilos.botonCerrar,
                  {
                    borderColor: colorBordeHoja,
                    backgroundColor: colorFondoTarjeta,
                  },
                ]}
              >
                {canal !== "soloTexto" && (
                  <Icono nombre="cerrar" color={colorTexto} tam={26} grosor={3} />
                )}
                {canal !== "soloPictograma" && (
                  <Texto style={[estilos.textoCerrar, { color: colorTexto }]}>Cerrar</Texto>
                )}
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* Vista de confirmación visual inmediata tras pulsar una opción (E.ovl.sent en prototipo) */
            <View style={estilos.vistaConfirmacion} testID="confirmacion-necesidad-enviada">
              <View style={estilos.flujoVisualConfirmacion}>
                <View
                  style={[
                    estilos.cajaFiguraConfirmacion,
                    {
                      backgroundColor: colorFondoTarjeta,
                      borderColor: colorBordeHoja,
                    },
                  ]}
                >
                  {verDibujo && infoEnviada && !esUrgenciaEnviada && (
                    <PictogramaTarea
                      tarea={{
                        titulo: infoEnviada.etiqueta,
                        emoji: infoEnviada.simbolo,
                        pictograma_url: mostrarImagenArasaac ? infoEnviada.urlPictograma : null,
                      }}
                      tam={88}
                    />
                  )}
                  {verDibujo && esUrgenciaEnviada && (
                    <Icono nombre="alerta" color={colores.peligro} tam={72} grosor={2.6} />
                  )}
                  {verTexto && (
                    <Texto style={[estilos.pieFiguraConfirmacion, { color: colorTexto }]}>
                      {infoEnviada?.etiqueta}
                    </Texto>
                  )}
                </View>

                <Icono nombre="adelante" color={colorTexto} tam={40} grosor={3} />

                <View
                  style={[
                    estilos.cajaFiguraConfirmacion,
                    {
                      backgroundColor: colorFondoTarjeta,
                      borderColor: colorBordeTarjeta,
                    },
                  ]}
                >
                  {verDibujo && (
                    <PictogramaInterfaz nombre="profesora" etiqueta={nombreTutora} tam={88} />
                  )}
                  {verTexto && (
                    <View style={estilos.filaIcono}>
                      <Icono nombre="check" color={colores.exito} tam={22} grosor={3} />
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

              <TouchableOpacity
                testID="btn-vale-confirmacion"
                accessibilityRole="button"
                accessibilityLabel="Vale, entendido"
                onPress={manejarCerrarConfirmacion}
                style={[estilos.botonVale, { backgroundColor: colores.primario }]}
              >
                {canal !== "soloTexto" && (
                  <Icono nombre="check" color={colores.textoSobrePrimario} tam={28} grosor={3.2} />
                )}
                {canal !== "soloPictograma" && (
                  <Texto style={[estilos.textoBotonVale, { color: colores.textoSobrePrimario }]}>
                    Vale
                  </Texto>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(34, 33, 31, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  hojaModal: {
    width: "100%",
    maxWidth: 740,
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
  },
  contenidoScroll: {
    alignItems: "center",
    gap: 18,
  },
  cabecera: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  tituloModal: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  cuadriculaOpciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    width: "100%",
  },
  botonOpcionGigante: {
    // Opciones gigantes táctiles (>= 160x180 px, muy superior al mínimo de 64px / 120px)
    flex: 1,
    minWidth: 180,
    minHeight: 190,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
      },
    }),
  },
  contenedorPictograma: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    // Placa blanca: los trazos de ARASAAC se ven también en los temas oscuros
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  contenedorPictogramaGigante: {
    width: 128,
    height: 128,
  },
  imagenPictograma: {
    width: 96,
    height: 96,
    resizeMode: "contain",
  },
  imagenPictogramaGigante: {
    width: 120,
    height: 120,
  },
  simboloPictograma: {
    fontSize: 44,
    textAlign: "center",
  },
  etiquetaOpcion: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
  },
  botonUrgencia: {
    width: "100%",
    minHeight: 84, // En el prototipo min-height: 96px / >= 64px
    borderRadius: 14,
    borderWidth: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  textoUrgencia: {
    fontSize: 22,
    fontWeight: "700",
  },
  botonCerrar: {
    minHeight: 56,
    minWidth: 160,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textoCerrar: {
    fontSize: 18,
    fontWeight: "700",
  },
  vistaConfirmacion: {
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
    paddingVertical: 12,
  },
  flujoVisualConfirmacion: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  cajaFiguraConfirmacion: {
    minWidth: 150,
    minHeight: 150,
    padding: 16,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pieFiguraConfirmacion: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  filaIcono: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mensajeTranquilizador: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  botonVale: {
    minHeight: 60,
    minWidth: 180,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonVale: {
    fontSize: 20,
    fontWeight: "700",
  },
});
