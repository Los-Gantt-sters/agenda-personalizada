import React from "react";
import { Redirect } from "expo-router";

/**
 * Redirección del panel principal de administración hacia la consola de vínculos (HU-03 / SCRUM-61).
 */
export default function AdminDashboardScreen() {
  return <Redirect href="/admin/vinculos" />;
}
