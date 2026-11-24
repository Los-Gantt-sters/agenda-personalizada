/**
 * Ruta `/familiar/resumen` — Pantalla 34 (Panel de control · Familia)
 * y navegación hacia Agenda de Alejandro (40), Biblioteca de tareas (31) y Preferencias (16)
 * siguiendo exactamente `BOCETOS_NUEVOS/definitiva_v2/pantallas/34.html`
 * (SCRUM-228 / SCRUM-244 · T-02.5).
 */

import React, { useState } from "react";
import { Stack, useRouter } from "expo-router";
import {
  PanelInicioFamilia34,
  type DestinoPanelFamilia34,
} from "../../src/componentes/paneles-inicio";
import { FlujoTareasPersonales } from "../../src/componentes/tareas-personales";
import { AgendaAdultoAlumno } from "../../src/componentes/tutor-familia";
import { useSesion } from "../../src/sesion";

export default function FamiliarResumenScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();
  const [vistaActiva, setVistaActiva] = useState<"34" | DestinoPanelFamilia34>("34");

  const nombreFamilia = sesion?.user?.fullName ?? "Familia García";

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  if (vistaActiva === "40") {
    return (
      <>
        <Stack.Screen options={{ title: "Agenda de Alejandro" }} />
        <AgendaAdultoAlumno
          rol="familia"
          nombreAlumno="Alejandro"
          nombreAdulto={nombreFamilia}
          alAbrirTarea={() => router.push("/agenda")}
          alAtras={() => setVistaActiva("34")}
          alCerrarSesion={handleLogout}
        />
      </>
    );
  }

  if (vistaActiva === "31") {
    return (
      <>
        <Stack.Screen options={{ title: "Biblioteca de tareas" }} />
        <FlujoTareasPersonales
          rol="familia"
          nombreUsuario={nombreFamilia}
          alVolverPanel={() => setVistaActiva("34")}
          alCerrarSesion={handleLogout}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Panel de control · Familia" }} />
      <PanelInicioFamilia34
        nombreFamilia={nombreFamilia}
        nombreAlumnoVinculado="Alejandro"
        alCerrarSesion={handleLogout}
        alNavegar={(destino) => {
          if (destino === "40" || destino === "31") {
            setVistaActiva(destino);
          } else if (destino === "16") {
            router.push("/preferencias");
          } else if (destino === "51") {
            router.push("/demo-pictogramas");
          } else if (destino === "43") {
            router.push("/agenda");
          }
        }}
      />
    </>
  );
}
