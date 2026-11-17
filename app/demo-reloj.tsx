// Pantalla temporal para ver el reloj visual (HU-09) en la revisión. Borrar al integrarlo en la tarea.
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { RelojVisual } from "../src/componentes/reloj-visual/RelojVisual";
import { Pantalla } from "../src/pantalla";
import type { Paleta } from "../src/temas";
import { Texto as Text, useEstilos } from "../src/ui";

const MINUTO = 60 * 1000;
const DURACION_MS = 3 * MINUTO;
// Acelerado x20 para no esperar: los 3 minutos pasan en 9 segundos
const AVANCE_POR_TIC_MS = 5000;

export default function DemoReloj() {
  const styles = useEstilos(crearEstilos);
  const [transcurridoMs, setTranscurridoMs] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTranscurridoMs((t) => Math.min(DURACION_MS, t + AVANCE_POR_TIC_MS));
    }, 250);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <Pantalla titulo="Reloj visual (3 minutos, acelerado)">
      <View style={styles.pantalla}>
        <Text style={styles.ayuda}>
          Pulsa «Reiniciar» al menos una vez: el navegador no deja sonar audio sin una interacción.
        </Text>
        <View style={styles.fila}>
          <RelojVisual duracionMs={DURACION_MS} transcurridoMs={transcurridoMs} />
          {/* Criterio de aceptación: 30 min con 15 transcurridos = disco al 50 % */}
          <RelojVisual duracionMs={30 * MINUTO} transcurridoMs={15 * MINUTO} tamano={160} />
          <RelojVisual
            duracionMs={10 * MINUTO}
            transcurridoMs={4 * MINUTO}
            tamano={160}
            mostrarRotulo={false}
            colores={{ disco: "#ff4d4d", fondo: "#0b0b0b", tinta: "#ffffff" }}
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
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: 16,
      backgroundColor: c.fondo,
    },
    ayuda: { fontSize: 16, textAlign: "center", color: c.textoSecundario },
    fila: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 24 },
    boton: {
      minWidth: 48,
      minHeight: 48,
      paddingHorizontal: 20,
      justifyContent: "center",
      borderRadius: 12,
      backgroundColor: c.primario,
    },
    textoBoton: { color: c.textoSobrePrimario, fontSize: 18, fontWeight: "700" },
  });
