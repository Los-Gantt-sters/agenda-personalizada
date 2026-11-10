// Zona de administración: solo entra el rol «admin» (PROTECTED_ROUTES de sessionGuard).
import { Stack } from "expo-router";

import { ZonaProtegida } from "../../src/sesion";

export default function ZonaAdministracion() {
  return (
    <ZonaProtegida>
      <Stack />
    </ZonaProtegida>
  );
}
