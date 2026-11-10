import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Estudiante } from "../../tipos/estudiante";
import { TarjetaEstudiante } from "./TarjetaEstudiante";

export interface CuadriculaEstudiantesProps {
  estudiantes: Estudiante[];
  alSeleccionarEstudiante: (estudiante: Estudiante) => void;
  estudianteSeleccionadoId?: string;
  tamanioMinimoTarjeta?: number; // Garantiza >= 120px
}

export const CuadriculaEstudiantes: React.FC<CuadriculaEstudiantesProps> = ({
  estudiantes,
  alSeleccionarEstudiante,
  estudianteSeleccionadoId,
  tamanioMinimoTarjeta = 140,
}) => {
  return (
    <ScrollView
      contentContainerStyle={estilos.contenedorScroll}
      showsVerticalScrollIndicator={false}
      testID="cuadricula-estudiantes-scroll"
    >
      <View style={estilos.cuadricula} testID="cuadricula-estudiantes" accessibilityRole="none">
        {estudiantes.map((estudiante) => (
          <TarjetaEstudiante
            key={estudiante.id}
            estudiante={estudiante}
            alSeleccionar={alSeleccionarEstudiante}
            seleccionado={estudiante.id === estudianteSeleccionadoId}
            tamanioMinimo={tamanioMinimoTarjeta}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const estilos = StyleSheet.create({
  contenedorScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  cuadricula: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 900,
    width: "100%",
  },
});
