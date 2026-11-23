/**
 * Pantalla 42 — Tarea de Clase vista por la Familia en modo solo lectura (SCRUM-234 / SCRUM-257 · T-TF.3).
 * Espejo de la vista paso a paso del alumno (Pantalla 07) en modo consulta:
 *   - SÍ muestra el reloj visual regresivo superior («Quedan 45 minutos / Empezaste a las 9:30»).
 *   - Muestra la insignia «Paso X de N» y la píldora «En clase · Solo lectura (gestiona tutor)».
 *   - NO incluye botones de edición, reprogramación ni cambio de estado (privilegio exclusivo del tutor en horario escolar).
 *   - Muestra la tarjeta central del paso y los 5 botones multimedia debajo (Pictograma, Texto, Foto, Vídeo, Audio).
 */

import React, { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { urlImagenPictograma } from "../../arasaac/urls";
import { RelojVisual } from "../reloj-visual/RelojVisual";
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

export interface VistaTareaFamiliaClase42Props {
  /** Tarea escolar que consulta la familia en modo espejo del alumno. */
  tarea?: TareaAgendaAdulto;
  /** Nombre del familiar autenticado (`"Ramón"` por defecto). */
  nombreFamiliar?: string;
  /** Índice inicial del paso (`1` -> Paso 2 de 4 por defecto, como en 42.html). */
  pasoInicial?: number;
  /** Minutos transcurridos para el reloj visual en modo espejo (`0` por defecto). */
  minutosTranscurridos?: number;
  /** Acción para volver a la agenda vista Familia (Pantalla 40). */
  alVolverAgenda?: () => void;
  /** Acción para cerrar sesión. */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 42 (Familia clase): espejo de la vista de alumno en modo solo lectura.
 * @param props Propiedades de configuración de la Pantalla 42
 * @returns Componente visual espejo de tarea escolar para la familia
 */
export function VistaTareaFamiliaClase42({
  tarea = TAREA_ESCOLAR_LAVARSE_MANOS,
  nombreFamiliar = "Ramón",
  pasoInicial = 1,
  minutosTranscurridos = 0,
  alVolverAgenda,
  alCerrarSesion,
}: VistaTareaFamiliaClase42Props) {
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

  const minutosRestantes = Math.max(0, tarea.duracionMinutos - minutosTranscurridos);

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
      <View style={estilos.insigniaRol} testID="insignia-familia-42">
        <Texto style={estilos.textoInsigniaRol}>{`Familia · ${nombreFamiliar}`}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-42"
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
      titulo={`${tarea.titulo} · Vista Familia (Solo lectura)`}
      derecha={derecha}
      atras={manejarAtras}
      adelante={manejarAdelante}
    >
      <View style={estilos.contenedor} testID="pantalla-42-familia-clase">
        {/* Barra superior espejo del alumno: Paso X de N + Reloj regresivo (SIN botones de edición) */}
        <View style={estilos.barraSuperior} testID="barra-espejo-42">
          <View style={estilos.izquierdaSuperior}>
            <View style={estilos.insigniaPaso} testID="insignia-paso-42">
              <Texto style={estilos.textoInsigniaPaso}>
                {`Paso ${indicePaso + 1} de ${totalPasos}`}
              </Texto>
            </View>
            <View style={estilos.pildoraSoloLectura} testID="pildora-solo-lectura-42">
              <Icono nombre="candado" tam={16} color={colores.textoSecundario} />
              <Texto style={estilos.textoSoloLectura}>
                En clase · Solo lectura (gestiona tutor)
              </Texto>
            </View>
          </View>

          <View style={estilos.cajaReloj} testID="reloj-espejo-42">
            <RelojVisual
              duracionMs={tarea.duracionMinutos * 60_000}
              transcurridoMs={minutosTranscurridos * 60_000}
              tamano={48}
            />
            <View>
              <Texto style={estilos.textoQuedanMinutos}>
                {`Quedan ${minutosRestantes} minutos`}
              </Texto>
              <Texto style={estilos.textoEmpezasteHora}>
                {`Empezaste a las ${tarea.horaInicio.replace(/^0/, "")}`}
              </Texto>
            </View>
          </View>
        </View>

        {/* Tarjeta central del paso actual (espejo de la pantalla 07 del alumno) */}
        <View style={estilos.tarjetaPaso} testID="tarjeta-paso-42">
          {formatoActivo === "pictograma" ? (
            <Image
              source={{ uri: pasoActual.pictogramaUrl }}
              style={estilos.imagenPaso}
              accessibilityIgnoresInvertColors
            />
          ) : null}

          {formatoActivo === "foto" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-foto-42">
              <Icono nombre="imagen" tam={42} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>{pasoActual.descripcionFoto}</Texto>
            </View>
          ) : null}

          {formatoActivo === "video" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-video-42">
              <Icono nombre="reproducir" tam={42} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>{pasoActual.descripcionVideo}</Texto>
            </View>
          ) : null}

          {formatoActivo === "audio" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-audio-42">
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
        <View style={estilos.barraMultimedia} testID="barra-multimedia-42">
          {FORMATOS_MULTIMEDIA.map((fmt) => {
            const activo = formatoActivo === fmt.clave;
            return (
              <Pressable
                key={fmt.clave}
                testID={`btn-formato-42-${fmt.clave}`}
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
      gap: 12,
      backgroundColor: c.fondo,
    },
    barraSuperior: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    },
    izquierdaSuperior: {
      flexDirection: "row",
      alignItems: "center",
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
    pildoraSoloLectura: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoSoloLectura: {
      fontSize: 14,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    cajaReloj: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
    },
    textoQuedanMinutos: {
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
    },
    textoEmpezasteHora: {
      fontSize: 13,
      color: c.textoSecundario,
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
      width: 155,
      height: 155,
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
