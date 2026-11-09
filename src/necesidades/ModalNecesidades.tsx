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

export const ModalNecesidades: React.FC<ModalNecesidadesProps> = ({
  visible,
  alSeleccionarNecesidad,
  alCerrar,
  necesidadEnviada = null,
  alConfirmarAvisoEnviado,
  nombreTutora = "Carmen",
  variante = "estandar",
  canal = "ambos",
  mostrarImagenArasaac = true,
}) => {
  const esAltoContraste = variante === "alto-contraste";
  const esPastel = variante === "pastel";

  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";

  // Colores dinámicos según tema (claro / pastel / alto contraste)
  const colorFondoHoja = esAltoContraste ? "#0B0B0B" : esPastel ? "#FBFFFD" : "#FFFFFF";
  const colorBordeHoja = esAltoContraste ? "#FFFFFF" : esPastel ? "#B9D9CF" : "#C6D1E2";
  const colorTexto = esAltoContraste ? "#FFFFFF" : esPastel ? "#1D3832" : "#14213D";
  const colorFondoTarjeta = esAltoContraste ? "#1B1900" : esPastel ? "#EAF5F1" : "#F4F7FB";
  const colorBordeTarjeta = esAltoContraste ? "#FFD400" : esPastel ? "#2C7363" : "#1F5FA8";
  const colorUrgencia = esAltoContraste ? "#FF5A5A" : esPastel ? "#B8433A" : "#C0392B";
  const colorTextoUrgencia = esAltoContraste ? "#000000" : "#FFFFFF";

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
                  <Text style={[estilos.tituloModal, { color: colorTexto }]}>¿Qué necesitas?</Text>
                ) : (
                  <Text
                    style={estilos.tituloModalPictograma}
                    accessibilityLabel="¿Qué necesitas?"
                    testID="titulo-modal-solo-picto"
                  >
                    ✋ ❓
                  </Text>
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
                        {mostrarImagenArasaac && (
                          <Image
                            source={{ uri: opcion.urlPictograma }}
                            style={[
                              estilos.imagenPictograma,
                              canal === "soloPictograma" && estilos.imagenPictogramaGigante,
                            ]}
                            accessibilityLabel={opcion.descripcionAlternativa}
                            testID={`img-arasaac-${opcion.arasaacId}`}
                          />
                        )}
                        <Text
                          style={[
                            estilos.simboloPictograma,
                            canal === "soloPictograma" && { fontSize: 56 },
                          ]}
                        >
                          {opcion.simbolo}
                        </Text>
                      </View>
                    )}

                    {verTexto && (
                      <Text
                        style={[
                          estilos.etiquetaOpcion,
                          { color: colorTexto },
                          canal === "soloTexto" && { fontSize: 24, lineHeight: 30 },
                        ]}
                      >
                        {opcion.etiqueta}
                      </Text>
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
                    borderColor: esAltoContraste ? "#FFFFFF" : colorUrgencia,
                  },
                ]}
              >
                {verDibujo && (
                  <Text
                    style={[estilos.iconoUrgencia, canal === "soloPictograma" && { fontSize: 44 }]}
                  >
                    🆘
                  </Text>
                )}
                {verTexto && (
                  <Text
                    style={[
                      estilos.textoUrgencia,
                      { color: colorTextoUrgencia },
                      canal === "soloTexto" && { fontSize: 26 },
                    ]}
                  >
                    Urgencia
                  </Text>
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
                <Text style={[estilos.textoCerrar, { color: colorTexto }]}>
                  {canal === "soloPictograma" ? "✗" : canal === "soloTexto" ? "Cerrar" : "✗ Cerrar"}
                </Text>
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
                  {verDibujo && (
                    <Text style={estilos.simboloGrandeConfirmacion}>{infoEnviada?.simbolo}</Text>
                  )}
                  {verTexto && (
                    <Text style={[estilos.pieFiguraConfirmacion, { color: colorTexto }]}>
                      {infoEnviada?.etiqueta}
                    </Text>
                  )}
                </View>

                <Text style={[estilos.flechaFlujo, { color: colorTexto }]}>➜</Text>

                <View
                  style={[
                    estilos.cajaFiguraConfirmacion,
                    {
                      backgroundColor: colorFondoTarjeta,
                      borderColor: colorBordeTarjeta,
                    },
                  ]}
                >
                  {verDibujo && <Text style={estilos.simboloGrandeConfirmacion}>👩‍🏫</Text>}
                  {verTexto && (
                    <Text style={[estilos.pieFiguraConfirmacion, { color: colorTexto }]}>
                      ✓{" "}
                      {esUrgenciaEnviada
                        ? `${nombreTutora} viene ahora`
                        : `${nombreTutora} ya lo sabe`}
                    </Text>
                  )}
                </View>
              </View>

              {verTexto && (
                <Text style={[estilos.mensajeTranquilizador, { color: colorTexto }]}>
                  {esUrgenciaEnviada
                    ? "Quédate donde estás. Ya viene."
                    : "Espera un momento, por favor."}
                </Text>
              )}

              <TouchableOpacity
                testID="btn-vale-confirmacion"
                accessibilityRole="button"
                accessibilityLabel="Vale, entendido"
                onPress={manejarCerrarConfirmacion}
                style={[
                  estilos.botonVale,
                  {
                    backgroundColor: esAltoContraste ? "#FFD400" : "#1F5FA8",
                  },
                ]}
              >
                <Text
                  style={[
                    estilos.textoBotonVale,
                    { color: esAltoContraste ? "#000000" : "#FFFFFF" },
                  ]}
                >
                  {canal === "soloPictograma" ? "👍" : canal === "soloTexto" ? "Vale" : "👍 Vale"}
                </Text>
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
    backgroundColor: "rgba(20, 33, 61, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  hojaModal: {
    width: "100%",
    maxWidth: 740,
    borderRadius: 24,
    borderWidth: 4,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: "0 20px 30px rgba(0, 0, 0, 0.3)",
      },
      default: {
        elevation: 10,
      },
    }),
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
    fontWeight: "800",
    textAlign: "center",
  },
  tituloModalPictograma: {
    fontSize: 44,
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
    borderRadius: 20,
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
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 24,
  },
  botonUrgencia: {
    width: "100%",
    minHeight: 84, // En el prototipo min-height: 96px / >= 64px
    borderRadius: 18,
    borderWidth: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  iconoUrgencia: {
    fontSize: 34,
  },
  textoUrgencia: {
    fontSize: 22,
    fontWeight: "800",
  },
  botonCerrar: {
    minHeight: 56,
    minWidth: 160,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 3,
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
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  simboloGrandeConfirmacion: {
    fontSize: 64,
  },
  pieFiguraConfirmacion: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  flechaFlujo: {
    fontSize: 36,
    fontWeight: "800",
  },
  mensajeTranquilizador: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  botonVale: {
    minHeight: 60,
    minWidth: 180,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonVale: {
    fontSize: 20,
    fontWeight: "800",
  },
});
