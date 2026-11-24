// Zona de Cocina (HU-12): solo entran los roles «cocina» y «admin» (PROTECTED_ROUTES de sessionGuard).
import { Stack } from "expo-router";

import { ZonaProtegida } from "../../src/sesion";

export default function ZonaCocina() {
  return (
    <ZonaProtegida>
      {/* Cada pantalla pinta su propia cabecera (src/pantalla): sin la barra de navegación. */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: "Cocina · Parte del día" }} />
      </Stack>
    </ZonaProtegida>
  );
}
