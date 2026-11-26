// Pantalla de configuración del modo de barrido por pulsadores (SCRUM-120 · T-05.1, HU-05).
// Reproduce exactamente la estructura y estética de BOCETOS_NUEVOS/definitiva_v2/pantallas/22.html
// y 24.html: tarjetas .card, opciones .opt / .opt.on con insignia circular .chk, stepper con
// botones + y − (52x52 px) y columna derecha «Así se ve» (390 px) con vista previa en vivo.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import { Icono } from "../../ui/Icono";
import { ElementoBarrido } from "./ElementoBarrido";
import { useMotorBarrido } from "./MotorBarridoProvider";
import {
  ETIQUETAS_MODO_BARRIDO,
  VELOCIDADES_BARRIDO_MS,
  type ModoBarridoPulsador,
} from "./tiposBarrido";

export interface PantallaConfiguracionBarridoProps {
  nombreTutor?: string;
  inicialesTutor?: string;
  alVolver?: () => void;
  alGuardar?: () => void;
  alSalir?: () => void;
}

const ORDEN_MODOS: ModoBarridoPulsador[] = ["desactivado", "automatico", "manual"];

export function PantallaConfiguracionBarrido({
  nombreTutor = "Carmen Ruiz",
  inicialesTutor = "CR",
  alVolver,
  alGuardar,
  alSalir,
}: PantallaConfiguracionBarridoProps): React.JSX.Element {
  const {
    configuracion,
    cambiarModo,
    ajustarVelocidadStepper,
    objetivoEnfocado,
    avanzarFoco,
    accionarPulsadorUnico,
  } = useMotorBarrido();

  const segundosTexto = `${(configuracion.intervaloMs / 1000).toFixed(1).replace(".", ",")} segundos`;
  const idxVelocidad = VELOCIDADES_BARRIDO_MS.indexOf(configuracion.intervaloMs);
  const enMinimo = idxVelocidad <= 0;
  const enMaximo = idxVelocidad >= VELOCIDADES_BARRIDO_MS.length - 1;

  return (
    <MarcoPantalla
      testID="pantalla-configuracion-barrido"
      titulo="Barrido por pulsadores (movilidad reducida)"
      simbolo={
        <View style={estilos.cajaIconoTitulo}>
          <Icono nombre="accesibilidad" tam={24} color="#7A1F4D" />
        </View>
      }
      derecha={
        <View style={estilos.cabeceraDerecha}>
          <View style={estilos.pildoraUsuario}>
            <View style={estilos.avatarUsuario}>
              <Text style={estilos.textoAvatar}>{inicialesTutor}</Text>
            </View>
            <Text style={estilos.nombreUsuario}>{nombreTutor}</Text>
          </View>
          {alSalir ? (
            <Pressable
              testID="btn-salir-barrido"
              accessibilityRole="button"
              accessibilityLabel="Salir"
              onPress={alSalir}
              style={estilos.botonSalir}
            >
              <Text style={estilos.textoBotonSalir}>Salir</Text>
            </Pressable>
          ) : null}
        </View>
      }
      atras={alVolver ?? null}
      etiquetaAtras="Atrás"
      adelante={alGuardar ?? alVolver ?? null}
      textoAdelante="Guardar"
      etiquetaAdelante="Guardar configuración de barrido"
    >
      <View style={estilos.cuerpo}>
        <View style={estilos.filaPrincipal}>
          {/* Columna izquierda: categorías de configuración idénticas a 22.html y 24.html */}
          <View style={estilos.columnaIzquierda}>
            <Text style={estilos.subtituloSeccion}>
              Configura el barrido visual con foco grueso y la velocidad para 1 o 2 pulsadores.
            </Text>

            {/* Tarjeta 1: Modo de interacción por pulsador */}
            <View style={estilos.tarjetaCategoria}>
              <View style={estilos.cabeceraCategoria}>
                <Text style={estilos.tituloCategoria}>Modo de interacción por pulsador</Text>
                <Text style={estilos.subtituloCategoria}>Accesibilidad motora (RNF3.4)</Text>
              </View>
              <View
                style={estilos.filaOpciones}
                accessibilityRole="radiogroup"
                accessibilityLabel="Modo de interacción por pulsador"
              >
                {ORDEN_MODOS.map((modo) => {
                  const activo = configuracion.modo === modo;
                  return (
                    <Pressable
                      key={modo}
                      testID={`opcion-modo-barrido-${modo}`}
                      accessibilityRole="radio"
                      accessibilityLabel={ETIQUETAS_MODO_BARRIDO[modo].titulo}
                      accessibilityState={{ checked: activo, selected: activo }}
                      onPress={() => cambiarModo(modo)}
                      style={[estilos.opcion, activo && estilos.opcionActiva]}
                    >
                      {activo ? (
                        <View style={estilos.circuloCheck}>
                          <Text style={estilos.iconoCheck}>✓</Text>
                        </View>
                      ) : null}
                      <Text style={estilos.textoOpcion}>{ETIQUETAS_MODO_BARRIDO[modo].titulo}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Tarjeta 2: Velocidad de barrido con stepper + y − idéntico a 24.html */}
            <View style={estilos.tarjetaCategoria}>
              <View style={estilos.cabeceraCategoria}>
                <Text style={estilos.tituloCategoria}>Velocidad del barrido automático</Text>
                <Text style={estilos.subtituloCategoria}>
                  Tiempo en cada elemento (botones + y −)
                </Text>
              </View>
              <View style={estilos.filaStepper}>
                <Pressable
                  testID="btn-velocidad-dec"
                  accessibilityRole="button"
                  accessibilityLabel="Disminuir tiempo de barrido"
                  accessibilityState={{ disabled: enMinimo }}
                  disabled={enMinimo}
                  onPress={() => ajustarVelocidadStepper("dec")}
                  style={[estilos.botonStepperNeutro, enMinimo && estilos.botonApagado]}
                >
                  <Text style={estilos.textoStepperNeutro}>−</Text>
                </Pressable>

                <View testID="valor-velocidad-barrido" style={estilos.campoValorStepper}>
                  <Text style={estilos.textoValorStepper}>{segundosTexto}</Text>
                </View>

                <Pressable
                  testID="btn-velocidad-inc"
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar tiempo de barrido"
                  accessibilityState={{ disabled: enMaximo }}
                  disabled={enMaximo}
                  onPress={() => ajustarVelocidadStepper("inc")}
                  style={[estilos.botonStepperPrimario, enMaximo && estilos.botonApagado]}
                >
                  <Text style={estilos.textoStepperPrimario}>+</Text>
                </Pressable>

                <Text style={estilos.ayudaStepper}>
                  Ajustar de 1,2 s a 3,2 s con + y − (por defecto: 1,6 s)
                </Text>
              </View>
            </View>
          </View>

          {/* Columna derecha (390 px): «Así se ve» idéntica a 17.html / 22.html / 24.html */}
          <View style={estilos.columnaDerecha}>
            <Text style={estilos.tituloPrevia}>Así se ve</Text>
            <View style={estilos.tarjetaPrevia} testID="vista-previa-barrido">
              <ElementoBarrido
                id="preview-tarjeta-ahora"
                etiqueta="Ahora: Lavarse las manos"
                orden={1}
                alActivar={() => undefined}
              >
                <View style={estilos.cajaTareaAhora}>
                  <View style={estilos.iconoPictoPrevia}>
                    <Text style={estilos.emojiPictoPrevia}>🧼</Text>
                  </View>
                  <View style={estilos.textosTareaAhora}>
                    <Text style={estilos.etiquetaAhora}>Ahora</Text>
                    <Text style={estilos.tituloTareaAhora}>Lavarse las manos</Text>
                    <Text style={estilos.subtituloTareaAhora}>Usa agua y jabón.</Text>
                  </View>
                </View>
              </ElementoBarrido>

              <View style={estilos.filaBotonesPrevia}>
                <ElementoBarrido
                  id="preview-btn-empezar"
                  etiqueta="Empezar tarea"
                  orden={2}
                  alActivar={() => undefined}
                >
                  <View style={estilos.botonEmpezarPrevia}>
                    <Text style={estilos.textoBotonEmpezarPrevia}>Empezar</Text>
                  </View>
                </ElementoBarrido>

                <ElementoBarrido
                  id="preview-btn-pasos"
                  etiqueta="Mostrar pasos"
                  orden={3}
                  alActivar={() => undefined}
                >
                  <View style={estilos.botonSecundarioPrevia}>
                    <Text style={estilos.textoBotonSecundarioPrevia}>Mostrar pasos</Text>
                  </View>
                </ElementoBarrido>
              </View>

              <View style={estilos.ControlesPruebaPrevia}>
                <Text testID="preview-foco-actual" style={estilos.textoEstadoPrevia}>
                  {configuracion.modo === "desactivado"
                    ? "Modo táctil: sin foco de barrido"
                    : `Foco grueso en: ${objetivoEnfocado?.etiqueta ?? "Ahora: Lavarse las manos"}`}
                </Text>
                {configuracion.modo !== "desactivado" ? (
                  <View style={estilos.filaBotonesPrueba}>
                    <Pressable
                      testID="btn-preview-avanzar-foco"
                      accessibilityRole="button"
                      accessibilityLabel="Avanzar foco en vista previa"
                      onPress={avanzarFoco}
                      style={estilos.botonMiniPrueba}
                    >
                      <Text style={estilos.textoMiniPrueba}>⇥ Pasar foco</Text>
                    </Pressable>
                    <Pressable
                      testID="btn-preview-elegir-foco"
                      accessibilityRole="button"
                      accessibilityLabel="Elegir con pulsador en vista previa"
                      onPress={() => accionarPulsadorUnico("pulsador_unico")}
                      style={estilos.botonMiniPruebaPrimario}
                    >
                      <Text style={estilos.textoMiniPruebaPrimario}>🔘 Pulsador</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </View>
    </MarcoPantalla>
  );
}

const estilos = StyleSheet.create({
  cajaIconoTitulo: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#F5E9EF",
    alignItems: "center",
    justifyContent: "center",
  },
  cabeceraDerecha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pildoraUsuario: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingLeft: 5,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: "#C9CED6",
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
  },
  avatarUsuario: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5E9EF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoAvatar: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  nombreUsuario: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2328",
  },
  botonSalir: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C9CED6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonSalir: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2328",
  },
  cuerpo: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: "center",
  },
  filaPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },
  columnaIzquierda: {
    flex: 1,
    minWidth: 380,
    gap: 12,
  },
  subtituloSeccion: {
    fontSize: 15,
    color: "#555C69",
  },
  tarjetaCategoria: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#C9CED6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  cabeceraCategoria: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#C9CED6",
    paddingBottom: 6,
  },
  tituloCategoria: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2328",
  },
  subtituloCategoria: {
    fontSize: 12.5,
    color: "#555C69",
  },
  filaOpciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  opcion: {
    flex: 1,
    minWidth: 140,
    minHeight: 66,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C9CED6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  opcionActiva: {
    borderWidth: 3,
    borderColor: "#7A1F4D",
    backgroundColor: "#F5E9EF",
  },
  circuloCheck: {
    position: "absolute",
    right: -9,
    top: -9,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7A1F4D",
    alignItems: "center",
    justifyContent: "center",
  },
  iconoCheck: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  textoOpcion: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#1F2328",
    textAlign: "center",
  },
  filaStepper: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
  },
  botonStepperNeutro: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C9CED6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoStepperNeutro: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2328",
  },
  campoValorStepper: {
    width: 190,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#F5E9EF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoValorStepper: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2328",
  },
  botonStepperPrimario: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#7A1F4D",
    alignItems: "center",
    justifyContent: "center",
  },
  textoStepperPrimario: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  botonApagado: {
    opacity: 0.45,
  },
  ayudaStepper: {
    flex: 1,
    minWidth: 160,
    fontSize: 13.5,
    color: "#555C69",
  },
  columnaDerecha: {
    width: 390,
    gap: 10,
  },
  tituloPrevia: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2328",
  },
  tarjetaPrevia: {
    width: 390,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#C9CED6",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cajaTareaAhora: {
    borderWidth: 3,
    borderColor: "#7A1F4D",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
  },
  iconoPictoPrevia: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C9CED6",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPictoPrevia: {
    fontSize: 40,
  },
  textosTareaAhora: {
    flex: 1,
    gap: 2,
  },
  etiquetaAhora: {
    color: "#7A1F4D",
    fontWeight: "700",
    fontSize: 14,
  },
  tituloTareaAhora: {
    fontWeight: "700",
    fontSize: 21,
    color: "#1F2328",
  },
  subtituloTareaAhora: {
    fontSize: 15,
    color: "#555C69",
  },
  filaBotonesPrevia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botonEmpezarPrevia: {
    backgroundColor: "#7A1F4D",
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonEmpezarPrevia: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },
  botonSecundarioPrevia: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#7A1F4D",
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonSecundarioPrevia: {
    color: "#7A1F4D",
    fontSize: 16,
    fontWeight: "700",
  },
  ControlesPruebaPrevia: {
    borderTopWidth: 1,
    borderTopColor: "#C9CED6",
    paddingTop: 10,
    gap: 8,
  },
  textoEstadoPrevia: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#555C69",
  },
  filaBotonesPrueba: {
    flexDirection: "row",
    gap: 8,
  },
  botonMiniPrueba: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C9CED6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoMiniPrueba: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2328",
  },
  botonMiniPruebaPrimario: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#7A1F4D",
    alignItems: "center",
    justifyContent: "center",
  },
  textoMiniPruebaPrimario: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
