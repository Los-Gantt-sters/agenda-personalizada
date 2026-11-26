/**
 * Orquestador reactivo entre el Panel del Tutor (Pantalla 33),
 * la vista de Alertas SOS · Push en tiempo real (Pantalla 47) y la Agenda del alumno (Pantalla 39)
 * sincronizado con `alertasSosService` (SCRUM-126 / SCRUM-129 · T-19.3).
 */

import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import {
  contarAlertasSosSinLeer,
  marcarAlertaSosAtendida,
  obtenerAlertasSosActivas,
  suscribirAlertasSosPush,
} from "../../servicios/alertasSosService";
import type { Paleta } from "../../temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../ui";
import { PantallaBibliotecaPictogramas51 } from "../biblioteca-pictogramas";
import { AgendaAdultoAlumno } from "../tutor-familia/AgendaAdultoAlumno";
import type { AlertaSosTutor } from "./datosAlertasSos";
import { PantallaAlertasSos47 } from "./PantallaAlertasSos47";

export type VistaFlujoSosTutor = "33" | "47" | "39" | "51";
export type DestinoPanelTutorSos = "35" | "31" | "51" | "47" | "47c";

export interface FlujoAlertasSosTutorProps {
  /** Vista inicial (`"33"` por defecto, o `"47"` para abrir directamente Alertas SOS). */
  vistaInicial?: VistaFlujoSosTutor;
  /** Nombre del tutor autenticado (`"Carmen Ruiz"` por defecto). */
  nombreTutor?: string;
  /** Se invoca al pulsar «Activar Plan B de <Alumno>» en 47 (-> Pantalla 47b). */
  alActivarPlanBAlumno?: (alerta: AlertaSosTutor) => void;
  /** Se invoca al navegar a otros destinos del Panel 33 (`"35"`, `"31"`, `"51"`, `"47c"`). */
  alNavegarPanelTutor?: (destino: Exclude<DestinoPanelTutorSos, "47">) => void;
  /** Acción para cerrar sesión (-> Pantalla 05 `/login`). */
  alCerrarSesion?: () => void;
}

/**
 * Conecta en tiempo real la tarjeta «Alertas SOS (Push)» de la Pantalla 33
 * (borde rojo + insignia `Push · N sin leer`) con la Pantalla 47 y el acceso rápido
 * a cambiar/ver la agenda del alumno (Pantalla 39).
 * @param props Propiedades del flujo de alertas SOS del tutor
 * @returns Vista activa (33, 47 o 39) sincronizada en tiempo real
 */
export function FlujoAlertasSosTutor({
  vistaInicial = "33",
  nombreTutor = "Carmen Ruiz",
  alActivarPlanBAlumno,
  alNavegarPanelTutor,
  alCerrarSesion = () => {},
}: FlujoAlertasSosTutorProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const [vista, setVista] = useState<VistaFlujoSosTutor>(vistaInicial);
  const [alertas, setAlertas] = useState<AlertaSosTutor[]>(() => obtenerAlertasSosActivas());
  const [alumnoAgenda, setAlumnoAgenda] = useState<string>("Alejandro");

  useEffect(() => {
    const desuscribir = suscribirAlertasSosPush((nuevas) => {
      setAlertas(nuevas);
    });
    return desuscribir;
  }, []);

  const sinLeer = contarAlertasSosSinLeer(alertas);
  const haySosSinLeer = sinLeer > 0;
  const primerNombre = nombreTutor.trim().split(/\s+/)[0] || "Carmen";

  if (vista === "47") {
    return (
      <PantallaAlertasSos47
        key={`sos-47-${alertas.length}-${sinLeer}`}
        nombreTutor={nombreTutor}
        alertasIniciales={alertas}
        alMarcarAtendida={(alertaId) => {
          marcarAlertaSosAtendida(alertaId);
        }}
        alActivarPlanBAlumno={(alerta) => {
          alActivarPlanBAlumno?.(alerta);
        }}
        alAbrirAgendaAlumno={(alerta) => {
          setAlumnoAgenda(alerta.nombreAlumno);
          setVista("39");
        }}
        alAtras={() => setVista("33")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (vista === "51") {
    return (
      <PantallaBibliotecaPictogramas51
        rol="tutor"
        nombreUsuario={nombreTutor}
        usarBaseDeDatos
        alAtras={() => setVista("33")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (vista === "39") {
    return (
      <AgendaAdultoAlumno
        rol="tutor"
        nombreAlumno={alumnoAgenda}
        nombreAdulto={nombreTutor}
        alAbrirTarea={() => {}}
        alAtras={() => setVista("47")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  return (
    <MarcoPantalla
      titulo="Panel de control · Tutor"
      simbolo={<Icono nombre="persona" tam={30} color={colores.primario} />}
      atras={null}
      adelante={null}
    >
      <View style={estilos.contenedor33} testID="pantalla-33-panel-tutor">
        <Texto style={estilos.saludo33}>
          {`Hola, ${primerNombre} · Gestión del aula, biblioteca de tareas y alertas SOS`}
        </Texto>
        <View style={estilos.rejilla33}>
          <Pressable
            testID="tarjeta-tutor-33-mis-alumnos"
            accessibilityRole="button"
            onPress={() => alNavegarPanelTutor?.("35")}
            style={[estilos.tarjeta33, estilos.tarjetaPrincipal33]}
          >
            <Icono nombre="personas" tam={32} color="#FFFFFF" />
            <View style={estilos.infoTarjeta33}>
              <Texto style={estilos.tituloPrincipal33}>Mis alumnos</Texto>
              <Texto style={estilos.descPrincipal33}>
                Todas las clases en la misma pantalla (9 aulas) y buscador.
              </Texto>
            </View>
          </Pressable>

          <Pressable
            testID="tarjeta-tutor-33-biblioteca-tareas"
            accessibilityRole="button"
            onPress={() => alNavegarPanelTutor?.("31")}
            style={estilos.tarjeta33}
          >
            <Icono nombre="lista" tam={32} color={colores.primario} />
            <View style={estilos.infoTarjeta33}>
              <Texto style={estilos.tituloTarjeta33}>Biblioteca de tareas</Texto>
              <Texto style={estilos.descTarjeta33}>
                Consulta tus tareas creadas, edítalas o asígnalas a clases y alumnos.
              </Texto>
            </View>
          </Pressable>

          <Pressable
            testID="tarjeta-tutor-33-biblioteca-pictogramas"
            accessibilityRole="button"
            onPress={() => {
              if (alNavegarPanelTutor) {
                alNavegarPanelTutor("51");
                return;
              }
              setVista("51");
            }}
            style={estilos.tarjeta33}
          >
            <Icono nombre="imagen" tam={32} color={colores.primario} />
            <View style={estilos.infoTarjeta33}>
              <Texto style={estilos.tituloTarjeta33}>Mi biblioteca de pictogramas</Texto>
              <Texto style={estilos.descTarjeta33}>
                Sube tus propios pictogramas pulsando «+» para el buscador.
              </Texto>
            </View>
          </Pressable>

          <Pressable
            testID="tarjeta-tutor-33-alertas-sos"
            accessibilityRole="button"
            onPress={() => setVista("47")}
            style={[estilos.tarjeta33, haySosSinLeer && estilos.tarjetaAlertaSos33]}
          >
            <Icono
              nombre="alerta"
              tam={32}
              color={haySosSinLeer ? colores.peligro : colores.primario}
            />
            <View style={estilos.infoTarjeta33}>
              <View style={estilos.filaTituloSos33}>
                <Texto style={estilos.tituloTarjeta33}>Alertas SOS (Push)</Texto>
                <View
                  style={[estilos.pildoraSos33, haySosSinLeer && estilos.pildoraSosActiva33]}
                  testID="insignia-sos-33"
                >
                  <Texto
                    style={[
                      estilos.textoPildoraSos33,
                      haySosSinLeer && estilos.textoPildoraSosActiva33,
                    ]}
                  >
                    {haySosSinLeer ? `Push · ${sinLeer} sin leer` : "Sin alertas pendientes"}
                  </Texto>
                </View>
              </View>
              <Texto style={estilos.descTarjeta33}>
                Borde rojo si hay push sin leer; activa Plan B o revisa agenda.
              </Texto>
            </View>
          </Pressable>

          <Pressable
            testID="tarjeta-tutor-33-plan-b"
            accessibilityRole="button"
            onPress={() => alNavegarPanelTutor?.("47c")}
            style={estilos.tarjeta33}
          >
            <Icono nombre="reloj" tam={32} color={colores.primario} />
            <View style={estilos.infoTarjeta33}>
              <Texto style={estilos.tituloTarjeta33}>Plan B del día</Texto>
              <Texto style={estilos.descTarjeta33}>
                Vincula una tarea Plan B a una tarea principal ya creada y actívala.
              </Texto>
            </View>
          </Pressable>
        </View>
      </View>
    </MarcoPantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenedor33: {
      flex: 1,
      padding: 20,
      gap: 14,
      backgroundColor: c.fondo,
    },
    saludo33: {
      fontSize: 23,
      fontWeight: "700",
      color: c.texto,
    },
    rejilla33: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },
    tarjeta33: {
      width: "48.8%",
      minHeight: 96,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 12,
    },
    tarjetaPrincipal33: {
      backgroundColor: c.primario,
      borderColor: c.primario,
    },
    tarjetaAlertaSos33: {
      backgroundColor: "#FDECEC",
      borderWidth: 3,
      borderColor: c.peligro,
    },
    infoTarjeta33: {
      flex: 1,
      gap: 2,
    },
    filaTituloSos33: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      flexWrap: "wrap",
    },
    tituloTarjeta33: {
      fontSize: 21,
      fontWeight: "700",
      color: c.texto,
    },
    descTarjeta33: {
      fontSize: 14,
      color: c.textoSecundario,
    },
    tituloPrincipal33: {
      fontSize: 21,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    descPrincipal33: {
      fontSize: 14,
      color: "#FFFFFF",
    },
    pildoraSos33: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    pildoraSosActiva33: {
      backgroundColor: "#FDECEC",
      borderColor: c.peligro,
    },
    textoPildoraSos33: {
      fontSize: 12,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    textoPildoraSosActiva33: {
      color: c.peligro,
    },
  });
