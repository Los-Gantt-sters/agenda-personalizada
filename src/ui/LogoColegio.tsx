// Logo del centro (Hermanas Hospitalarias – Fundación Purísima Concepción). Solo se usa en la pantalla
// de inicio y en los accesos de adultos; en la agenda del alumno no aparece para no distraer.
// Va sobre una placa blanca porque el texto del logo es granate y no se leería en los temas oscuros.
import { Image, StyleSheet, View } from "react-native";

import logo from "../../assets/marca/logo-colegio.png";

/** Proporción del archivo original (669 × 114 px). */
const PROPORCION = 669 / 114;

export function LogoColegio({ ancho = 300 }: { ancho?: number }) {
  return (
    <View style={estilos.placa}>
      <Image
        source={logo}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Hospitalarias, Fundación Purísima Concepción"
        resizeMode="contain"
        style={{ width: ancho, height: ancho / PROPORCION }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  placa: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
