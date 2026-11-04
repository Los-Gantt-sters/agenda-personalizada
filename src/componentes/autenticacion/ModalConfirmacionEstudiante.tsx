import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from "react-native";
import { Estudiante } from "../../tipos/estudiante";

export interface ModalConfirmacionEstudianteProps {
  estudiante: Estudiante | null;
  visible: boolean;
  alConfirmar: (estudiante: Estudiante) => void;
  alCancelar: () => void;
}

export const ModalConfirmacionEstudiante: React.FC<ModalConfirmacionEstudianteProps> = ({
  estudiante,
  visible,
  alConfirmar,
  alCancelar,
}) => {
  if (!estudiante) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={alCancelar}
      testID="modal-confirmacion-estudiante"
    >
      <View style={estilos.fondoOscurecido}>
        <View
          style={estilos.cajaModal}
          accessibilityRole="alert"
          accessibilityLabel={`¿Eres ${estudiante.nombre}?`}
        >
          <View
            style={[
              estilos.avatarGrande,
              {
                backgroundColor: estudiante.color ? `${estudiante.color}20` : "#EDF2F7",
                borderColor: estudiante.color || "#3182CE",
              },
            ]}
          >
            <Text style={estilos.iconoAvatar}>{estudiante.icono}</Text>
          </View>

          <Text style={estilos.pregunta}>¿Eres {estudiante.nombre}?</Text>

          <View style={estilos.botonesFila}>
            <TouchableOpacity
              style={[estilos.boton, estilos.botonConfirmar]}
              accessibilityRole="button"
              accessibilityLabel={`Sí, soy ${estudiante.nombre}`}
              testID="btn-confirmar-estudiante"
              onPress={() => alConfirmar(estudiante)}
            >
              <Text style={estilos.textoBotonConfirmar}>✓ Sí, soy yo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[estilos.boton, estilos.botonCancelar]}
              accessibilityRole="button"
              accessibilityLabel="No, no soy yo"
              testID="btn-cancelar-estudiante"
              onPress={alCancelar}
            >
              <Text style={estilos.textoBotonCancelar}>✗ No</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cajaModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    maxWidth: 440,
    width: "100%",
    borderWidth: 4,
    borderColor: "#E2E8F0",
    ...Platform.select({
      web: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
      },
      default: {
        elevation: 8,
      },
    }),
  },
  avatarGrande: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconoAvatar: {
    fontSize: 70,
  },
  pregunta: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 28,
  },
  botonesFila: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    justifyContent: "center",
  },
  boton: {
    minHeight: 56, // >= 48px para accesibilidad
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  botonConfirmar: {
    backgroundColor: "#2E7D32", // Verde accesible
  },
  textoBotonConfirmar: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  botonCancelar: {
    backgroundColor: "#EDF2F7",
    borderWidth: 2,
    borderColor: "#CBD5E0",
  },
  textoBotonCancelar: {
    color: "#4A5568",
    fontSize: 18,
    fontWeight: "700",
  },
});
