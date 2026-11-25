import React from "react";
import { Redirect } from "expo-router";

/**
 * Redirección de la entrada del administrador hacia el panel de administración (pantalla 48).
 */
export default function AdminDashboardScreen() {
  return <Redirect href="/admin" />;
}
