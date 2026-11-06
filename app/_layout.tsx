import { Stack } from "expo-router";

import { TemaProvider } from "../src/temas";

export default function RootLayout() {
  return (
    <TemaProvider>
      <Stack />
    </TemaProvider>
  );
}
