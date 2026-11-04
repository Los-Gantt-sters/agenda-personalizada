import { Stack } from "expo-router";
import { ProveedorNecesidades } from "../src/necesidades";

export default function RootLayout() {
  return (
    <ProveedorNecesidades>
      <Stack />
    </ProveedorNecesidades>
  );
}
