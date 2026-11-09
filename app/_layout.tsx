import { Stack } from "expo-router";
import { ProveedorNecesidades } from "../src/necesidades";
import { PreferenciasProvider, useFuentesPreferencias } from "../src/preferencias";
import { SesionProvider } from "../src/sesion";
import { TemaProvider } from "../src/temas";

export default function RootLayout() {
  // Las fuentes de Lectura Fácil se cargan al arrancar; si tardan, se ve la fuente del sistema
  useFuentesPreferencias();

  return (
    <TemaProvider>
      <PreferenciasProvider>
        <SesionProvider>
          <ProveedorNecesidades>
            <Stack />
          </ProveedorNecesidades>
        </SesionProvider>
      </PreferenciasProvider>
    </TemaProvider>
  );
}
