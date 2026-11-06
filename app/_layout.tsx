import { Stack } from "expo-router";

import { PreferenciasProvider, useFuentesPreferencias } from "../src/preferencias";
import { TemaProvider } from "../src/temas";

export default function RootLayout() {
  // Las fuentes de Lectura Fácil se cargan al arrancar; si tardan, se ve la fuente del sistema
  useFuentesPreferencias();

  return (
    <TemaProvider>
      <PreferenciasProvider>
        <Stack />
      </PreferenciasProvider>
    </TemaProvider>
  );
}
