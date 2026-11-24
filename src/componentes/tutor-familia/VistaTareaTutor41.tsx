/**
 * Pantalla 41 — Tarea vista por el Tutor (SCRUM-234 / SCRUM-256 · T-TF.2).
 * Reglas estrictas del prototipo definitivo (41.html):
 *   - SIN reloj regresivo superior (el tutor no ejecuta la tarea con temporizador).
 *   - SIN botón de Plan B (el Plan B se gestiona exclusivamente desde la ficha 37 -> 47b).
 *   - ÚNICAMENTE 3 botones de acción en la barra superior derecha:
 *       1. «Editar tarea» (personalización solo para este alumno -> 28 -> 28ok)
 *       2. «Reprogramar hora» (-> 28c)
 *       3. «Marcar como pendiente» (-> 39)
 *   - Aviso informativo amarillo sobre el paso automático a Pendiente si finaliza el horario.
 *   - Tarjeta central del paso actual y barra inferior con los 5 formatos multimedia
 *     (Pictograma, Texto, Foto, Vídeo y Audio con síntesis de voz).
 */

import React, { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { urlImagenPictograma } from "../../arasaac/urls";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import { leer } from "../../servicios/voz";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import {
  FORMATOS_MULTIMEDIA,
  TAREA_ESCOLAR_LAVARSE_MANOS,
  type FormatoMultimediaPaso,
  type TareaAgendaAdulto,
} from "./datosAgendaAdulto";

export interface VistaTareaTutor41Props {
  /** Tarea escolar que inspecciona o edita el tutor. */
  tarea?: TareaAgendaAdulto;
  /** Identificador del alumno (`"luc"` por defecto). */
  alumnoId?: string;
  /** Nombre del alumno (`"Lucas"` por defecto). */
  nombreAlumno?: string;
  /** Nombre del tutor autenticado (`"María Carmen"` por defecto). */
  nombreTutor?: string;
  /** Índice inicial del paso mostrado (`1` -> Paso 2 de 4 por defecto, como en 41.html). */
  pasoInicial?: number;
  /** Acción 1: Editar tarea solo para este alumno (-> Pantalla 28 -> 28ok). */
  alEditarTareaSoloAlumno?: (tareaId: string, alumnoId: string) => void;
  /** Acción 2: Reprogramar hora de la tarea (-> Pantalla 28c). */
  alReprogramarHora?: (tareaId: string, alumnoId: string) => void;
  /** Acción 3: Marcar manualmente la tarea como pendiente (-> Pantalla 39). */
  alMarcarPendiente?: (tareaId: string, alumnoId: string) => void;
  /** Acción para volver a la agenda del alumno (Pantalla 39). */
  alVolverAgenda?: () => void;
  /** Acción para cerrar sesión. */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 41 del Tutor sin reloj, sin Plan B y con solo 3 acciones y 5 formatos multimedia.
 * @param props Propiedades de configuración de la Pantalla 41
 * @returns Componente visual de supervisión y edición individual de tarea para el tutor
 */
export function VistaTareaTutor41({
  tarea = TAREA_ESCOLAR_LAVARSE_MANOS,
  alumnoId = "luc",
  nombreAlumno = "Lucas",
  nombreTutor = "María Carmen",
  pasoInicial = 1,
  alEditarTareaSoloAlumno,
  alReprogramarHora,
  alMarcarPendiente,
  alVolverAgenda,
  alCerrarSesion,
}: VistaTareaTutor41Props) {
  const pasos = tarea.pasos;
  const totalPasos = Math.max(1, pasos.length);
  const [indicePaso, setIndicePaso] = useState(Math.min(Math.max(0, pasoInicial), totalPasos - 1));
  const [formatoActivo, setFormatoActivo] = useState<FormatoMultimediaPaso>("pictograma");

  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const pasoActual = pasos[indicePaso] ?? {
    orden: 1,
    texto: tarea.titulo,
    pictogramaId: tarea.pictogramaId,
    pictogramaUrl: tarea.pictogramaUrl,
    descripcionFoto: tarea.titulo,
    descripcionVideo: tarea.titulo,
  };

  const seleccionarFormato = (formato: FormatoMultimediaPaso) => {
    setFormatoActivo(formato);
    if (formato === "audio") {
      leer(`${pasoActual.orden}. ${pasoActual.texto}`);
    }
  };

  const manejarAtras = () => {
    if (indicePaso > 0) {
      setIndicePaso((prev) => prev - 1);
    } else {
      alVolverAgenda?.();
    }
  };

  const manejarAdelante =
    indicePaso < totalPasos - 1 ? () => setIndicePaso((prev) => prev + 1) : null;

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaRol} testID="insignia-tutor-41">
        <Texto style={estilos.textoInsigniaRol}>{`Tutor · ${nombreTutor}`}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-41"
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión y salir"
          onPress={alCerrarSesion}
          style={({ pressed }) => [estilos.botonSalir, pressed && estilos.pulsado]}
        >
          <Icono nombre="salir" tam={18} color={colores.texto} />
          <Texto style={estilos.textoSalir}>Salir</Texto>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <MarcoPantalla
      titulo={`${tarea.titulo} · Vista Tutor (${nombreAlumno})`}
      derecha={derecha}
      atras={manejarAtras}
      adelante={manejarAdelante}
    >
      <View style={estilos.contenedor} testID="pantalla-41-tarea-tutor">
        {/* Barra superior: Paso X de N a la izquierda + SOLO 3 acciones a la derecha (SIN reloj y SIN Plan B) */}
        <View style={estilos.barraAcciones} testID="barra-acciones-41">
          <View style={estilos.insigniaPaso} testID="insignia-paso-41">
            <Texto style={estilos.textoInsigniaPaso}>
              {`Paso ${indicePaso + 1} de ${totalPasos}`}
            </Texto>
          </View>

          <View style={estilos.grupoTresAcciones} testID="grupo-3-acciones-41">
            <Pressable
              testID="btn-41-editar-tarea"
              accessibilityRole="button"
              accessibilityLabel={`Editar tarea solo para ${nombreAlumno}`}
              onPress={() => alEditarTareaSoloAlumno?.(tarea.id, alumnoId)}
              style={({ pressed }) => [estilos.botonAccion, pressed && estilos.pulsado]}
            >
              <Icono nombre="lista" tam={18} color={colores.texto} />
              <Texto style={estilos.textoBotonAccion}>Editar tarea</Texto>
            </Pressable>

            <Pressable
              testID="btn-41-reprogramar-hora"
              accessibilityRole="button"
              accessibilityLabel="Reprogramar hora de la tarea"
              onPress={() => alReprogramarHora?.(tarea.id, alumnoId)}
              style={({ pressed }) => [estilos.botonAccion, pressed && estilos.pulsado]}
            >
              <Icono nombre="reloj" tam={18} color={colores.texto} />
              <Texto style={estilos.textoBotonAccion}>Reprogramar hora</Texto>
            </Pressable>

            <Pressable
              testID="btn-41-marcar-pendiente"
              accessibilityRole="button"
              accessibilityLabel="Marcar como pendiente"
              onPress={() => alMarcarPendiente?.(tarea.id, alumnoId)}
              style={({ pressed }) => [estilos.botonAccion, pressed && estilos.pulsado]}
            >
              <Icono nombre="alerta" tam={18} color={colores.texto} />
              <Texto style={estilos.textoBotonAccion}>Marcar como pendiente</Texto>
            </Pressable>
          </View>
        </View>

        {/* Aviso informativo de auto-pendiente al expirar horario */}
        {/* SCRUM-266: la regla la aplica el servidor (SCRUM-265); colores del tema y sin emoji */}
        <View style={estilos.avisoAutoPendiente} testID="aviso-auto-pendiente-41">
          <Icono nombre="cronometro" tam={18} color={colores.aviso} />
          <Texto style={estilos.textoAvisoAutoPendiente}>
            Si finaliza el horario programado y no se ha pulsado «Terminar tarea», se marca
            automáticamente como Pendiente
          </Texto>
        </View>

        {/* Tarjeta central del paso actual según el formato multimedia elegido */}
        <View style={estilos.tarjetaPaso} testID="tarjeta-paso-41">
          {formatoActivo === "pictograma" ? (
            <Image
              source={{ uri: pasoActual.pictogramaUrl }}
              style={estilos.imagenPaso}
              accessibilityIgnoresInvertColors
            />
          ) : null}

          {formatoActivo === "foto" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-foto-41">
              <Icono nombre="imagen" tam={42} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>{pasoActual.descripcionFoto}</Texto>
            </View>
          ) : null}

          {formatoActivo === "video" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-video-41">
              <Icono nombre="reproducir" tam={42} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>{pasoActual.descripcionVideo}</Texto>
            </View>
          ) : null}

          {formatoActivo === "audio" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-audio-41">
              <Icono nombre="altavoz" tam={42} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>
                Reproduciendo locución en voz alta (Lectura Fácil)
              </Texto>
            </View>
          ) : null}

          <Texto
            style={[estilos.textoPaso, formatoActivo === "texto" && estilos.textoPasoAmpliado]}
          >
            {`${pasoActual.orden}. ${pasoActual.texto}`}
          </Texto>
        </View>

        {/* Barra inferior de 5 formatos multimedia */}
        <View style={estilos.barraMultimedia} testID="barra-multimedia-41">
          {FORMATOS_MULTIMEDIA.map((fmt) => {
            const activo = formatoActivo === fmt.clave;
            return (
              <Pressable
                key={fmt.clave}
                testID={`btn-formato-${fmt.clave}`}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={fmt.etiqueta}
                onPress={() => seleccionarFormato(fmt.clave)}
                style={[estilos.botonFormato, activo && estilos.botonFormatoActivo]}
              >
                <Image
                  source={{ uri: urlImagenPictograma(fmt.pictogramaId, 500) }}
                  style={estilos.iconoFormato}
                  accessibilityIgnoresInvertColors
                />
                <Texto
                  style={[estilos.textoBotonFormato, activo && estilos.textoBotonFormatoActivo]}
                >
                  {fmt.etiqueta}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </View>
    </MarcoPantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cabeceraDerecha: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    insigniaRol: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoInsigniaRol: {
      fontSize: 15,
      fontWeight: "700",
      color: c.primario,
    },
    botonSalir: {
      minHeight: 40,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    textoSalir: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    contenedor: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 12,
      gap: 10,
      backgroundColor: c.fondo,
    },
    barraAcciones: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    },
    insigniaPaso: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
    },
    textoInsigniaPaso: {
      fontSize: 18,
      fontWeight: "700",
      color: c.primario,
    },
    grupoTresAcciones: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    botonAccion: {
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    textoBotonAccion: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    avisoAutoPendiente: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.aviso,
    },
    textoAvisoAutoPendiente: {
      flexShrink: 1,
      fontSize: 13,
      fontWeight: "700",
      color: c.aviso,
      textAlign: "center",
    },
    tarjetaPaso: {
      flex: 1,
      backgroundColor: c.superficie,
      borderWidth: FORMA.bordeDestacado,
      borderColor: c.primario,
      borderRadius: FORMA.radio,
      padding: 18,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    imagenPaso: {
      width: 150,
      height: 150,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
    },
    bloqueMediaEspecial: {
      padding: 16,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: "center",
      gap: 8,
    },
    textoMediaEspecial: {
      fontSize: 16,
      fontWeight: "700",
      color: c.primario,
      textAlign: "center",
    },
    textoPaso: {
      fontSize: 28,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    textoPasoAmpliado: {
      fontSize: 34,
    },
    barraMultimedia: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 10,
    },
    botonFormato: {
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    botonFormatoActivo: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
      borderWidth: FORMA.bordeDestacado,
    },
    iconoFormato: {
      width: 34,
      height: 34,
      borderRadius: 6,
      backgroundColor: "#FFFFFF",
    },
    textoBotonFormato: {
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
    },
    textoBotonFormatoActivo: {
      color: c.primario,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
  });
