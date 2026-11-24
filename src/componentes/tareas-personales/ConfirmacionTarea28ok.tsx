/**
 * Pantalla 28ok — Confirmación de edición/creación de tarea («¡Tarea editada correctamente!»)
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/28ok.html`
 * (SCRUM-89 / SCRUM-91 · T-07.2).
 *
 * Características clave del boceto definitivo:
 * - Círculo verde de éxito con icono check y título «¡Tarea editada correctamente!».
 * - Si `alumnoEditado` está presente (flujo desde 41/42b), informa que los cambios se han
 *   guardado únicamente para ese alumno y al pulsar «Aceptar» vuelve a `39` (Tutor) o `40` (Familia).
 * - Si no hay `alumnoEditado` (flujo desde Biblioteca 31), informa que la tarea se ha guardado
 *   en la Biblioteca de tareas y al pulsar «Aceptar» vuelve a `31`.
 * - Barra inferior (`MarcoPantalla`): botón «Atrás» deshabilitado (`atras={null}`) y
 *   botón primario «Aceptar».
 */

import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { urlImagenPictograma } from "../../arasaac/urls";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import {
  resolverDestinoConfirmacion28ok,
  type DestinoRetorno28ok,
} from "../../servicios/tareasPersonalesService";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import type { RolBibliotecaAdulto } from "./datosTareasPersonales";

export interface ConfirmacionTarea28okProps {
  /** Rol activo: `"tutor"` o `"familia"`. */
  rol?: RolBibliotecaAdulto;
  /** Nombre del usuario mostrado en cabecera (`"Carmen Ruiz"` o `"Familia García"`). */
  nombreUsuario?: string;
  /** Título de la tarea guardada (`"Lavarse las manos"` por defecto). */
  tituloTarea?: string;
  /** Número de pasos de la tarea guardada (`5` por defecto). */
  pasosCount?: number;
  /** ID del pictograma ARASAAC de la tarea guardada (`2443` por defecto). */
  pictogramaTareaId?: number;
  /**
   * Si se indica el nombre del alumno (p. ej. `"Alejandro Pérez"` o `"Lucas"`),
   * muestra confirmación de edición exclusiva para ese alumno y devuelve `"39"` o `"40"`.
   */
  alumnoEditado?: string | null;
  /** Se invoca al pulsar el botón inferior «Aceptar» con la pantalla destino (`"31"`, `"39"` o `"40"`). */
  alAceptar?: (destino: DestinoRetorno28ok) => void;
  /** Acción para cerrar sesión desde la cabecera. */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 28ok (Confirmación de tarea guardada / editada).
 * @param props Propiedades de confirmación
 * @returns Vista de confirmación con retorno dinámico a 31, 39 o 40
 */
export function ConfirmacionTarea28ok({
  rol = "tutor",
  nombreUsuario,
  tituloTarea = "Lavarse las manos",
  pasosCount = 5,
  pictogramaTareaId = 2443,
  alumnoEditado = null,
  alAceptar,
  alCerrarSesion,
}: ConfirmacionTarea28okProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const destinoRetorno = resolverDestinoConfirmacion28ok(rol, alumnoEditado);

  const mensajeConfirmacion =
    alumnoEditado && alumnoEditado.trim().length > 0
      ? `Los cambios de la tarea se han guardado únicamente para el alumno ${alumnoEditado}.`
      : "La tarea se ha guardado correctamente en tu Biblioteca de tareas.";

  const pildoraResumen =
    alumnoEditado && alumnoEditado.trim().length > 0
      ? `Solo para ${alumnoEditado}`
      : "Guardada en Biblioteca de tareas";

  const etiquetaUsuario = nombreUsuario ?? (rol === "familia" ? "Familia García" : "Carmen Ruiz");

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaUsuario} testID="chip-usuario-28ok">
        <Icono nombre="persona" tam={18} color={colores.primario} />
        <Texto style={estilos.textoUsuario}>{etiquetaUsuario}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-28ok"
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión y salir"
          onPress={alCerrarSesion}
          style={({ pressed }) => [estilos.botonSecundario, pressed && estilos.pulsado]}
        >
          <Icono nombre="salir" tam={18} color={colores.texto} />
          <Texto style={estilos.textoBotonSecundario}>Salir</Texto>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <MarcoPantalla
      titulo="Tarea guardada"
      simbolo={<Icono nombre="check" tam={34} color={colores.exito} />}
      derecha={derecha}
      atras={null}
      adelante={() => alAceptar?.(destinoRetorno)}
      textoAdelante="Aceptar"
    >
      <View style={estilos.contenedor} testID="pantalla-28ok-confirmacion">
        <View style={estilos.tarjetaCentral}>
          <View style={estilos.circuloExito} testID="icono-exito-28ok">
            <Icono nombre="check" tam={52} color="#15803D" />
          </View>

          <Texto style={estilos.tituloExito}>¡Tarea editada correctamente!</Texto>

          <Texto style={estilos.subtituloExito} testID="mensaje-confirmacion-28ok">
            {mensajeConfirmacion}
          </Texto>

          <View style={estilos.tarjetaResumenTarea} testID="resumen-tarea-28ok">
            <Image
              source={{ uri: urlImagenPictograma(pictogramaTareaId) }}
              style={estilos.imagenTarea}
              accessibilityIgnoresInvertColors
            />
            <View style={estilos.infoTarea}>
              <Texto style={estilos.tituloTarea}>{tituloTarea}</Texto>
              <Texto style={estilos.subtituloTarea}>
                {`${pasosCount} ${
                  pasosCount === 1 ? "paso configurado" : "pasos configurados"
                } · Pictogramas y ayudas listos`}
              </Texto>
            </View>
            <View style={estilos.pildoraAmbito} testID="pildora-ambito-28ok">
              <Texto style={estilos.textoPildoraAmbito}>{pildoraResumen}</Texto>
            </View>
          </View>
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
    insigniaUsuario: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoUsuario: {
      fontSize: 15,
      fontWeight: "700",
      color: c.primario,
    },
    botonSecundario: {
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
    textoBotonSecundario: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    contenedor: {
      flex: 1,
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.fondo,
    },
    tarjetaCentral: {
      width: "100%",
      maxWidth: 680,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      padding: 28,
      alignItems: "center",
      gap: 14,
    },
    circuloExito: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: "#DCFCE7",
      borderWidth: 3,
      borderColor: "#16A34A",
      alignItems: "center",
      justifyContent: "center",
    },
    tituloExito: {
      fontSize: 28,
      fontWeight: "800",
      color: c.texto,
      textAlign: "center",
    },
    subtituloExito: {
      fontSize: 17,
      color: c.textoSecundario,
      textAlign: "center",
      maxWidth: 540,
    },
    tarjetaResumenTarea: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      marginTop: 6,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
    },
    imagenTarea: {
      width: 56,
      height: 56,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    infoTarea: {
      flex: 1,
      gap: 2,
    },
    tituloTarea: {
      fontSize: 18,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloTarea: {
      fontSize: 13,
      color: c.textoSecundario,
    },
    pildoraAmbito: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
    },
    textoPildoraAmbito: {
      fontSize: 12,
      fontWeight: "700",
      color: c.primario,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
  });
