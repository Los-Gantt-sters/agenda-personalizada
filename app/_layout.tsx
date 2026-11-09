import { Stack } from "expo-router";

import { SesionProvider } from "../src/sesion";

export default function RootLayout() {
  return (
    <SesionProvider>
      <Stack />
    </SesionProvider>
  );
}
