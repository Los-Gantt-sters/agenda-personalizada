import React from "react";
import { Redirect } from "expo-router";

/**
 * Redirección del perfil especialista hacia el panel docente operativo en el Sprint 1.
 */
export default function EspecialistaTerapiasScreen() {
  return <Redirect href="/docente/agenda" />;
}
