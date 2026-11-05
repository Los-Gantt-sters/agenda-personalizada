import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from "react-native";
import {
  DIBUJOS_CREDENCIAL_VISUAL,
  DibujoCredencialVisual,
  Estudiante,
  LONGITUD_SECUENCIA_DIBUJOS,
} from "../../tipos/estudiante";

export interface ModalConfirmacionEstudianteProps {
  estudiante: Estudiante | null;
  visible: boolean;
  /**
   * Callback invocado cuando el alumno completa sus 3 dibujos (o confirma directamente).
   * Recibe el estudiante y el array con los 3 slugs de dibujos seleccionados (ej. ['manzana', 'perro', 'estrella']).
   */
  alConfirmar: (estudiante: Estudiante, secuenciaDibujos: string[]) => void;
  alCancelar: () => void;
  /** Mensaje de error opcional si la secuencia de 3 dibujos no coincide. */
  mensajeError?: string | null;
  /** Catálogo personalizable de dibujos (por defecto los 9 del prototipo 03-estudiante-contrasena.html). */
  opcionesDibujos?: DibujoCredencialVisual[];
}

export const ModalConfirmacionEstudiante: React.FC<ModalConfirmacionEstudianteProps> = ({
  estudiante,
  visible,
  alConfirmar,
  alCancelar,
  mensajeError,
  opcionesDibujos = DIBUJOS_CREDENCIAL_VISUAL,
}) => {
  const [estadoSecuencia, setEstadoSecuencia] = useState<{
    alumnoId: string | null;
    dibujos: string[];
  }>({
    alumnoId: null,
    dibujos: [],
  });

  if (!estudiante) return null;

  const secuenciaSeleccionada =
    visible && estadoSecuencia.alumnoId === estudiante.id ? estadoSecuencia.dibujos : [];

  const obtenerIconoPorSlug = (slug: string): string => {
    const encontrado = opcionesDibujos.find((d) => d.slug === slug);
    return encontrado ? encontrado.icono : "●";
  };

  const manejarToqueDibujo = (slug: string) => {
    if (secuenciaSeleccionada.length >= LONGITUD_SECUENCIA_DIBUJOS) {
      return;
    }
    const nuevaSecuencia = [...secuenciaSeleccionada, slug];
    setEstadoSecuencia({
      alumnoId: estudiante.id,
      dibujos: nuevaSecuencia,
    });

    if (nuevaSecuencia.length === LONGITUD_SECUENCIA_DIBUJOS) {
      alConfirmar(estudiante, nuevaSecuencia);
    }
  };

  const manejarBorrarUltimo = () => {
    setEstadoSecuencia({
      alumnoId: estudiante.id,
      dibujos: secuenciaSeleccionada.slice(0, -1),
    });
  };

  const manejarCancelar = () => {
    setEstadoSecuencia({ alumnoId: null, dibujos: [] });
    alCancelar();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={manejarCancelar}
      testID="modal-confirmacion-estudiante"
    >
      <View style={estilos.fondoOscurecido}>
        <View
          style={estilos.cajaModal}
          accessibilityRole="alert"
          accessibilityLabel={`Credencial visual de ${estudiante.nombre}. Toca tus 3 dibujos en orden`}
        >
          {/* Barra superior con identidad del alumno y botón "No soy yo" */}
          <View style={estilos.barraSuperior}>
            <View style={estilos.identidadAlumno}>
              <View
                style={[
                  estilos.avatarCabecera,
                  {
                    backgroundColor: estudiante.color ? `${estudiante.color}20` : "#EDF2F7",
                    borderColor: estudiante.color || "#3182CE",
                  },
                ]}
              >
                <Text style={estilos.iconoAvatar}>{estudiante.icono}</Text>
              </View>
              <Text style={estilos.nombreAlumno}>{estudiante.nombre}</Text>
            </View>

            <TouchableOpacity
              style={estilos.botonNoSoyYo}
              accessibilityRole="button"
              accessibilityLabel="No soy yo, volver a la lista de clase"
              testID="btn-cancelar-estudiante"
              onPress={manejarCancelar}
            >
              <Text style={estilos.textoNoSoyYo}>⬅ No soy yo</Text>
            </TouchableOpacity>
          </View>

          <Text style={estilos.pregunta}>¿Eres {estudiante.nombre}?</Text>
          <Text style={estilos.instruccion}>🔑 Toca tus 3 dibujos en orden</Text>

          {/* 3 huecos de progreso de la secuencia */}
          <View
            style={estilos.contenedorHuecos}
            accessibilityLabel={`${secuenciaSeleccionada.length} de ${LONGITUD_SECUENCIA_DIBUJOS} dibujos seleccionados`}
            testID="huecos-secuencia-dibujos"
          >
            {[0, 1, 2].map((indice) => {
              const slugElegido = secuenciaSeleccionada[indice];
              const esSiguiente = indice === secuenciaSeleccionada.length;
              return (
                <View
                  key={indice}
                  testID={`hueco-dibujo-${indice}`}
                  style={[
                    estilos.huecoDibujo,
                    slugElegido ? estilos.huecoCompletado : null,
                    esSiguiente ? estilos.huecoSiguiente : null,
                  ]}
                >
                  <Text style={estilos.iconoHueco}>
                    {slugElegido ? obtenerIconoPorSlug(slugElegido) : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          {mensajeError ? (
            <View style={estilos.bannerError} testID="error-credencial-visual">
              <Text style={estilos.textoError}>⚠️ {mensajeError}</Text>
            </View>
          ) : null}

          {/* Cuadrícula táctil de los 9 dibujos */}
          <View style={estilos.cuadriculaDibujos} testID="cuadricula-dibujos-credencial">
            {opcionesDibujos.map((dibujo) => (
              <TouchableOpacity
                key={dibujo.slug}
                style={estilos.botonDibujo}
                accessibilityRole="button"
                accessibilityLabel={`Dibujo ${dibujo.etiqueta}`}
                testID={`dibujo-credencial-${dibujo.slug}`}
                onPress={() => manejarToqueDibujo(dibujo.slug)}
              >
                <Text style={estilos.iconoDibujo}>{dibujo.icono}</Text>
                <Text style={estilos.etiquetaDibujo}>{dibujo.etiqueta}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fila inferior de acciones auxiliares */}
          <View style={estilos.botonesFila}>
            <TouchableOpacity
              style={[
                estilos.botonAccion,
                estilos.botonBorrar,
                secuenciaSeleccionada.length === 0 ? estilos.botonDeshabilitado : null,
              ]}
              disabled={secuenciaSeleccionada.length === 0}
              accessibilityRole="button"
              accessibilityLabel="Borrar último dibujo"
              testID="btn-borrar-dibujo"
              onPress={manejarBorrarUltimo}
            >
              <Text style={estilos.textoBotonBorrar}>⌫ Borrar dibujo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[estilos.botonAccion, estilos.botonConfirmar]}
              accessibilityRole="button"
              accessibilityLabel={`Sí, soy ${estudiante.nombre}`}
              testID="btn-confirmar-estudiante"
              onPress={() =>
                alConfirmar(
                  estudiante,
                  secuenciaSeleccionada.length === LONGITUD_SECUENCIA_DIBUJOS
                    ? secuenciaSeleccionada
                    : (estudiante.secuenciaDibujosDemo ?? ["manzana", "perro", "estrella"]),
                )
              }
            >
              <Text style={estilos.textoBotonConfirmar}>✓ Sí, soy yo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const estilos = StyleSheet.create({
  fondoOscurecido: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cajaModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    maxWidth: 560,
    width: "100%",
    borderWidth: 4,
    borderColor: "#CBD5E0",
    ...Platform.select({
      web: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25)",
      },
      default: {
        elevation: 8,
      },
    }),
  },
  barraSuperior: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    gap: 12,
  },
  identidadAlumno: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCabecera: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  iconoAvatar: {
    fontSize: 30,
  },
  nombreAlumno: {
    fontSize: 22,
    fontWeight: "800",
    color: "#14213D",
  },
  botonNoSoyYo: {
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#EDF2F7",
    borderWidth: 2,
    borderColor: "#CBD5E0",
    justifyContent: "center",
    alignItems: "center",
  },
  textoNoSoyYo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3748",
  },
  pregunta: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 4,
  },
  instruccion: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F5FA8",
    textAlign: "center",
    marginBottom: 14,
  },
  contenedorHuecos: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
    marginBottom: 16,
  },
  huecoDibujo: {
    width: 68,
    height: 68,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#CBD5E0",
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  huecoCompletado: {
    borderColor: "#2B7A4B",
    backgroundColor: "#E6F4EA",
  },
  huecoSiguiente: {
    borderColor: "#1F5FA8",
    borderWidth: 4,
    backgroundColor: "#E3EDFB",
  },
  iconoHueco: {
    fontSize: 34,
  },
  bannerError: {
    backgroundColor: "#FFF5F5",
    borderColor: "#C53030",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    width: "100%",
  },
  textoError: {
    color: "#9B2C2C",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  cuadriculaDibujos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    width: "100%",
    marginBottom: 18,
  },
  botonDibujo: {
    minWidth: 96,
    minHeight: 96,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#A0AEC0",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  iconoDibujo: {
    fontSize: 40,
    marginBottom: 4,
  },
  etiquetaDibujo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
  },
  botonesFila: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  botonAccion: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  botonBorrar: {
    backgroundColor: "#EDF2F7",
    borderWidth: 2,
    borderColor: "#A0AEC0",
  },
  botonDeshabilitado: {
    opacity: 0.45,
  },
  textoBotonBorrar: {
    color: "#2D3748",
    fontSize: 16,
    fontWeight: "700",
  },
  botonConfirmar: {
    backgroundColor: "#2E7D32",
  },
  textoBotonConfirmar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
