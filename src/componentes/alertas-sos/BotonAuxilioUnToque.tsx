/**
 * Botón de auxilio de un solo toque («Urgencia») y confirmación visual inmediata («Solicitud enviada»)
 * siguiendo exactamente los bocetos `BOCETOS_NUEVOS/definitiva_v2/pantallas/14.html` y `14b.html`
 * (SCRUM-126 / SCRUM-127 · T-19.1).
 *
 * Características clave:
 * - Botón grande de un solo toque `Urgencia` (`width: 888px` máx., `height: 78px`, fondo rojo `--bad` `#B42318`)
 *   con pictograma de ayuda e icono de alerta.
 * - Al pulsarlo con un único toque, dispara inmediatamente la alerta SOS de urgencia hacia el Tutor
 *   y muestra la respuesta visual limpia de `14b.html`: círculo verde grande de `140x140` con check
 *   y texto `Solicitud enviada` (sin tarjetas extra ni ruido visual).
 */

import React, { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { urlImagenPictograma } from "../../arasaac/urls";
import type { Paleta } from "../../temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../ui";
import { crearAlertaSosDesdeNecesidad, type AlertaSosTutor } from "./datosAlertasSos";

export interface BotonAuxilioUnToqueProps {
  /** ID del alumno que emite la alerta (`"ale"` por defecto). */
  alumnoId?: string;
  /** Nombre del alumno (`"Alejandro"` por defecto). */
  nombreAlumno?: string;
  /** Nombre de la tarea activa cuando se pulsa el auxilio (`"Lavarse las manos"` por defecto). */
  tareaActiva?: string;
  /** Nombre de la sala/aula actual (`"Clase Triángulo"` por defecto). */
  salaActual?: string;
  /** Si es `true`, muestra directamente el estado de confirmación `14b` («Solicitud enviada»). */
  confirmacionInicial?: boolean;
  /** Se invoca inmediatamente al pulsar el botón de auxilio de un toque con la alerta generada. */
  alEmitirUrgencia?: (alerta: AlertaSosTutor) => void;
}

/**
 * Renderiza el botón de auxilio de un solo toque («Urgencia») con respuesta visual de emergencia (`14b.html`).
 * @param props Propiedades del botón de auxilio
 * @returns Botón de urgencia o confirmación visual «Solicitud enviada»
 */
export function BotonAuxilioUnToque({
  alumnoId = "ale",
  nombreAlumno = "Alejandro",
  tareaActiva = "Lavarse las manos",
  salaActual = "Clase Triángulo",
  confirmacionInicial = false,
  alEmitirUrgencia,
}: BotonAuxilioUnToqueProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const [enviada, setEnviada] = useState<boolean>(confirmacionInicial);

  const manejarToqueUrgencia = () => {
    const alerta = crearAlertaSosDesdeNecesidad({
      alumnoId,
      nombreAlumno,
      claveNecesidad: "urgencia",
      tareaActiva,
      salaActual,
    });
    setEnviada(true);
    alEmitirUrgencia?.(alerta);
  };

  if (enviada) {
    return (
      <View
        style={estilos.contenedorConfirmacion14b}
        testID="respuesta-visual-emergencia-14b"
        accessibilityRole="alert"
      >
        <View style={estilos.circuloVerde14b} testID="icono-check-14b">
          <Icono nombre="check" tam={84} color="#FFFFFF" grosor={4} />
        </View>
        <Texto style={estilos.textoSolicitudEnviada14b}>Solicitud enviada</Texto>
      </View>
    );
  }

  return (
    <Pressable
      testID="btn-auxilio-un-toque-urgencia"
      accessibilityRole="button"
      accessibilityLabel="Urgencia"
      onPress={manejarToqueUrgencia}
      style={({ pressed }) => [
        estilos.botonUrgencia,
        { backgroundColor: colores.peligro, borderColor: colores.peligro },
        pressed && estilos.pulsado,
      ]}
    >
      <Image
        source={{ uri: urlImagenPictograma(12252) }}
        style={estilos.pictogramaAyuda}
        accessibilityIgnoresInvertColors
      />
      <Icono nombre="alerta" tam={34} color="#FFFFFF" />
      <Texto style={estilos.textoUrgencia}>Urgencia</Texto>
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    botonUrgencia: {
      width: "100%",
      maxWidth: 888,
      minHeight: 78,
      borderRadius: 12,
      borderWidth: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      paddingHorizontal: 32,
    },
    pictogramaAyuda: {
      width: 52,
      height: 52,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    textoUrgencia: {
      fontSize: 25,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    contenedorConfirmacion14b: {
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: 20,
    },
    circuloVerde14b: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: c.exito,
      alignItems: "center",
      justifyContent: "center",
    },
    textoSolicitudEnviada14b: {
      fontSize: 42,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    pulsado: {
      opacity: 0.9,
    },
  });
