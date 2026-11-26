/**
 * Pantalla 47 — Alertas SOS · Push en tiempo real
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/47.html`
 * (SCRUM-126 / SCRUM-127 · T-19.1).
 *
 * Características clave del boceto definitivo (`47.html`):
 * - Cabecera: «Alertas SOS · Push en tiempo real», icono de alerta, chip de usuario
 *   (`CR · Carmen Ruiz`) y botón «Salir» (-> 05).
 * - Fila superior con texto explicativo:
 *   «Notificación push al tutor con acceso directo a Plan B o cambio de agenda del alumno.»
 *   y píldora contadora `N push sin leer` (`data-sos-count`).
 * - Tarjetas de alerta sin leer (`atendida === false`):
 *   - Borde rojo de 3px (`#B42318`) y fondo rosado (`#FDECEC`).
 *   - Pictograma, título `<Alumno> · <Tiempo>`, píldora roja `Sin leer`,
 *     detalle `Ha pulsado: <Necesidad> desde «<Tarea>».` y botón `Marcar atendida`.
 *   - Fila inferior de acciones rápidas:
 *     - «Activar Plan B de <Alumno>» (-> 47b)
 *     - «Cambiar agenda» (-> 39)
 * - Tarjetas de alerta atendidas (`atendida === true`):
 *   - Borde gris estándar, píldora verde `Atendida` y botón `Ver agenda` (-> 39).
 * - Barra inferior (`MarcoPantalla`): botón «Atrás» (-> 33) y «Adelante» deshabilitado.
 */

import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import { ALERTAS_SOS_INICIALES_47, type AlertaSosTutor } from "./datosAlertasSos";

export interface PantallaAlertasSos47Props {
  /** Nombre del tutor mostrado en cabecera (`"Carmen Ruiz"` por defecto). */
  nombreTutor?: string;
  /** Iniciales del avatar en cabecera (`"CR"` por defecto). */
  inicialesTutor?: string;
  /** Lista inicial de alertas SOS (`ALERTAS_SOS_INICIALES_47` por defecto). */
  alertasIniciales?: AlertaSosTutor[];
  /** Se invoca al pulsar «Marcar atendida» en una alerta sin leer. */
  alMarcarAtendida?: (alertaId: string, alertasActualizadas: AlertaSosTutor[]) => void;
  /** Se invoca al pulsar «Activar Plan B de <Alumno>» (-> Pantalla 47b). */
  alActivarPlanBAlumno?: (alerta: AlertaSosTutor) => void;
  /** Se invoca al pulsar «Cambiar agenda» o «Ver agenda» (-> Pantalla 39). */
  alAbrirAgendaAlumno?: (alerta: AlertaSosTutor) => void;
  /** Acción del botón inferior «Atrás» (-> Pantalla 33 Panel Tutor). */
  alAtras?: (() => void) | null;
  /** Acción del botón «Salir» en cabecera (-> Pantalla 05 `/login`). */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 47 (Alertas SOS · Push en tiempo real) del Tutor.
 * @param props Propiedades de configuración de la pantalla 47
 * @returns Vista de gestión de alertas SOS en tiempo real
 */
export function PantallaAlertasSos47({
  nombreTutor = "Carmen Ruiz",
  inicialesTutor = "CR",
  alertasIniciales = ALERTAS_SOS_INICIALES_47,
  alMarcarAtendida,
  alActivarPlanBAlumno,
  alAbrirAgendaAlumno,
  alAtras = null,
  alCerrarSesion,
}: PantallaAlertasSos47Props) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const [alertas, setAlertas] = useState<AlertaSosTutor[]>(alertasIniciales);

  const totalSinLeer = useMemo(() => alertas.filter((a) => !a.atendida).length, [alertas]);

  const manejarMarcarAtendida = (alertaId: string) => {
    const nuevas = alertas.map((a) => (a.id === alertaId ? { ...a, atendida: true } : a));
    setAlertas(nuevas);
    alMarcarAtendida?.(alertaId, nuevas);
  };

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.chipUsuario} testID="chip-usuario-47">
        <View style={estilos.avatarUsuario}>
          <Texto style={estilos.avatarTexto}>{inicialesTutor}</Texto>
        </View>
        <Texto style={estilos.nombreUsuarioTexto}>{nombreTutor}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-47"
          accessibilityRole="button"
          accessibilityLabel="Salir"
          onPress={alCerrarSesion}
          style={({ pressed }) => [estilos.botonNeutro, pressed && estilos.pulsado]}
        >
          <Icono nombre="salir" tam={18} color={colores.texto} />
          <Texto style={estilos.textoBotonNeutro}>Salir</Texto>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <MarcoPantalla
      titulo="Alertas SOS · Push en tiempo real"
      simbolo={<Icono nombre="alerta" tam={30} color={colores.primario} />}
      derecha={derecha}
      atras={alAtras}
      adelante={null}
    >
      <View style={estilos.contenedor} testID="pantalla-47-alertas-sos">
        {/* Fila superior: descripción y contador de push sin leer */}
        <View style={estilos.barraSuperior}>
          <Texto style={estilos.textoExplicativo}>
            Notificación push al tutor con acceso directo a Plan B o cambio de agenda del alumno.
          </Texto>
          <View
            style={[
              estilos.pildoraContador,
              totalSinLeer > 0 ? estilos.pildoraPeligro : estilos.pildoraExito,
            ]}
            testID="contador-sos-sin-leer-47"
          >
            <Texto
              style={[
                estilos.textoPildora,
                totalSinLeer > 0 ? estilos.textoPildoraPeligro : estilos.textoPildoraExito,
              ]}
            >
              {`${totalSinLeer} push sin leer`}
            </Texto>
          </View>
        </View>

        {/* Listado de tarjetas de alerta SOS */}
        <View style={estilos.listaAlertas} testID="lista-alertas-sos-47">
          {alertas.map((alerta) => {
            const sinLeer = !alerta.atendida;
            return (
              <View
                key={alerta.id}
                testID={`tarjeta-sos-47-${alerta.id}`}
                style={[estilos.tarjetaAlerta, sinLeer && estilos.tarjetaAlertaSinLeer]}
              >
                <View style={estilos.filaPrincipalAlerta}>
                  <Image
                    source={{ uri: alerta.pictogramaUrl }}
                    style={sinLeer ? estilos.imagenPictoSinLeer : estilos.imagenPictoAtendida}
                    accessibilityIgnoresInvertColors
                  />

                  <View style={estilos.infoAlerta}>
                    <View style={estilos.filaCabeceraAlerta}>
                      <Texto style={[estilos.tituloAlerta, sinLeer && estilos.tituloAlertaSinLeer]}>
                        {`${alerta.nombreAlumno} · ${alerta.tiempoTexto}`}
                      </Texto>
                      <View
                        style={[
                          estilos.pildoraEstado,
                          sinLeer ? estilos.pildoraPeligro : estilos.pildoraExito,
                        ]}
                        testID={`estado-alerta-47-${alerta.id}`}
                      >
                        <Texto
                          style={[
                            estilos.textoPildora,
                            sinLeer ? estilos.textoPildoraPeligro : estilos.textoPildoraExito,
                          ]}
                        >
                          {sinLeer ? "Sin leer" : "Atendida"}
                        </Texto>
                      </View>
                      {alerta.esUrgencia ? (
                        <View
                          style={[estilos.pildoraEstado, estilos.pildoraPeligro]}
                          testID={`insignia-urgencia-47-${alerta.id}`}
                        >
                          <Texto style={[estilos.textoPildora, estilos.textoPildoraPeligro]}>
                            URGENCIA
                          </Texto>
                        </View>
                      ) : null}
                    </View>

                    <Texto
                      style={sinLeer ? estilos.detalleAlertaSinLeer : estilos.detalleAlertaAtendida}
                    >
                      {`Ha pulsado: ${alerta.textoNecesidad} desde «${alerta.tareaActiva}».`}
                    </Texto>
                  </View>

                  {sinLeer ? (
                    <Pressable
                      testID={`btn-47-marcar-atendida-${alerta.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Marcar atendida alerta de ${alerta.nombreAlumno}`}
                      onPress={() => manejarMarcarAtendida(alerta.id)}
                      style={({ pressed }) => [
                        estilos.botonAccionTarjeta,
                        pressed && estilos.pulsado,
                      ]}
                    >
                      <Texto style={estilos.textoBotonAccionTarjeta}>Marcar atendida</Texto>
                    </Pressable>
                  ) : (
                    <Pressable
                      testID={`btn-47-ver-agenda-${alerta.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver agenda de ${alerta.nombreAlumno}`}
                      onPress={() => alAbrirAgendaAlumno?.(alerta)}
                      style={({ pressed }) => [
                        estilos.botonAccionTarjeta,
                        pressed && estilos.pulsado,
                      ]}
                    >
                      <Texto style={estilos.textoBotonAccionTarjeta}>Ver agenda</Texto>
                    </Pressable>
                  )}
                </View>

                {/* Fila de acciones rápidas (valor añadido) en alertas sin leer */}
                {sinLeer ? (
                  <View
                    style={estilos.filaAccionesRapidas}
                    testID={`acciones-rapidas-47-${alerta.id}`}
                  >
                    <Texto style={estilos.etiquetaAccionesRapidas}>
                      Acciones rápidas (valor añadido):
                    </Texto>

                    <Pressable
                      testID={`btn-47-activar-plan-b-${alerta.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Activar Plan B de ${alerta.nombreAlumno}`}
                      onPress={() => alActivarPlanBAlumno?.(alerta)}
                      style={({ pressed }) => [
                        estilos.botonAccionTarjeta,
                        pressed && estilos.pulsado,
                      ]}
                    >
                      <Icono nombre="reloj" tam={16} color={colores.primario} />
                      <Texto style={estilos.textoBotonAccionTarjeta}>
                        {`Activar Plan B de ${alerta.nombreAlumno}`}
                      </Texto>
                    </Pressable>

                    <Pressable
                      testID={`btn-47-cambiar-agenda-${alerta.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Cambiar agenda de ${alerta.nombreAlumno}`}
                      onPress={() => alAbrirAgendaAlumno?.(alerta)}
                      style={({ pressed }) => [
                        estilos.botonCambiarAgenda,
                        pressed && estilos.pulsadoPrimario,
                      ]}
                    >
                      <Icono nombre="calendario" tam={16} color="#FFFFFF" />
                      <Texto style={estilos.textoBotonCambiarAgenda}>Cambiar agenda</Texto>
                    </Pressable>
                  </View>
                ) : null}
              </View>
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
    chipUsuario: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      height: 46,
      paddingLeft: 5,
      paddingRight: 14,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    avatarUsuario: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarTexto: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primario,
    },
    nombreUsuarioTexto: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    botonNeutro: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      borderRadius: FORMA.radio,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    textoBotonNeutro: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    contenedor: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 20,
      justifyContent: "center",
      gap: 13,
      backgroundColor: c.fondo,
    },
    barraSuperior: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    textoExplicativo: {
      fontSize: 16,
      color: c.textoSecundario,
    },
    pildoraContador: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
    },
    pildoraEstado: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
    },
    pildoraPeligro: {
      backgroundColor: "#FDECEC",
      borderColor: c.peligro,
    },
    pildoraExito: {
      backgroundColor: "#E6F4EC",
      borderColor: c.exito,
    },
    textoPildora: {
      fontSize: 13,
      fontWeight: "700",
    },
    textoPildoraPeligro: {
      color: c.peligro,
    },
    textoPildoraExito: {
      color: c.exito,
    },
    listaAlertas: {
      gap: 13,
    },
    tarjetaAlerta: {
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 12,
    },
    tarjetaAlertaSinLeer: {
      backgroundColor: "#FDECEC",
      borderWidth: 3,
      borderColor: c.peligro,
      paddingVertical: 16,
    },
    filaPrincipalAlerta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    imagenPictoSinLeer: {
      width: 68,
      height: 68,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    imagenPictoAtendida: {
      width: 58,
      height: 58,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    infoAlerta: {
      flex: 1,
      gap: 4,
    },
    filaCabeceraAlerta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    tituloAlerta: {
      fontSize: 18,
      fontWeight: "700",
      color: c.texto,
    },
    tituloAlertaSinLeer: {
      fontSize: 21,
      color: c.peligro,
    },
    detalleAlertaSinLeer: {
      fontSize: 16,
      color: c.texto,
    },
    detalleAlertaAtendida: {
      fontSize: 16,
      color: c.textoSecundario,
    },
    botonAccionTarjeta: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    textoBotonAccionTarjeta: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    filaAccionesRapidas: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: "#F3B7B2",
      paddingTop: 10,
      flexWrap: "wrap",
    },
    etiquetaAccionesRapidas: {
      fontSize: 13,
      color: c.textoSecundario,
      marginRight: "auto",
    },
    botonCambiarAgenda: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: c.peligro,
      borderWidth: 2,
      borderColor: c.peligro,
    },
    textoBotonCambiarAgenda: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    pulsadoPrimario: {
      opacity: 0.88,
    },
  });
