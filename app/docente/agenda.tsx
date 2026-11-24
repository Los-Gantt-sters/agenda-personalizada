/**
 * Ruta `/docente/agenda` — Pantalla 33 (Panel de control · Tutor)
 * y navegación hacia Mis alumnos (35->36->37) y Biblioteca de tareas (31->28->28b->28c)
 * siguiendo exactamente `BOCETOS_NUEVOS/definitiva_v2/pantallas/33.html`
 * (SCRUM-228 / SCRUM-244 · T-02.5).
 */

import React, { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { PanelInicioTutor33, type DestinoPanelTutor33 } from "../../src/componentes/paneles-inicio";
import { FlujoTareasPersonales } from "../../src/componentes/tareas-personales";
import { NavegacionTutor } from "../../src/componentes/tutor/NavegacionTutor";
import { useSesion } from "../../src/sesion";

export default function DocenteAgendaScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();
  const [vistaActiva, setVistaActiva] = useState<"33" | DestinoPanelTutor33>("33");

  const nombreTutor = sesion?.user?.fullName ?? "Carmen Ruiz";

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  if (vistaActiva === "35") {
    return (
      <>
        <Stack.Screen options={{ title: "Mis alumnos" }} />
        <NavegacionTutor nombreTutor={nombreTutor} alCerrarSesion={handleLogout} />
      </>
    );
  }

  if (vistaActiva === "31") {
    return (
      <>
        <Stack.Screen options={{ title: "Biblioteca de tareas" }} />
        <FlujoTareasPersonales
          rol="tutor"
          nombreUsuario={nombreTutor}
          alVolverPanel={() => setVistaActiva("33")}
          alCerrarSesion={handleLogout}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Panel de control · Tutor" }} />
      <PanelInicioTutor33
        nombreTutor={nombreTutor}
        alCerrarSesion={handleLogout}
        alNavegar={(destino) => {
          if (destino === "35" || destino === "31") {
            setVistaActiva(destino);
          } else if (destino === "51") {
            router.push("/demo-pictogramas");
          } else if (destino === "47" || destino === "47c") {
            router.push("/agenda");
          }
        }}
      />
    </>
  );
}
