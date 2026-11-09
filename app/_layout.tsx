import { Stack } from "expo-router";
import { ProveedorNecesidades } from "../src/necesidades";
import { SesionProvider } from "../src/sesion";

export default function RootLayout() {
  return (
    <SesionProvider>
      <ProveedorNecesidades>
        <Stack />
      </ProveedorNecesidades>
    </SesionProvider>
  );
}
