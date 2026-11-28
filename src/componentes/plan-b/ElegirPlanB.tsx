// Entrada única al Plan B desde el panel del tutor (HU-22): se elige si es el del día de toda la
// clase (47c) o el de un alumno (47b). Así el panel no tiene dos accesos casi iguales.
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos, type NombreIcono } from "../../ui";

export function ElegirPlanB({
  alElegirDia,
  alElegirAlumno,
  alAtras,
  alCerrarSesion,
}: {
  alElegirDia: () => void;
  alElegirAlumno: () => void;
  alAtras: () => void;
  alCerrarSesion?: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);

  const opciones: {
    id: string;
    icono: NombreIcono;
    titulo: string;
    texto: string;
    alPulsar: () => void;
  }[] = [
    {
      id: "dia",
      icono: "calendario",
      titulo: "Plan B del día",
      texto: "Para toda la clase: vincula una tarea Plan B y actívala.",
      alPulsar: alElegirDia,
    },
    {
      id: "alumno",
      icono: "persona",
      titulo: "Plan B de un alumno",
      texto: "Elige al alumno y cambia solo su Plan B de hoy.",
      alPulsar: alElegirAlumno,
    },
  ];

  return (
    <MarcoPantalla
      titulo="Plan B"
      simbolo={<Icono nombre="repetir" color={colores.primario} tam={30} />}
      derecha={
        alCerrarSesion ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión y salir"
            onPress={alCerrarSesion}
            style={({ pressed }) => [e.salir, pressed && e.pulsado]}
          >
            <Icono nombre="salir" tam={20} color={colores.texto} />
            <Texto style={e.textoSalir}>Salir</Texto>
          </Pressable>
        ) : null
      }
      atras={alAtras}
      etiquetaAtras="Atrás: volver al panel"
      testID="pantalla-elegir-plan-b"
    >
      <View style={e.contenido}>
        <Texto style={e.pregunta} accessibilityRole="header">
          ¿Qué Plan B quieres cambiar?
        </Texto>
        <View style={e.opciones}>
          {opciones.map((o) => (
            <Pressable
              key={o.id}
              testID={`elegir-plan-b-${o.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${o.titulo}: ${o.texto}`}
              onPress={o.alPulsar}
              style={({ pressed }) => [e.opcion, pressed && e.pulsado]}
            >
              <Icono nombre={o.icono} color={colores.primario} tam={56} />
              <Texto style={e.titulo}>{o.titulo}</Texto>
              <Texto style={e.texto}>{o.texto}</Texto>
            </Pressable>
          ))}
        </View>
      </View>
    </MarcoPantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenido: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24, padding: 20 },
    pregunta: { fontSize: 26, fontWeight: "700", color: c.texto, textAlign: "center" },
    opciones: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 20 },
    opcion: {
      width: 320,
      minHeight: 220,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 20,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      backgroundColor: c.superficie,
    },
    titulo: { fontSize: 22, fontWeight: "700", color: c.texto, textAlign: "center" },
    texto: { fontSize: 16, color: c.textoSecundario, textAlign: "center" },
    salir: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
    },
    textoSalir: { fontSize: 16, fontWeight: "700", color: c.texto },
    pulsado: { opacity: 0.85 },
  });
