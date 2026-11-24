// Buscador de pictogramas para un paso (28p, desde «Elegir pictograma» del editor 28s, HU-10).
// La pantalla 28p completa (ARASAAC + pictogramas propios) es de la HU-07 (SCRUM-90); mientras no
// esté en main, el editor de pasos usa este buscador de ARASAAC con el hook de T-04.2. Cuando entre
// la HU-07 se puede cambiar por BuscadorPictogramas28p sin tocar el resto del editor.
import { useState } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useBuscadorPictogramas } from "../../arasaac/useBuscadorPictogramas";
import type { PictogramaArasaac } from "../../arasaac/tipos";
import { Pantalla } from "../../pantalla/Pantalla";
import type { Paleta } from "../../temas";
import { FORMA, Texto, useApariencia, useEstilos } from "../../ui";

export function SelectorPictograma28p({
  terminoInicial = "",
  alElegir,
  alAtras,
}: {
  terminoInicial?: string;
  alElegir: (p: PictogramaArasaac) => void;
  alAtras: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [termino, setTermino] = useState(terminoInicial);
  const [elegido, setElegido] = useState<PictogramaArasaac | null>(null);
  const { estado, resultados, error } = useBuscadorPictogramas(termino, { limite: 24 });

  return (
    <Pantalla
      titulo="Elegir pictograma del paso"
      alAtras={alAtras}
      etiquetaAtras="Atrás: volver al paso"
      alAdelante={elegido ? () => alElegir(elegido) : null}
      textoAdelante="Seleccionar"
      testID="pantalla-28p-selector"
    >
      <View style={e.cuerpo}>
        <Texto style={e.etiqueta} nativeID="lbl-buscar-picto">
          Busca un dibujo de ARASAAC
        </Texto>
        <TextInput
          testID="campo-buscar-picto"
          accessibilityLabelledBy="lbl-buscar-picto"
          accessibilityLabel="Buscar pictograma"
          value={termino}
          onChangeText={setTermino}
          placeholder="grifo, jabón, toalla…"
          placeholderTextColor={colores.textoSecundario}
          style={e.campo}
        />
        {estado === "cargando" ? <Texto style={e.ayuda}>Buscando…</Texto> : null}
        {estado === "error" && error ? <Texto style={e.ayuda}>{error.mensajeUsuario}</Texto> : null}
        {estado === "listo" && resultados.length === 0 ? (
          <Texto style={e.ayuda}>No hay dibujos con esa palabra.</Texto>
        ) : null}
        <ScrollView contentContainerStyle={e.rejilla}>
          {resultados.map((p) => {
            const sel = elegido?.id === p.id;
            return (
              <Pressable
                key={p.id}
                testID={`picto-${p.id}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: sel, selected: sel }}
                accessibilityLabel={p.palabraClave}
                onPress={() => setElegido(p)}
                style={[e.opcion, sel && e.opcionElegida]}
              >
                <Image source={{ uri: p.urlImagen }} style={e.imagen} resizeMode="contain" />
                <Texto style={e.textoOpcion} numberOfLines={1}>
                  {p.palabraClave}
                </Texto>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cuerpo: { flex: 1, padding: 20, gap: 10, backgroundColor: c.fondo },
    etiqueta: { fontSize: 16, fontWeight: "700", color: c.texto },
    campo: {
      minHeight: 52,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: 12,
      paddingHorizontal: 14,
      fontSize: 18,
      color: c.texto,
      backgroundColor: c.superficie,
    },
    ayuda: { fontSize: 16, color: c.textoSecundario },
    rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 16 },
    opcion: {
      width: 120,
      alignItems: "center",
      gap: 4,
      padding: 8,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: "#FFFFFF",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    opcionElegida: { borderWidth: 4, borderColor: c.primario },
    imagen: { width: 88, height: 88 },
    textoOpcion: { fontSize: 14, fontWeight: "700", color: "#22211F" },
  });
