/**
 * Ruta `/biblioteca-pictogramas` — Pantalla 51 unificada («Mi biblioteca · Mis pictogramas propios»)
 * conectada a Supabase (`public.pictogramas_propios` con RLS por usuario y Storage `pictogramas-propios`)
 * (SCRUM-241 / SCRUM-275 / SCRUM-279).
 */

import React from "react";
import { Stack, useRouter } from "expo-router";
import { PantallaBibliotecaPictogramas51 } from "../src/componentes/biblioteca-pictogramas";
import { useSesion } from "../src/sesion";
import type { RolBibliotecaPictogramas51 } from "../src/tipos/bibliotecaPictogramas";

/**
 * Pantalla de ruta Expo Router para la biblioteca personal de pictogramas propios (51).
 * @returns Vista de la Pantalla 51 aislada por usuario autenticado y rol
 */
export default function BibliotecaPictogramasScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();

  const rol: RolBibliotecaPictogramas51 = sesion?.user?.role === "familiar" ? "familia" : "tutor";

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Mi biblioteca de pictogramas" }} />
      <PantallaBibliotecaPictogramas51
        rol={rol}
        nombreUsuario={sesion?.user?.fullName}
        usarBaseDeDatos
        alAtras={() => router.back()}
        alCerrarSesion={handleLogout}
      />
    </>
  );
}
