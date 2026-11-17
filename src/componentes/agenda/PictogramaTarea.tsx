// Pictograma o foto de una tarea de la agenda (T-06.1, HU-06).
import { useState } from "react";
import { Image, Text, View } from "react-native";
import type { Tarea } from "./tipos";

/**
 * RNF4.4: el texto siempre va con pictograma o foto. Si la imagen no existe
 * o no carga, se enseña el emoji de respaldo (o uno genérico), nunca un hueco.
 *
 * Va siempre sobre una placa blanca: los trazos negros de ARASAAC desaparecerían sobre el fondo de
 * los temas oscuros y de alto contraste.
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
  const placa = {
    width: tam,
    height: tam,
    backgroundColor: "#FFFFFF",
    borderRadius: Math.round(Math.min(14, tam * 0.12)),
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  };
  // Pequeño margen interior para que el dibujo no toque el borde de la placa.
  const lado = Math.round(tam * 0.9);

  if (url && !fallo) {
    return (
      <View style={placa}>
        <Image
          source={{ uri: url }}
          onError={() => setFallo(true)}
          resizeMode="contain"
          accessible
          accessibilityLabel={`Dibujo de ${tarea.titulo}`}
          style={{ width: lado, height: lado }}
        />
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Dibujo de ${tarea.titulo}`}
      style={placa}
    >
      <Text style={{ fontSize: tam * 0.7, lineHeight: tam }}>{tarea.emoji || "🖼️"}</Text>
    </View>
  );
}
