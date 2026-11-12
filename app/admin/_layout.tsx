// Zona de administración: solo entra el rol «admin» (PROTECTED_ROUTES de sessionGuard).
import { Stack } from "expo-router";

import { ZonaProtegida } from "../../src/sesion";

export default function ZonaAdministracion() {
  return (
    <ZonaProtegida>
      {/* Cada pantalla pinta su propia cabecera (src/pantalla): sin la barra de navegación. */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="vinculos" options={{ title: "Tutores y familias" }} />
        <Stack.Screen name="dashboard" options={{ title: "Tutores y familias" }} />
      </Stack>
    </ZonaProtegida>
  );
}
