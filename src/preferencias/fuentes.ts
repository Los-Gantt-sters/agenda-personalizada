// Carga de las tres fuentes de Lectura Fácil (RF3.2). Las fuentes se empaquetan con la app
// (@expo-google-fonts), así que funcionan sin conexión y no dependen de Google en ejecución.
import { useFonts } from "expo-font";

import { Andika_400Regular } from "@expo-google-fonts/andika/400Regular";
import { Andika_700Bold } from "@expo-google-fonts/andika/700Bold";
import { AtkinsonHyperlegible_400Regular } from "@expo-google-fonts/atkinson-hyperlegible/400Regular";
import { AtkinsonHyperlegible_700Bold } from "@expo-google-fonts/atkinson-hyperlegible/700Bold";
import { Lexend_400Regular } from "@expo-google-fonts/lexend/400Regular";
import { Lexend_700Bold } from "@expo-google-fonts/lexend/700Bold";

export const FUENTES_EMPAQUETADAS = {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
  Lexend_400Regular,
  Lexend_700Bold,
  Andika_400Regular,
  Andika_700Bold,
};

/** Carga todas las fuentes. Devuelve true cuando están listas (o si falló, para no bloquear la app). */
export function useFuentesPreferencias(): boolean {
  const [cargadas, error] = useFonts(FUENTES_EMPAQUETADAS);
  return cargadas || error !== null;
}
