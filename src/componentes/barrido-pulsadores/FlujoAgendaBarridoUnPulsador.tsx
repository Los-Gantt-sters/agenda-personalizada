// Flujo completo de Agenda (06), Ejecución de Tarea (07), Comedor por Aulas (11) y Confirmación (09)
// 100% operable con 1 único pulsador mediante barrido automático o manual (SCRUM-122 · T-05.3, HU-05).
// Reproduce fielmente los bocetos de BOCETOS_NUEVOS/definitiva_v2/pantallas/06.html, 07.html y 11.html.
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormaClase } from "../../ui/FormaClase";
import { BarraEstadoBarrido } from "./BarraEstadoBarrido";
import { CapturadorPulsadorExterno } from "./CapturadorPulsadorExterno";
import { ElementoBarrido } from "./ElementoBarrido";
import { PantallaConfiguracionBarrido } from "./PantallaConfiguracionBarrido";

export type TipoTareaBarrido = "manos" | "comedor";

export type PantallaActivaBarrido = "agenda06" | "ejecucion07_11" | "completada09" | "preferencias";

interface PasoDemoBarrido {
  numero: number;
  instruccion: string;
  emoji: string;
  aulaId?: string;
  simboloAula?: "▲" | "●" | "■";
}

const PASOS_LAVARSE_MANOS: PasoDemoBarrido[] = [
  { numero: 1, instruccion: "Abre el grifo", emoji: "🚰" },
  { numero: 2, instruccion: "Frota con agua y jabón", emoji: "🧼" },
  { numero: 3, instruccion: "Aclara y seca las manos", emoji: "👐" },
];

const PASOS_COMEDOR_AULAS: PasoDemoBarrido[] = [
  {
    numero: 1,
    instruccion: "Clase Triángulo · Entrega 4 comensales",
    emoji: "🍽️",
    aulaId: "tri",
    simboloAula: "▲",
  },
  {
    numero: 2,
    instruccion: "Clase Círculo · Entrega 5 comensales",
    emoji: "🍽️",
    aulaId: "cir",
    simboloAula: "●",
  },
  {
    numero: 3,
    instruccion: "Clase Cuadrado · Enviar parte a cocina",
    emoji: "📤",
    aulaId: "cua",
    simboloAula: "■",
  },
];

export interface FlujoAgendaBarridoUnPulsadorProps {
  tareaInicial?: TipoTareaBarrido;
  nombreAlumno?: string;
  alCompletarTarea?: (tipo: TipoTareaBarrido, emocion?: string) => void;
}

export function FlujoAgendaBarridoUnPulsador({
  tareaInicial = "manos",
  nombreAlumno = "Alejandro",
  alCompletarTarea,
}: FlujoAgendaBarridoUnPulsadorProps): React.JSX.Element {
  const [pantalla, setPantalla] = useState<PantallaActivaBarrido>("agenda06");
  const [tipoTarea, setTipoTarea] = useState<TipoTareaBarrido>(tareaInicial);
  const [pasoIdx, setPasoIdx] = useState<number>(0);
  const [formatoMultimedia, setFormatoMultimedia] = useState<
    "pictograma" | "texto" | "foto" | "video"
  >("pictograma");
  const [reproduciendoAudio, setReproduciendoAudio] = useState<boolean>(false);
  const [tareasCompletadas, setTareasCompletadas] = useState<TipoTareaBarrido[]>([]);

  const pasosActivos = tipoTarea === "comedor" ? PASOS_COMEDOR_AULAS : PASOS_LAVARSE_MANOS;
  const pasoActual = pasosActivos[pasoIdx] ?? pasosActivos[0];
  const tituloTareaActiva =
    tipoTarea === "comedor" ? "Comedor · Recuento por aulas" : "Lavarse las manos";

  if (pantalla === "preferencias") {
    return (
      <PantallaConfiguracionBarrido
        alVolver={() => setPantalla("agenda06")}
        alGuardar={() => setPantalla("agenda06")}
      />
    );
  }

  // ---- Pantalla 09: Felicitación y feedback emocional operable con 1 pulsador ----
  if (pantalla === "completada09") {
    const finalizarYVolver = (emocion: string) => {
      setTareasCompletadas((prev) => (prev.includes(tipoTarea) ? prev : [...prev, tipoTarea]));
      alCompletarTarea?.(tipoTarea, emocion);
      setPasoIdx(0);
      setPantalla("agenda06");
    };

    return (
      <View testID="pantalla-barrido-completada-09" style={estilos.lienzo}>
        <View style={estilos.cabecera}>
          <Text style={estilos.tituloCabecera}>¡Tarea terminada!</Text>
          <View style={estilos.espaciador} />
          <View style={estilos.pildoraUsuario}>
            <View style={estilos.avatarAlumno}>
              <Text>🦁</Text>
            </View>
            <Text style={estilos.nombreAlumno}>{nombreAlumno}</Text>
          </View>
        </View>

        <View style={estilos.cuerpo}>
          <BarraEstadoBarrido />
          <CapturadorPulsadorExterno mostrarPanelDisparo={false} />

          <View style={estilos.tarjetaCompletada}>
            <Text style={estilos.emojiCelebracion}>🎉</Text>
            <Text testID="titulo-tarea-completada" style={estilos.tituloCelebracion}>
              ¡Muy bien, {nombreAlumno}! Has terminado: {tituloTareaActiva}
            </Text>
            <Text style={estilos.subtituloCelebracion}>¿Cómo te has sentido en esta tarea?</Text>

            <View style={estilos.filaEmociones}>
              <ElementoBarrido
                id="emocion-contento"
                etiqueta="Contento · Volver a mi agenda"
                orden={1}
                alActivar={() => finalizarYVolver("contento")}
              >
                <View style={estilos.botonEmocion}>
                  <Text style={estilos.emojiEmocion}>😀</Text>
                  <Text style={estilos.textoEmocion}>Contento</Text>
                </View>
              </ElementoBarrido>

              <ElementoBarrido
                id="emocion-tranquilo"
                etiqueta="Tranquilo · Volver a mi agenda"
                orden={2}
                alActivar={() => finalizarYVolver("tranquilo")}
              >
                <View style={estilos.botonEmocion}>
                  <Text style={estilos.emojiEmocion}>😐</Text>
                  <Text style={estilos.textoEmocion}>Tranquilo</Text>
                </View>
              </ElementoBarrido>

              <ElementoBarrido
                id="emocion-agobiado"
                etiqueta="Agobiado · Volver a mi agenda"
                orden={3}
                alActivar={() => finalizarYVolver("agobiado")}
              >
                <View style={estilos.botonEmocion}>
                  <Text style={estilos.emojiEmocion}>😟</Text>
                  <Text style={estilos.textoEmocion}>Agobiado</Text>
                </View>
              </ElementoBarrido>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ---- Pantalla 07 / 11: Ejecución paso a paso (07.html y 11.html) ----
  if (pantalla === "ejecucion07_11") {
    const esUltimoPaso = pasoIdx >= pasosActivos.length - 1;
    const avanzarPasoOTerminar = () => {
      if (esUltimoPaso) {
        setPantalla("completada09");
      } else {
        setPasoIdx((actual) => actual + 1);
      }
    };
    const retrocederPasoOSalir = () => {
      if (pasoIdx <= 0) {
        setPantalla("agenda06");
      } else {
        setPasoIdx((actual) => actual - 1);
      }
    };

    return (
      <View
        testID={
          tipoTarea === "comedor" ? "pantalla-barrido-comedor-11" : "pantalla-barrido-tarea-07"
        }
        style={estilos.lienzo}
      >
        {/* Cabecera .top idéntica a 07.html / 11.html */}
        <View style={estilos.cabecera}>
          <Text style={estilos.tituloCabecera}>{tituloTareaActiva}</Text>
          <View style={estilos.espaciador} />
          <View style={estilos.pildoraUsuario}>
            <View style={estilos.avatarAlumno}>
              <Text>🦁</Text>
            </View>
            <Text style={estilos.nombreAlumno}>{nombreAlumno}</Text>
          </View>
        </View>

        <View style={estilos.cuerpo}>
          <BarraEstadoBarrido />
          <CapturadorPulsadorExterno mostrarPanelDisparo={false} />

          <View style={estilos.contenedorStepper}>
            {/* Fila superior: Píldora "Paso X de N" + tarjeta de reloj visual */}
            <View style={estilos.filaSuperiorPaso}>
              <View style={estilos.pildoraPaso}>
                <Text testID="badge-paso-actual" style={estilos.textoPildoraPaso}>
                  Paso {pasoActual.numero} de {pasosActivos.length}
                </Text>
              </View>
              <View style={estilos.tarjetaRelojMini}>
                <Text style={estilos.iconoRelojMini}>⏱️</Text>
                <View>
                  <Text style={estilos.textoQuedanMinutos}>Quedan 45 minutos</Text>
                  <Text style={estilos.textoEmpezasteHora}>Empezaste a las 9:30</Text>
                </View>
              </View>
            </View>

            {/* Tarjeta central de 680x260 con borde granate 3px idéntica a 07.html y 11.html */}
            <View style={estilos.tarjetaPasoCentral}>
              {tipoTarea === "comedor" && pasoActual.aulaId && pasoActual.simboloAula ? (
                <View style={estilos.filaIconosComedor11}>
                  <View style={estilos.cajaPictoComedor}>
                    <Text style={estilos.emojiGigante}>{pasoActual.emoji}</Text>
                  </View>
                  <Text style={estilos.flechaComedor}>➜</Text>
                  <View style={estilos.cajaFormaComedor} testID="forma-aula-comedor">
                    <FormaClase
                      claseId={pasoActual.aulaId}
                      simbolo={pasoActual.simboloAula}
                      tam={64}
                    />
                  </View>
                </View>
              ) : (
                <Text style={estilos.emojiGigante}>{pasoActual.emoji}</Text>
              )}

              <Text testID="instruccion-paso-actual" style={estilos.instruccionPaso}>
                {pasoActual.instruccion}
              </Text>
            </View>

            {/* Fila de 5 botones multimedia debajo de la imagen (07.html y 11.html) */}
            <View style={estilos.filaMultimedia}>
              <ElementoBarrido
                id="btn-paso-siguiente"
                etiqueta={esUltimoPaso ? "Terminar tarea" : "Siguiente paso"}
                orden={1}
                alActivar={avanzarPasoOTerminar}
              >
                <View style={estilos.botonBarraPrimario}>
                  <Text style={estilos.textoBarraPrimario}>
                    {esUltimoPaso ? "Terminar ➜" : "Siguiente ➜"}
                  </Text>
                </View>
              </ElementoBarrido>

              <ElementoBarrido
                id="btn-media-pictograma"
                etiqueta="Formato Pictograma"
                orden={2}
                alActivar={() => setFormatoMultimedia("pictograma")}
              >
                <View
                  style={[
                    estilos.botonMultimedia,
                    formatoMultimedia === "pictograma" && estilos.botonMultimediaActivo,
                  ]}
                >
                  <Text
                    style={[
                      estilos.textoBotonMultimedia,
                      formatoMultimedia === "pictograma" && estilos.textoBotonMultimediaActivo,
                    ]}
                  >
                    Pictograma
                  </Text>
                </View>
              </ElementoBarrido>

              <ElementoBarrido
                id="btn-media-texto"
                etiqueta="Formato Texto"
                orden={3}
                alActivar={() => setFormatoMultimedia("texto")}
              >
                <View
                  style={[
                    estilos.botonMultimedia,
                    formatoMultimedia === "texto" && estilos.botonMultimediaActivo,
                  ]}
                >
                  <Text
                    style={[
                      estilos.textoBotonMultimedia,
                      formatoMultimedia === "texto" && estilos.textoBotonMultimediaActivo,
                    ]}
                  >
                    Texto
                  </Text>
                </View>
              </ElementoBarrido>

              <ElementoBarrido
                id="btn-media-audio"
                etiqueta="Escuchar Audio del paso"
                orden={4}
                alActivar={() => setReproduciendoAudio(true)}
              >
                <View style={estilos.botonMultimedia}>
                  <Text style={estilos.textoBotonMultimedia}>🔊 Audio</Text>
                </View>
              </ElementoBarrido>

              <ElementoBarrido
                id="btn-paso-atras"
                etiqueta="Atrás"
                orden={5}
                alActivar={retrocederPasoOSalir}
              >
                <View style={estilos.botonBarraSecundario}>
                  <Text style={estilos.textoBarraSecundario}>← Atrás</Text>
                </View>
              </ElementoBarrido>
            </View>

            {reproduciendoAudio ? (
              <Text testID="mensaje-audio-paso" style={estilos.mensajeAudio}>
                🔊 Reproduciendo audio del paso...
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  // ---- Pantalla 06: Mi agenda de 3 columnas (HECHO | AHORA | DESPUÉS) idéntica a 06.html ----
  return (
    <View testID="pantalla-barrido-agenda-06" style={estilos.lienzo}>
      {/* Cabecera .top (06.html) */}
      <View style={estilos.cabecera}>
        <Text style={estilos.tituloCabecera}>📅 Mi agenda</Text>
        <Text style={estilos.fechaCabecera}>Jueves, 12 de noviembre</Text>
        <View style={estilos.pildoraUsuario}>
          <View style={estilos.avatarAlumno}>
            <Text>🦁</Text>
          </View>
          <Text style={estilos.nombreAlumno}>{nombreAlumno}</Text>
        </View>
      </View>

      <View style={estilos.cuerpo}>
        <BarraEstadoBarrido />
        <CapturadorPulsadorExterno mostrarPanelDisparo={false} />

        {/* Tres paneles: HECHO (214px) | AHORA (flex:1, borde 3px #7A1F4D) | DESPUÉS (214px) */}
        <View style={estilos.tresColumnas06}>
          {/* Columna HECHO */}
          <View style={estilos.columnaLateral06}>
            <Text style={estilos.tituloColumna06}>HECHO</Text>
            <View style={estilos.miniTarjeta06}>
              <View style={estilos.insigniaHecho}>
                <Text style={estilos.textoInsigniaHecho}>✓</Text>
              </View>
              <Text style={estilos.emojiMini}>👥</Text>
              <Text style={estilos.tituloMini}>Asamblea</Text>
              <Text style={estilos.horaMini}>9:00</Text>
            </View>
            {tareasCompletadas.map((t) => (
              <View key={t} testID={`tarea-hecha-${t}`} style={estilos.miniTarjeta06}>
                <View style={estilos.insigniaHecho}>
                  <Text style={estilos.textoInsigniaHecho}>✓</Text>
                </View>
                <Text style={estilos.emojiMini}>{t === "comedor" ? "🍽️" : "🧼"}</Text>
                <Text style={estilos.tituloMini}>
                  {t === "comedor" ? "Recuento comedor" : "Lavarse las manos"}
                </Text>
                <Text style={estilos.horaMini}>Completada</Text>
              </View>
            ))}
          </View>

          {/* Columna central AHORA */}
          <View style={estilos.columnaAhora06}>
            <Text style={estilos.tituloColumnaAhora06}>AHORA</Text>
            <View style={estilos.contenidoAhora06}>
              <Text style={estilos.emojiAhoraGigante}>{tipoTarea === "comedor" ? "🍽️" : "🧼"}</Text>
              <Text testID="titulo-ahora-06" style={estilos.tituloTareaAhora06}>
                {tituloTareaActiva}
              </Text>
              <Text style={estilos.horarioAhora06}>
                {tipoTarea === "comedor" ? "13:00 a 13:30" : "9:30 a 10:15"}
              </Text>

              <View style={estilos.filaAccionesAhora06}>
                <ElementoBarrido
                  id="agenda-btn-empezar"
                  etiqueta={`Empezar tarea: ${tituloTareaActiva}`}
                  orden={1}
                  alActivar={() => {
                    setPasoIdx(0);
                    setPantalla("ejecucion07_11");
                  }}
                >
                  <View style={estilos.botonEmpezar06}>
                    <Text style={estilos.textoBotonEmpezar06}>➜ Empezar tarea</Text>
                  </View>
                </ElementoBarrido>

                <ElementoBarrido
                  id="agenda-btn-cambiar-comedor"
                  etiqueta={
                    tipoTarea === "manos"
                      ? "Seleccionar tarea Recuento comedor (11)"
                      : "Seleccionar tarea Lavarse las manos (07)"
                  }
                  orden={2}
                  alActivar={() => setTipoTarea((prev) => (prev === "manos" ? "comedor" : "manos"))}
                >
                  <View style={estilos.botonSecundario06}>
                    <Text style={estilos.textoBotonSecundario06}>
                      {tipoTarea === "manos" ? "🍽️ Recuento comedor" : "🧼 Lavarse las manos"}
                    </Text>
                  </View>
                </ElementoBarrido>
              </View>
            </View>
          </View>

          {/* Columna DESPUÉS */}
          <View style={estilos.columnaLateral06}>
            <Text style={estilos.tituloColumna06}>DESPUÉS</Text>
            <View style={estilos.miniTarjeta06}>
              <Text style={estilos.emojiMini}>🥪</Text>
              <Text style={estilos.tituloMini}>Desayuno</Text>
              <Text style={estilos.horaMini}>10:15</Text>
            </View>
            <View style={estilos.miniTarjeta06}>
              <Text style={estilos.emojiMini}>🍽️</Text>
              <Text style={estilos.tituloMini}>Recuento comedor</Text>
              <Text style={estilos.horaMini}>13:00</Text>
            </View>
          </View>
        </View>

        {/* Barra inferior .bot con Ayuda y Preferencias navegables por barrido */}
        <View style={estilos.barraInferior06}>
          <ElementoBarrido
            id="agenda-btn-preferencias"
            etiqueta="Preferencias de barrido"
            orden={3}
            alActivar={() => setPantalla("preferencias")}
          >
            <View style={estilos.botonPreferencias06}>
              <Text style={estilos.textoBotonPreferencias06}>🎨 Preferencias</Text>
            </View>
          </ElementoBarrido>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  lienzo: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  cabecera: {
    height: 72,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#C9CED6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 14,
  },
  tituloCabecera: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2328",
  },
  fechaCabecera: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    color: "#555C69",
  },
  espaciador: {
    flex: 1,
  },
  pildoraUsuario: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#C9CED6",
    backgroundColor: "#FFFFFF",
  },
  avatarAlumno: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5E9EF",
    alignItems: "center",
    justifyContent: "center",
  },
  nombreAlumno: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2328",
  },
  cuerpo: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10,
  },
  tresColumnas06: {
    flex: 1,
    flexDirection: "row",
    gap: 14,
  },
  columnaLateral06: {
    width: 200,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#C9CED6",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  tituloColumna06: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555C69",
  },
  miniTarjeta06: {
    borderWidth: 2,
    borderColor: "#C9CED6",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  insigniaHecho: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1E7A46",
    alignItems: "center",
    justifyContent: "center",
  },
  textoInsigniaHecho: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emojiMini: {
    fontSize: 28,
  },
  tituloMini: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2328",
    textAlign: "center",
  },
  horaMini: {
    fontSize: 12,
    color: "#555C69",
  },
  columnaAhora06: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#7A1F4D",
    borderRadius: 12,
    padding: 14,
  },
  tituloColumnaAhora06: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  contenidoAhora06: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emojiAhoraGigante: {
    fontSize: 72,
  },
  tituloTareaAhora06: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2328",
    textAlign: "center",
  },
  horarioAhora06: {
    fontSize: 17,
    color: "#555C69",
  },
  filaAccionesAhora06: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 6,
  },
  botonEmpezar06: {
    minHeight: 64,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#7A1F4D",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonEmpezar06: {
    fontSize: 21,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  botonSecundario06: {
    minHeight: 64,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonSecundario06: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  barraInferior06: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 4,
  },
  botonPreferencias06: {
    minWidth: 160,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonPreferencias06: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  contenedorStepper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  filaSuperiorPaso: {
    width: "100%",
    maxWidth: 680,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  pildoraPaso: {
    backgroundColor: "#F5E9EF",
    borderColor: "#7A1F4D",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  textoPildoraPaso: {
    fontSize: 17,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  tarjetaRelojMini: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#7A1F4D",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconoRelojMini: {
    fontSize: 28,
  },
  textoQuedanMinutos: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2328",
  },
  textoEmpezasteHora: {
    fontSize: 13,
    color: "#555C69",
  },
  tarjetaPasoCentral: {
    width: "100%",
    maxWidth: 680,
    minHeight: 220,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#7A1F4D",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  filaIconosComedor11: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  cajaPictoComedor: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#C9CED6",
    alignItems: "center",
    justifyContent: "center",
  },
  flechaComedor: {
    fontSize: 38,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  cajaFormaComedor: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 3,
    borderColor: "#C9CED6",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiGigante: {
    fontSize: 72,
  },
  instruccionPaso: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2328",
    textAlign: "center",
  },
  filaMultimedia: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  botonMultimedia: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C9CED6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  botonMultimediaActivo: {
    backgroundColor: "#7A1F4D",
    borderColor: "#7A1F4D",
  },
  textoBotonMultimedia: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2328",
  },
  textoBotonMultimediaActivo: {
    color: "#FFFFFF",
  },
  botonBarraPrimario: {
    minHeight: 58,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#7A1F4D",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBarraPrimario: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  botonBarraSecundario: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBarraSecundario: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7A1F4D",
  },
  mensajeAudio: {
    fontSize: 14,
    fontWeight: "700",
    color: "#555C69",
  },
  tarjetaCompletada: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#1E7A46",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  emojiCelebracion: {
    fontSize: 64,
  },
  tituloCelebracion: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2328",
    textAlign: "center",
  },
  subtituloCelebracion: {
    fontSize: 18,
    color: "#555C69",
  },
  filaEmociones: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  botonEmocion: {
    minWidth: 140,
    minHeight: 96,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7A1F4D",
    backgroundColor: "#F5E9EF",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emojiEmocion: {
    fontSize: 38,
  },
  textoEmocion: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2328",
  },
});
