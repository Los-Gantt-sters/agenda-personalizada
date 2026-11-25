// Botón «Ver semana» de la agenda del día (SCRUM-125 · T-17.2, MOD HU-17, pantalla 06).
// Cambios 17-11: en lugar de las pestañas «Hoy | Semana», un único botón que lleva al otro formato.
// En la 06b el botón es «Ver hoy» (AgendaSemanal06b); aquí, «Ver semana».
import { Platform, Pressable, StyleSheet } from "react-native";
import type { Paleta } from "../../temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../ui";

export function BotonVerSemana({ onPress }: { onPress: () => void }) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  return (
    <Pressable
      testID="btn-ver-semana"
      accessibilityRole="button"
      accessibilityLabel="Ver semana"
      onPress={onPress}
      style={({ pressed }) => [e.boton, pressed && e.pulsado]}
    >
      <Icono nombre="calendario" color={colores.primario} tam={22} />
      <Texto style={e.texto}>Ver semana</Texto>
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    boton: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    texto: { fontSize: 17, fontWeight: "700", color: c.primario },
    pulsado: { opacity: 0.85 },
  });
