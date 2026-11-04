import React from "react";
import { TouchableOpacity, Text, View, StyleSheet, Image, Platform } from "react-native";
import { Estudiante } from "../../tipos/estudiante";

export interface TarjetaEstudianteProps {
  estudiante: Estudiante;
  alSeleccionar: (estudiante: Estudiante) => void;
  seleccionado?: boolean;
  tamanioMinimo?: number; // Por defecto 140px, garantizando >= 120px (RNF1.1)
}

export const TarjetaEstudiante: React.FC<TarjetaEstudianteProps> = ({
  estudiante,
  alSeleccionar,
  seleccionado = false,
  tamanioMinimo = 140,
}) => {
  const dimensionFinal = Math.max(tamanioMinimo, 120);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Foto de ${estudiante.nombre}`}
      accessibilityHint="Toca para entrar con tu perfil"
      accessibilityState={{ selected: seleccionado }}
      activeOpacity={0.7}
      testID={`tarjeta-estudiante-${estudiante.id}`}
      style={[
        estilos.tarjeta,
        {
          minWidth: dimensionFinal,
          minHeight: dimensionFinal,
          borderColor: seleccionado ? "#3182CE" : "#E2E8F0",
          backgroundColor: seleccionado ? "#EBF8FF" : "#FFFFFF",
        },
        seleccionado && estilos.tarjetaSeleccionada,
      ]}
      onPress={() => alSeleccionar(estudiante)}
    >
      <View
        style={[
          estilos.avatarContenedor,
          {
            backgroundColor: estudiante.color ? `${estudiante.color}15` : "#EDF2F7",
            borderColor: estudiante.color || "#CBD5E0",
          },
        ]}
      >
        {estudiante.fotoUrl ? (
          <Image
            source={{ uri: estudiante.fotoUrl }}
            style={estilos.foto}
            accessibilityLabel={`Retrato de ${estudiante.nombre}`}
          />
        ) : (
          <Text style={estilos.iconoAvatar}>{estudiante.icono}</Text>
        )}
      </View>

      <Text style={estilos.nombreLecturaFacil} numberOfLines={2} adjustsFontSizeToFit>
        {estudiante.nombre}
      </Text>
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  tarjeta: {
    // RNF1.1: Al menos 120x120 px
    minWidth: 140,
    minHeight: 140,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 8,
    // Sombra accesible y suave
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      },
      default: {
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  tarjetaSeleccionada: {
    borderWidth: 4,
    transform: [{ scale: 1.03 }],
  },
  avatarContenedor: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  foto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  iconoAvatar: {
    fontSize: 48,
    textAlign: "center",
  },
  nombreLecturaFacil: {
    // Tipografía clara para Lectura Fácil (RNF1.1)
    fontSize: 18,
    fontWeight: "700",
    color: "#1A202C",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
