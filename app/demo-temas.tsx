// Pantalla temporal para ver los temas de color (T-04.1) en la revisión. Borrar al integrar el panel
// de preferencias (T-04.3).
import { Pressable, StyleSheet, Text, View } from "react-native";

import { NOMBRES_TEMAS, TEMAS, useTema } from "../src/temas";

export default function DemoTemas() {
  const { nombre, colores, cambiarTema } = useTema();

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <Text accessibilityRole="header" style={[styles.titulo, { color: colores.texto }]}>
        Elige cómo ver la pantalla
      </Text>
      <Text style={[styles.ayuda, { color: colores.textoSecundario }]}>
        Tema activo: {TEMAS[nombre].etiqueta}
      </Text>

      <View style={styles.fila}>
        {NOMBRES_TEMAS.map((n) => {
          const activo = n === nombre;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              onPress={() => cambiarTema(n)}
              style={[
                styles.opcion,
                {
                  backgroundColor: activo ? colores.primario : colores.superficie,
                  borderColor: activo ? colores.foco : colores.borde,
                },
              ]}
            >
              <Text
                style={[
                  styles.textoOpcion,
                  { color: activo ? colores.textoSobrePrimario : colores.texto },
                ]}
              >
                {TEMAS[n].etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.tarjeta,
          { backgroundColor: colores.superficieDestacada, borderColor: colores.borde },
        ]}
      >
        <Text style={[styles.textoTarjeta, { color: colores.texto }]}>
          Ahora: Lavarse las manos
        </Text>
        <Text style={[styles.ayuda, { color: colores.textoSecundario }]}>Faltan 5 minutos</Text>
        <View style={styles.fila}>
          <Text style={[styles.etiqueta, { color: colores.exito }]}>Hecho</Text>
          <Text style={[styles.etiqueta, { color: colores.aviso }]}>Aviso</Text>
          <Text style={[styles.etiqueta, { color: colores.peligro }]}>Error</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 16 },
  titulo: { fontSize: 28, fontWeight: "800" },
  ayuda: { fontSize: 18, textAlign: "center" },
  fila: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 },
  opcion: {
    minWidth: 120,
    minHeight: 120,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textoOpcion: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  tarjeta: { borderWidth: 2, borderRadius: 16, padding: 24, gap: 12, alignItems: "center" },
  textoTarjeta: { fontSize: 24, fontWeight: "700" },
  etiqueta: { fontSize: 20, fontWeight: "700" },
});
