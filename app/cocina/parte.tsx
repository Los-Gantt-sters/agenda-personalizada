/**
 * Ruta `/cocina/parte` — Pantalla 54 (Cocina · Parte del día)
 * Destino automático al iniciar sesión con rol `cocina` en la Pantalla 05
 * (SCRUM-228 / SCRUM-244 · T-02.5).
 */

import React from "react";
import { Stack, useRouter } from "expo-router";
import { ParteCocina54 } from "../../src/componentes/paneles-inicio";
import { useSesion } from "../../src/sesion";

export default function CocinaParteScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Cocina · Parte del día" }} />
      <ParteCocina54
        nombreUsuario={sesion?.user?.fullName ?? "Cocina Central"}
        alCerrarSesion={handleLogout}
      />
    </>
  );
}
