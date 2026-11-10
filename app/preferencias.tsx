// Pantalla del panel de preferencias de apariencia (T-04.3). De momento es accesible en /preferencias;
// se enlazará desde la ficha de configuración del estudiante cuando exista (prototipo 44).
import { Stack } from "expo-router";

import { PanelPreferencias } from "../src/preferencias";

export default function PreferenciasScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Preferencias de apariencia" }} />
      <PanelPreferencias />
    </>
  );
}
