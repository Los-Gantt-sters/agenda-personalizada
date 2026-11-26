/**
 * Pantalla 42b — Tarea de Casa vista por la Familia en modo editable (SCRUM-234 / SCRUM-258 · T-TF.4).
 * Exactamente la misma interfaz editable que la Pantalla 41 del Tutor, aplicada a tareas del ámbito
 * doméstico (franja horaria de casa 15:00–08:00):
 *   - SIN reloj regresivo superior.
 *   - SIN botón de Plan B.
 *   - ÚNICAMENTE 3 botones de acción en la barra superior derecha:
 *       1. «Editar tarea» (para tareas del hogar -> 28 -> 28ok)
 *       2. «Reprogramar hora» (franja 15:00–08:00 -> 28c)
 *       3. «Marcar como pendiente» (-> 40)
 *   - Aviso informativo amarillo sobre el paso automático a Pendiente al expirar el horario.
 *   - Tarjeta central del paso actual y barra inferior con los 5 formatos multimedia.
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
  TAREA_HOGAR_PREPARAR_MOCHILA,
  type FormatoMultimediaPaso,
  type TareaAgendaAdulto,
} from "./datosAgendaAdulto";

export interface VistaTareaFamiliaCasa42bProps {
  /** Tarea doméstica que gestiona o edita la familia (`"Preparar la mochila"` por defecto). */
  tarea?: TareaAgendaAdulto;
  /** Identificador del alumno (`"luc"` por defecto). */
  alumnoId?: string;
  /** Nombre del familiar autenticado (`"Ramón"` por defecto). */
  nombreFamiliar?: string;
  /** Índice inicial del paso mostrado (`1` -> Paso 2 de 4 por defecto, como en 42b.html). */
  pasoInicial?: number;
  /** Acción 1: Editar tarea doméstica (-> Pantalla 28 -> 28ok). */
  alEditarTareaCasa?: (tareaId: string, alumnoId: string) => void;
  /** Acción 2: Reprogramar hora de la tarea doméstica en franja 15:00–08:00 (-> Pantalla 28c). */
  alReprogramarHoraCasa?: (tareaId: string, alumnoId: string) => void;
  /** Acción 3: Marcar manualmente como pendiente (-> Pantalla 40). */
  alMarcarPendienteCasa?: (tareaId: string, alumnoId: string) => void;
  /** Acción para volver a la agenda vista Familia (Pantalla 40). */
  alVolverAgenda?: () => void;
  /** Acción para cerrar sesión. */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 42b (Familia hogar) con la misma interfaz editable que la Pantalla 41.
 * @param props Propiedades de configuración de la Pantalla 42b
 * @returns Componente visual de gestión y edición de tarea de casa por la familia
 */
export function VistaTareaFamiliaCasa42b({
  tarea = TAREA_HOGAR_PREPARAR_MOCHILA,
  alumnoId = "luc",
  nombreFamiliar = "Ramón",
  pasoInicial = 1,
  alEditarTareaCasa,
  alReprogramarHoraCasa,
  alMarcarPendienteCasa,
  alVolverAgenda,
  alCerrarSesion,
}: VistaTareaFamiliaCasa42bProps) {
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
      <View style={estilos.insigniaRol} testID="insignia-familia-42b">
        <Texto style={estilos.textoInsigniaRol}>{`Familia · ${nombreFamiliar}`}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-42b"
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
      titulo={`${tarea.titulo} · Vista Familia (Tarea de casa · Editable)`}
      derecha={derecha}
      atras={manejarAtras}
      adelante={manejarAdelante}
    >
      <View style={estilos.contenedor} testID="pantalla-42b-familia-casa">
        {/* Barra superior idéntica a 41: Paso X de N + SOLO 3 acciones (SIN reloj y SIN Plan B) */}
        <View style={estilos.barraAcciones} testID="barra-acciones-42b">
          <View style={estilos.insigniaPaso} testID="insignia-paso-42b">
            <Texto style={estilos.textoInsigniaPaso}>
              {`Paso ${indicePaso + 1} de ${totalPasos}`}
            </Texto>
          </View>

          <View style={estilos.grupoTresAcciones} testID="grupo-3-acciones-42b">
            <Pressable
              testID="btn-42b-editar-tarea"
              accessibilityRole="button"
              accessibilityLabel="Editar tarea de casa"
              onPress={() => alEditarTareaCasa?.(tarea.id, alumnoId)}
              style={({ pressed }) => [estilos.botonAccion, pressed && estilos.pulsado]}
            >
              <Icono nombre="lista" tam={18} color={colores.texto} />
              <Texto style={estilos.textoBotonAccion}>Editar tarea</Texto>
            </Pressable>

            <Pressable
              testID="btn-42b-reprogramar-hora"
              accessibilityRole="button"
              accessibilityLabel="Reprogramar hora en horario de casa (15:00 a 08:00)"
              onPress={() => alReprogramarHoraCasa?.(tarea.id, alumnoId)}
              style={({ pressed }) => [estilos.botonAccion, pressed && estilos.pulsado]}
            >
              <Icono nombre="reloj" tam={18} color={colores.texto} />
              <Texto style={estilos.textoBotonAccion}>Reprogramar hora</Texto>
            </Pressable>

            <Pressable
              testID="btn-42b-marcar-pendiente"
              accessibilityRole="button"
              accessibilityLabel="Marcar tarea de casa como pendiente"
              onPress={() => alMarcarPendienteCasa?.(tarea.id, alumnoId)}
              style={({ pressed }) => [estilos.botonAccion, pressed && estilos.pulsado]}
            >
              <Icono nombre="alerta" tam={18} color={colores.texto} />
              <Texto style={estilos.textoBotonAccion}>Marcar como pendiente</Texto>
            </Pressable>
          </View>
        </View>

        {/* Aviso informativo de auto-pendiente idéntico a 41 */}
        {/* SCRUM-266: la regla la aplica el servidor (SCRUM-265); colores del tema y sin emoji */}
        <View style={estilos.avisoAutoPendiente} testID="aviso-auto-pendiente-42b">
          <Icono nombre="cronometro" tam={18} color={colores.aviso} />
          <Texto style={estilos.textoAvisoAutoPendiente}>
            Si finaliza el horario programado y no se ha pulsado «Terminar tarea», se marca
            automáticamente como Pendiente
          </Texto>
        </View>

        {/* Tarjeta central del paso actual de la tarea doméstica */}
        <View style={estilos.tarjetaPaso} testID="tarjeta-paso-42b">
          {formatoActivo === "pictograma" ? (
            <Image
              source={{ uri: pasoActual.pictogramaUrl }}
              style={estilos.imagenPaso}
              accessibilityIgnoresInvertColors
            />
          ) : null}

          {formatoActivo === "foto" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-foto-42b">
              <Icono nombre="imagen" tam={42} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>{pasoActual.descripcionFoto}</Texto>
            </View>
          ) : null}

          {formatoActivo === "video" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-video-42b">
              <Icono nombre="reproducir" tam={42} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>{pasoActual.descripcionVideo}</Texto>
            </View>
          ) : null}

          {formatoActivo === "audio" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-audio-42b">
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
        <View style={estilos.barraMultimedia} testID="barra-multimedia-42b">
          {FORMATOS_MULTIMEDIA.map((fmt) => {
            const activo = formatoActivo === fmt.clave;
            return (
              <Pressable
                key={fmt.clave}
                testID={`btn-formato-42b-${fmt.clave}`}
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
      // Píldora amarilla suave del boceto (fondo #FEF9C3 en el tema claro, radio 20).
      borderRadius: 20,
      backgroundColor: c.resalteSuave,
      borderWidth: 1,
      borderColor: c.resalte,
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
