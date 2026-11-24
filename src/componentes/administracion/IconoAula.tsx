// Icono de un aula: su imagen (pictograma de ARASAAC o propia) o, si no tiene, su forma geométrica.
import { Image } from "react-native";

import { FormaClase } from "../../ui";
import { FORMAS_AULA, idFormaAula } from "./formasAula";

export function IconoAula(props: {
  iconoForma?: string | null;
  iconoUrl?: string | null;
  tam?: number;
}) {
  const tam = props.tam ?? 48;
  if (props.iconoUrl) {
    return (
      <Image
        source={{ uri: props.iconoUrl }}
        style={{ width: tam, height: tam }}
        resizeMode="contain"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="icono-aula-imagen"
      />
    );
  }
  const id = idFormaAula(props.iconoForma);
  const simbolo = FORMAS_AULA.find((f) => f.id === id)?.simbolo ?? "⬜";
  return <FormaClase claseId={id} simbolo={simbolo} tam={tam} />;
}
