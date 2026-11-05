// Pictograma o foto de una tarea de la agenda (T-06.1, HU-06).
import { useState } from "react";
import { Image, Text, View } from "react-native";
import type { Tarea } from "./tipos";

/**
 * RNF4.4: el texto siempre va con pictograma o foto. Si la imagen no existe
 * o no carga, se enseña el emoji de respaldo (o uno genérico), nunca un hueco.
 */
export function PictogramaTarea({
  tarea,
  tam,
}: {
  tarea: Pick<Tarea, "titulo" | "pictograma_url" | "emoji">;
  tam: number;
}) {
  const [fallo, setFallo] = useState(false);
  const url = tarea.pictograma_url;

  if (url && !fallo) {
    return (
      <Image
        source={{ uri: url }}
        onError={() => setFallo(true)}
        resizeMode="contain"
        accessible
        accessibilityLabel={`Dibujo de ${tarea.titulo}`}
        style={{ width: tam, height: tam }}
      />
    );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Dibujo de ${tarea.titulo}`}
      style={{ width: tam, height: tam, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ fontSize: tam * 0.78, lineHeight: tam }}>{tarea.emoji || "🖼️"}</Text>
    </View>
  );
}
