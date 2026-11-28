// Etiqueta del alumno arriba a la derecha (bocetos 08, 08b, 10 y 10b del prototipo definitivo):
// una píldora con un círculo y el nombre, para que se vea de quién es la agenda.
// En el círculo va la inicial (sin emojis como iconos, como en el resto de la app).
import { StyleSheet, View } from "react-native";
import type { Paleta } from "../temas";
import { Texto } from "./Texto";
import { useEstilos } from "./apariencia";

export function ChipAlumno({ nombre }: { nombre: string }) {
  const e = useEstilos(crearEstilos);
  const limpio = nombre.trim();
  if (!limpio) return null;
  return (
    <View style={e.chip} testID="chip-alumno" accessible accessibilityLabel={`Agenda de ${limpio}`}>
      <View style={e.avatar}>
        <Texto style={e.inicial}>{limpio.charAt(0).toUpperCase()}</Texto>
      </View>
      <Texto style={e.nombre} numberOfLines={1}>
        {limpio}
      </Texto>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      height: 46,
      paddingLeft: 5,
      paddingRight: 14,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      maxWidth: 220,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.superficieDestacada,
    },
    inicial: { fontSize: 16, fontWeight: "700", color: c.primario },
    nombre: { fontSize: 16, fontWeight: "700", color: c.texto, flexShrink: 1 },
  });
