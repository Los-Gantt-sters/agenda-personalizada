// Pantalla temporal para ver el reloj visual mientras se desarrolla HU-09. Borrar al integrarlo.
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RelojVisual } from "../src/componentes/reloj-visual/RelojVisual";

const DURACION_MS = 2 * 1000;

export default function DemoReloj() {
  const [transcurridoMs, setTranscurridoMs] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTranscurridoMs((t) => Math.min(DURACION_MS, t + 250));
    }, 250);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <View style={styles.pantalla}>
      <Text style={styles.titulo}>Demo del reloj visual (1 minuto)</Text>
      <View style={styles.fila}>
        <RelojVisual duracionMs={DURACION_MS} transcurridoMs={transcurridoMs} />
        <RelojVisual duracionMs={30} transcurridoMs={15} tamano={160} />
        <RelojVisual
          duracionMs={10}
          transcurridoMs={4}
          tamano={160}
          colores={{ disco: "#71ff4d", fondo: "#ff0000", tinta: "#ffffff" }}
        />
      </View>
      <Pressable
        style={styles.boton}
        accessibilityRole="button"
        onPress={() => setTranscurridoMs(0)}
      >
        <Text style={styles.textoBoton}>Reiniciar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24, padding: 16 },
  titulo: { fontSize: 22, fontWeight: "700" },
  fila: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 24 },
  boton: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#14213d",
  },
  textoBoton: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
});
