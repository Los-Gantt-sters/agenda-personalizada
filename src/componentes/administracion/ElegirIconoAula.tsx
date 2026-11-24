// Elegir el icono de un aula (pantalla 48b · «Cambiar icono»): una forma geométrica, un pictograma
// de ARASAAC buscado por palabra o la dirección de una imagen propia. Sin ventanas emergentes:
// ocupa la pantalla entera y «Atrás» (de la barra de abajo) vuelve a la lista sin cambiar nada.
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { useBuscadorPictogramas } from "../../arasaac";
import type { Paleta } from "../../temas";
import { Texto, useApariencia, useEstilos } from "../../ui";
import { FORMAS_AULA } from "./formasAula";
import { IconoAula } from "./IconoAula";

export interface IconoElegido {
  iconoForma: string;
  iconoUrl: string | null;
}

export function ElegirIconoAula(props: {
  /** Imagen que tiene ahora el aula, si la tiene. */
  iconoUrlActual?: string | null;
  alElegir: (icono: IconoElegido) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const [busqueda, setBusqueda] = useState("");
  const [direccion, setDireccion] = useState(props.iconoUrlActual ?? "");
  const pictogramas = useBuscadorPictogramas(busqueda, { limite: 12 });
  const direccionLimpia = direccion.trim();

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Texto style={estilos.titulo}>Formas</Texto>
      <View style={estilos.rejilla}>
        {FORMAS_AULA.map((f) => (
          <Pressable
            key={f.id}
            style={estilos.opcion}
            accessibilityRole="button"
            accessibilityLabel={`Forma ${f.nombre}`}
            testID={`forma-aula-${f.id}`}
            onPress={() => props.alElegir({ iconoForma: f.id, iconoUrl: null })}
          >
            <IconoAula iconoForma={f.id} tam={48} />
            <Texto style={estilos.nombreOpcion}>{f.nombre}</Texto>
          </Pressable>
        ))}
      </View>

      <Texto style={estilos.titulo}>Pictograma de ARASAAC</Texto>
      <TextInput
        style={estilos.campo}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Busca una palabra (por ejemplo: sol, luna, casa)"
        placeholderTextColor={colores.textoSecundario}
        accessibilityLabel="Buscar un pictograma de ARASAAC"
        testID="buscar-pictograma-aula"
      />
      {pictogramas.estado === "cargando" && <Texto style={estilos.ayuda}>Buscando…</Texto>}
      {pictogramas.estado === "error" && (
        <Texto style={estilos.error} accessibilityRole="alert">
          No se ha podido buscar ahora. Prueba otra vez o pon la dirección de una imagen.
        </Texto>
      )}
      {pictogramas.estado === "listo" && pictogramas.resultados.length === 0 && (
        <Texto style={estilos.ayuda}>No hay pictogramas con esa palabra.</Texto>
      )}
      <View style={estilos.rejilla}>
        {pictogramas.resultados.map((p) => (
          <Pressable
            key={p.id}
            style={estilos.opcion}
            accessibilityRole="button"
            accessibilityLabel={`Pictograma ${p.palabraClave}`}
            testID={`pictograma-aula-${p.id}`}
            onPress={() => props.alElegir({ iconoForma: "tri", iconoUrl: p.urlImagen })}
          >
            <IconoAula iconoUrl={p.urlImagen} tam={64} />
            <Texto style={estilos.nombreOpcion}>{p.palabraClave}</Texto>
          </Pressable>
        ))}
      </View>

      <Texto style={estilos.titulo}>Imagen propia</Texto>
      <Texto style={estilos.ayuda}>Pega la dirección (https://…) de una imagen.</Texto>
      <TextInput
        style={estilos.campo}
        value={direccion}
        onChangeText={setDireccion}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="https://…"
        placeholderTextColor={colores.textoSecundario}
        accessibilityLabel="Dirección de una imagen propia"
        testID="direccion-imagen-aula"
      />
      <Pressable
        style={[estilos.boton, !/^https?:\/\//i.test(direccionLimpia) && estilos.botonInactivo]}
        accessibilityRole="button"
        accessibilityLabel="Usar esta imagen"
        accessibilityState={{ disabled: !/^https?:\/\//i.test(direccionLimpia) }}
        disabled={!/^https?:\/\//i.test(direccionLimpia)}
        testID="usar-imagen-aula"
        onPress={() => props.alElegir({ iconoForma: "tri", iconoUrl: direccionLimpia })}
      >
        <Texto style={estilos.textoBoton}>Usar esta imagen</Texto>
      </Pressable>
    </ScrollView>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenido: { padding: 16, gap: 12, paddingBottom: 32 },
    titulo: { fontSize: 20, fontWeight: "700", color: c.texto, marginTop: 8 },
    rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    opcion: {
      width: 130,
      minHeight: 110,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 10,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    nombreOpcion: { fontSize: 15, fontWeight: "700", color: c.texto, textAlign: "center" },
    campo: {
      minHeight: 52,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      color: c.texto,
      fontSize: 18,
    },
    ayuda: { fontSize: 15, color: c.textoSecundario },
    error: { fontSize: 16, fontWeight: "700", color: c.peligro },
    boton: {
      alignSelf: "flex-start",
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 18,
      borderRadius: 10,
      backgroundColor: c.primario,
    },
    botonInactivo: { opacity: 0.45 },
    textoBoton: { fontSize: 16, fontWeight: "700", color: c.textoSobrePrimario },
  });
