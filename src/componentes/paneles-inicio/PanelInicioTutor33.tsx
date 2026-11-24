/**
 * Pantalla 33 — Panel de control · Tutor
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/33.html`
 * (SCRUM-228 / SCRUM-244 · T-02.5).
 *
 * Características y restricciones clave del boceto definitivo:
 * - Cabecera: «Panel de control · Tutor», chip de usuario (`CR · Carmen Ruiz`) y botón «Salir» (-> 05).
 * - Saludo: «Hola, Carmen · Gestión del aula, biblioteca de tareas y alertas SOS».
 * - Exactamente 5 tarjetas en cuadrícula de 2 columnas:
 *   1. «Mis alumnos» (-> 35): destacada en color primario.
 *   2. «Biblioteca de tareas» (-> 31).
 *   3. «Mi biblioteca de pictogramas» (-> 51).
 *   4. «Alertas SOS (Push)» (-> 47): borde rojo de 3px e insignia «Push · N sin leer» si hay push pendientes.
 *   5. «Plan B del día» (-> 47c).
 * - SIN tarjeta de «Menú» / «Comedor» (la gestión de menús y alergias es exclusiva del Administrador en 48 -> 46).
 */

import React from "react";
import { PanelAdulto, type AccesoPanel } from "../../pantalla/PanelAdulto";

export type DestinoPanelTutor33 = "35" | "31" | "51" | "47" | "47c";

export interface PanelInicioTutor33Props {
  /** Nombre completo del tutor autenticado (`"Carmen Ruiz"` por defecto). */
  nombreTutor?: string;
  /** Iniciales del tutor para el avatar (`"CR"` por defecto). */
  inicialesTutor?: string;
  /** Número de alertas SOS push sin leer (`1` por defecto, como en 33.html). */
  alertasSosSinLeer?: number;
  /** Se invoca al pulsar cualquiera de las 5 tarjetas con su pantalla destino (`"35"`, `"31"`, `"51"`, `"47"`, `"47c"`). */
  alNavegar?: (destino: DestinoPanelTutor33) => void;
  /** Acción al pulsar «Salir» (-> Pantalla 05 `/login`). */
  alCerrarSesion: () => void;
}

/**
 * Renderiza la Pantalla 33 (Panel de control · Tutor) con 5 tarjetas y sin tarjeta de Menú.
 * @param props Propiedades del panel de inicio del tutor
 * @returns Componente de pantalla 33
 */
export function PanelInicioTutor33({
  nombreTutor = "Carmen Ruiz",
  inicialesTutor = "CR",
  alertasSosSinLeer = 1,
  alNavegar,
  alCerrarSesion,
}: PanelInicioTutor33Props) {
  const primerNombre = nombreTutor.trim().split(/\s+/)[0] || "Carmen";
  const haySosSinLeer = alertasSosSinLeer > 0;

  const accesos: AccesoPanel[] = [
    {
      id: "mis-alumnos",
      testID: "tarjeta-tutor-33-mis-alumnos",
      icono: "personas",
      titulo: "Mis alumnos",
      descripcion: "Todas las clases en la misma pantalla (9 aulas) y buscador.",
      etiquetaAccesible: "Mis alumnos: todas las clases en la misma pantalla (9 aulas) y buscador",
      alPulsar: () => alNavegar?.("35"),
    },
    {
      id: "biblioteca-tareas",
      testID: "tarjeta-tutor-33-biblioteca-tareas",
      icono: "lista",
      titulo: "Biblioteca de tareas",
      descripcion: "Consulta tus tareas creadas, edítalas o asígnalas a clases y alumnos.",
      etiquetaAccesible:
        "Biblioteca de tareas: consulta tus tareas creadas, edítalas o asígnalas a clases y alumnos",
      alPulsar: () => alNavegar?.("31"),
    },
    {
      id: "biblioteca-pictogramas",
      testID: "tarjeta-tutor-33-biblioteca-pictogramas",
      icono: "imagen",
      titulo: "Mi biblioteca de pictogramas",
      descripcion: "Sube tus propios pictogramas pulsando «+» para el buscador.",
      etiquetaAccesible:
        "Mi biblioteca de pictogramas: sube tus propios pictogramas pulsando más para el buscador",
      alPulsar: () => alNavegar?.("51"),
    },
    {
      id: "alertas-sos",
      testID: "tarjeta-tutor-33-alertas-sos",
      icono: "alerta",
      titulo: "Alertas SOS (Push)",
      descripcion: "Borde rojo si hay push sin leer; activa Plan B o revisa agenda.",
      etiquetaAccesible: "Alertas SOS Push: activa Plan B o revisa agenda",
      alertaActiva: haySosSinLeer,
      insigniaTexto: haySosSinLeer
        ? `Push · ${alertasSosSinLeer} sin leer`
        : "Sin alertas pendientes",
      alPulsar: () => alNavegar?.("47"),
    },
    {
      id: "plan-b",
      testID: "tarjeta-tutor-33-plan-b",
      icono: "reloj",
      titulo: "Plan B del día",
      descripcion: "Vincula una tarea Plan B a una tarea principal ya creada y actívala.",
      etiquetaAccesible:
        "Plan B del día: vincula una tarea Plan B a una tarea principal ya creada y actívala",
      alPulsar: () => alNavegar?.("47c"),
    },
  ];

  return (
    <PanelAdulto
      testID="pantalla-33-panel-tutor"
      titulo="Panel de control · Tutor"
      iconoCabecera="persona"
      nombreUsuario={nombreTutor}
      inicialesUsuario={inicialesTutor}
      saludo={`Hola, ${primerNombre} · Gestión del aula, biblioteca de tareas y alertas SOS`}
      accesos={accesos}
      alCerrarSesion={alCerrarSesion}
      etiquetaCerrarSesion="Salir y cerrar sesión"
      textoCerrarSesion="Salir"
    />
  );
}
