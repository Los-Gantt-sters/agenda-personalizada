import React from "react";
import { TouchableOpacity, Text, View, StyleSheet, Image, Platform } from "react-native";
import type { Paleta } from "../../temas";
import { Texto, useApariencia, useEstilos } from "../../ui";
import { Estudiante } from "../../tipos/estudiante";
import { reproducirSonido } from "../../servicios/sonidos";

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
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

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
          borderColor: seleccionado ? colores.primario : colores.borde,
          backgroundColor: seleccionado ? colores.superficieDestacada : colores.superficie,
        },
        seleccionado && estilos.tarjetaSeleccionada,
      ]}
      onPress={() => {
        reproducirSonido("toque"); // T-01.3: feedback sonoro al pulsar
        alSeleccionar(estudiante);
      }}
    >
      <View
        style={[
          estilos.avatarContenedor,
          {
            // Fondo blanco para que el dibujo se vea en cualquier tema; el aro, del color del alumno
            backgroundColor: "#FFFFFF",
            borderColor: estudiante.color || colores.borde,
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

      <Texto style={estilos.nombreLecturaFacil} numberOfLines={2} adjustsFontSizeToFit>
        {estudiante.nombre}
      </Texto>
    </TouchableOpacity>
  );
};

// Sin sombras: la tarjeta se distingue por su borde (3:1). La elegida, por el borde granate de 4 px.
const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    tarjeta: {
      // RNF1.1: Al menos 120x120 px
      minWidth: 140,
      minHeight: 140,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      margin: 8,
      ...Platform.select({
        web: { cursor: "pointer", userSelect: "none" },
        default: {},
      }),
    },
    tarjetaSeleccionada: {
      borderWidth: 4,
    },
    avatarContenedor: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 3,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    foto: {
      width: 84,
      height: 84,
      borderRadius: 42,
    },
    iconoAvatar: {
      fontSize: 48,
      textAlign: "center",
    },
    nombreLecturaFacil: {
      // Tipografía clara para Lectura Fácil (RNF1.1)
      fontSize: 20,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
  });
