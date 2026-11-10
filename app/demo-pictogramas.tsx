// Pantalla de demostración de SCRUM-65 (T-04.2: Catálogo oficial de pictogramas ARASAAC y consumo API),
// fiel a los 3 flujos de tuagendita-prototipos.html:
// 1. Buscador ARASAAC en creación de tarea de tutor/familia (prototipos 47 y 52, .libgrid).
// 2. Selección sin teclado por categorías del estudiante (prototipos 19 y 20, CATS).
// 3. Biblioteca de recursos accesibles de administración con validación de descripción (prototipo 66).
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  CATALOGO_PICTOGRAMAS,
  CATEGORIAS_ESTUDIANTE,
  Pictograma,
  PictogramaArasaac,
  RecursoBibliotecaArasaac,
  TEXTO_ATRIBUCION_ARASAAC,
  buscarEnCatalogo,
  tieneDescripcionValida,
  useBuscadorPictogramas,
} from "../src/arasaac";

type VistaDemo = "buscador" | "categorias" | "biblioteca";

const RECURSOS_INICIALES: RecursoBibliotecaArasaac[] = CATALOGO_PICTOGRAMAS.slice(0, 14).map(
  (pictograma, indice) => ({
    pictograma,
    origen: "ARASAAC",
    palabrasClaveTexto: pictograma.palabrasClave.join(" "),
    // Igual que en el prototipo 66 (i === 5 sin descripción) para demostrar la validación RF14.7
    descripcionAlternativa: indice === 5 ? "" : `Pictograma ARASAAC: ${pictograma.palabraClave}`,
  }),
);

export default function DemoPictogramas() {
  const [vista, setVista] = useState<VistaDemo>("buscador");
  const [consulta, setConsulta] = useState("");
  const [seleccionado, setSeleccionado] = useState<PictogramaArasaac>(CATALOGO_PICTOGRAMAS[0]);
  const [marcadoHecho, setMarcadoHecho] = useState(false);
  const [indiceCategoria, setIndiceCategoria] = useState(0);
  const [indiceActividad, setIndiceActividad] = useState(0);
  const [recursos, setRecursos] = useState<RecursoBibliotecaArasaac[]>(RECURSOS_INICIALES);
  const [borradores, setBorradores] = useState<Record<number, string>>({});

  const { estado, resultados, error } = useBuscadorPictogramas(consulta, { limite: 24 });
  const locales = consulta.trim().length > 0 ? buscarEnCatalogo(consulta) : CATALOGO_PICTOGRAMAS;
  const mostrados = estado === "listo" && resultados.length > 0 ? resultados : locales;
  const sinDescripcion = recursos.filter((r) => !tieneDescripcionValida(r)).length;
  const categoriaActual = CATEGORIAS_ESTUDIANTE[indiceCategoria];

  const guardarDescripcion = (indice: number) => {
    const texto = (borradores[indice] ?? "").trim();
    if (!texto) return;
    setRecursos((prev) =>
      prev.map((item, i) => (i === indice ? { ...item, descripcionAlternativa: texto } : item)),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.pantalla}>
      <Text accessibilityRole="header" style={styles.titulo}>
        Catálogo y Buscador ARASAAC (SCRUM-65)
      </Text>

      <View style={styles.pestanas}>
        {(
          [
            ["buscador", "1. Buscador Tutor / Familia (47 · 52)"],
            ["categorias", "2. Categorías Estudiante (19 · 20)"],
            ["biblioteca", "3. Biblioteca Admin (66)"],
          ] as const
        ).map(([clave, etiqueta]) => {
          const activa = vista === clave;
          return (
            <Pressable
              key={clave}
              accessibilityRole="button"
              accessibilityState={{ selected: activa }}
              onPress={() => setVista(clave)}
              style={[styles.botonPestana, activa && styles.botonPestanaActiva]}
            >
              <Text style={[styles.textoPestana, activa && styles.textoPestanaActiva]}>
                {etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {vista === "buscador" && (
        <View style={styles.panel}>
          <Text style={styles.etiquetaCampo}>Pictograma · buscador ARASAAC</Text>
          <TextInput
            value={consulta}
            onChangeText={setConsulta}
            placeholder="Escribe: manos, pan, cama…"
            accessibilityLabel="Pictograma, buscador ARASAAC"
            style={styles.campo}
          />

          {estado === "cargando" && (
            <Text style={styles.estadoTexto}>Consultando API oficial de ARASAAC…</Text>
          )}
          {estado === "error" && <Text style={styles.error}>{error?.mensajeUsuario}</Text>}
          {estado === "listo" && resultados.length === 0 && mostrados.length === 0 && (
            <Text style={styles.estadoTexto}>No hay pictogramas para esa palabra.</Text>
          )}

          <View style={styles.libgrid}>
            {mostrados.map((p) => {
              const activo = p.id === seleccionado.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  accessibilityLabel={`Elegir pictograma ${p.palabraClave}`}
                  onPress={() => setSeleccionado(p)}
                  style={[styles.celdaLib, activo && styles.celdaLibActiva]}
                >
                  <Pictograma
                    pictograma={p}
                    tamano={54}
                    colorBorde={activo ? "#1F5FA8" : "#C6D1E2"}
                  />
                  <Text numberOfLines={1} style={styles.etiquetaCelda}>
                    {p.palabraClave}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.vistaPrevia}>
            <Pictograma pictograma={seleccionado} tamano={120} completado={marcadoHecho} />
            <View style={styles.datosPrevia}>
              <Text style={styles.tituloPrevia}>{seleccionado.palabraClave}</Text>
              <Text style={styles.metaPrevia}>ID ARASAAC: {seleccionado.id}</Text>
              <Text style={styles.metaPrevia}>Alt: {seleccionado.descripcion}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ checked: marcadoHecho }}
                onPress={() => setMarcadoHecho((v) => !v)}
                style={styles.botonSecundario}
              >
                <Text style={styles.textoBotonSecundario}>
                  {marcadoHecho
                    ? "Quitar marca de tarea hecha (✓)"
                    : "Probar estado hecho (.pic.done ✓)"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {vista === "categorias" && (
        <View style={styles.panel}>
          <Text style={styles.subtitulo}>
            ¿Qué vas a hacer después del cole? (Paso 1 · Prototipo 19)
          </Text>
          <View style={styles.catgrid}>
            {CATEGORIAS_ESTUDIANTE.map((cat, idx) => {
              const activa = idx === indiceCategoria;
              return (
                <Pressable
                  key={cat.nombre}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                  accessibilityLabel={cat.nombre}
                  onPress={() => {
                    setIndiceCategoria(idx);
                    setIndiceActividad(0);
                  }}
                  style={[styles.tarjetaCat, activa && styles.tarjetaCatActiva]}
                >
                  <Pictograma pictograma={cat.pictograma} tamano={84} />
                  <Text style={styles.textoCat}>{cat.nombre}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.subtitulo}>
            Elige el dibujo de «{categoriaActual.nombre}» (Paso 2 · Prototipo 20)
          </Text>
          <View style={styles.catgrid}>
            {categoriaActual.actividades.map((act, idx) => {
              const activa = idx === indiceActividad;
              return (
                <Pressable
                  key={act.titulo}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                  accessibilityLabel={act.titulo}
                  onPress={() => setIndiceActividad(idx)}
                  style={[styles.tarjetaCat, activa && styles.tarjetaCatActiva]}
                >
                  <Pictograma pictograma={act.pictograma} tamano={96} completado={activa} />
                  <Text style={styles.textoCat}>{act.titulo}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {vista === "biblioteca" && (
        <View style={styles.panel}>
          <View style={styles.cabeceraBib}>
            <Text style={styles.subtitulo}>Biblioteca de recursos accesibles (Prototipo 66)</Text>
            <View
              style={[
                styles.insigniaEstado,
                sinDescripcion > 0 ? styles.insigniaAlerta : styles.insigniaOk,
              ]}
            >
              <Text style={styles.textoInsignia}>{sinDescripcion} sin descripción</Text>
            </View>
          </View>

          {recursos.map((r, k) => (
            <View key={r.pictograma.id} style={styles.filaRecurso}>
              <Pictograma pictograma={r.pictograma} variante="mini" tamano={38} />
              <Text style={styles.origenRecurso}>{r.origen}</Text>
              <Text style={styles.clavesRecurso}>{r.palabrasClaveTexto}</Text>
              <View style={styles.celdaDescripcion}>
                {tieneDescripcionValida(r) ? (
                  <Text style={styles.descripcionOk}>{r.descripcionAlternativa}</Text>
                ) : (
                  <View style={styles.filaEdicion}>
                    <TextInput
                      value={borradores[k] ?? ""}
                      onChangeText={(t) => setBorradores((prev) => ({ ...prev, [k]: t }))}
                      placeholder="Falta la descripción"
                      accessibilityLabel={`Descripción para ${r.pictograma.palabraClave}`}
                      style={styles.inputDescripcion}
                    />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => guardarDescripcion(k)}
                      style={styles.botonGuardar}
                    >
                      <Text style={styles.textoGuardar}>Guardar</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.atribucion}>{TEXTO_ATRIBUCION_ARASAAC}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pantalla: { alignItems: "center", gap: 16, padding: 20, backgroundColor: "#EEF1F5" },
  titulo: { fontSize: 24, fontWeight: "800", color: "#14213D" },
  pestanas: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  botonPestana: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C6D1E2",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  botonPestanaActiva: { backgroundColor: "#1F5FA8", borderColor: "#1F5FA8" },
  textoPestana: { fontSize: 14, fontWeight: "700", color: "#14213D" },
  textoPestanaActiva: { color: "#FFFFFF" },
  panel: {
    width: "100%",
    maxWidth: 880,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C6D1E2",
    padding: 16,
    gap: 14,
  },
  etiquetaCampo: { fontSize: 15, fontWeight: "700", color: "#14213D" },
  campo: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: "#C6D1E2",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#F4F7FB",
  },
  estadoTexto: { fontSize: 15, color: "#4A5670" },
  error: { fontSize: 15, color: "#C22B33", fontWeight: "700" },
  libgrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  celdaLib: {
    width: 82,
    minHeight: 82,
    padding: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C6D1E2",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  celdaLibActiva: { borderColor: "#1F5FA8", borderWidth: 3, backgroundColor: "#E3EDFB" },
  etiquetaCelda: { fontSize: 12, fontWeight: "600", color: "#14213D", textAlign: "center" },
  vistaPrevia: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F4F7FB",
    borderWidth: 1,
    borderColor: "#C6D1E2",
  },
  datosPrevia: { flex: 1, minWidth: 220, gap: 6 },
  tituloPrevia: { fontSize: 20, fontWeight: "800", color: "#14213D" },
  metaPrevia: { fontSize: 14, color: "#4A5670" },
  botonSecundario: {
    minHeight: 48,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#1F5FA8",
    justifyContent: "center",
    marginTop: 4,
  },
  textoBotonSecundario: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  subtitulo: { fontSize: 18, fontWeight: "800", color: "#14213D" },
  catgrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tarjetaCat: {
    width: 156,
    minHeight: 148,
    padding: 12,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#C6D1E2",
    backgroundColor: "#F4F7FB",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tarjetaCatActiva: { borderColor: "#1F5FA8", backgroundColor: "#E3EDFB" },
  textoCat: { fontSize: 16, fontWeight: "800", color: "#14213D", textAlign: "center" },
  cabeceraBib: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  insigniaEstado: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  insigniaAlerta: { backgroundColor: "#FDE8E8" },
  insigniaOk: { backgroundColor: "#DEF7EC" },
  textoInsignia: { fontSize: 13, fontWeight: "700", color: "#14213D" },
  filaRecurso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E6ECF5",
    flexWrap: "wrap",
  },
  origenRecurso: { width: 76, fontSize: 13, fontWeight: "700", color: "#4A5670" },
  clavesRecurso: { width: 140, fontSize: 14, color: "#14213D", fontWeight: "600" },
  celdaDescripcion: { flex: 1, minWidth: 220 },
  descripcionOk: { fontSize: 14, color: "#2B7A4B", fontWeight: "600" },
  filaEdicion: { flexDirection: "row", gap: 8, alignItems: "center" },
  inputDescripcion: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#C22B33",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
  },
  botonGuardar: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1F5FA8",
    justifyContent: "center",
  },
  textoGuardar: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  atribucion: { fontSize: 13, color: "#4A5670", textAlign: "center", maxWidth: 680 },
});
