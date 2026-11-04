import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CLASES, ESTUDIANTES_MOCK, Estudiante, Clase } from "../src/tipos/estudiante";
import {
  CuadriculaEstudiantes,
  ModalConfirmacionEstudiante,
} from "../src/componentes/autenticacion";

export default function LoginEstudiantesScreen() {
  const router = useRouter();
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null);
  const [estudiantePendiente, setEstudiantePendiente] = useState<Estudiante | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Filtrar estudiantes por clase seleccionada
  const estudiantesDeClase = claseSeleccionada
    ? ESTUDIANTES_MOCK.filter((s) => s.claseId === claseSeleccionada.id)
    : [];

  const handleSeleccionarEstudiante = (estudiante: Estudiante) => {
    setEstudiantePendiente(estudiante);
    setModalVisible(true);
  };

  const handleConfirmarEstudiante = (_estudiante: Estudiante) => {
    setModalVisible(false);
    // Simula acceso exitoso a la agenda del estudiante (o ruta de agenda según arquitectura)
    router.push("/demo-reloj");
  };

  const handleCancelarConfirmacion = () => {
    setModalVisible(false);
    setEstudiantePendiente(null);
  };

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <View style={estilos.contenedor}>
        {/* Cabecera / Paso */}
        {!claseSeleccionada ? (
          <View style={estilos.cabecera}>
            <Text style={estilos.iconoPrincipal} accessibilityElementsHidden>
              🏫
            </Text>
            <Text style={estilos.titulo}>¿Cuál es tu clase?</Text>
            <Text style={estilos.subtituloLecturaFacil}>Toca la forma o el color de tu clase</Text>

            <View style={estilos.cuadriculaClases} testID="selector-clases-estudiante">
              {Object.values(CLASES).map((clase) => (
                <TouchableOpacity
                  key={clase.id}
                  style={estilos.tarjetaClase}
                  accessibilityRole="button"
                  accessibilityLabel={`Clase ${clase.nombre}`}
                  testID={`tarjeta-clase-${clase.id}`}
                  onPress={() => setClaseSeleccionada(clase)}
                >
                  <Text style={estilos.simboloClase}>{clase.simbolo}</Text>
                  <Text style={estilos.nombreClase}>Clase {clase.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={estilos.botonVolverInicio}
              onPress={() => router.push("/")}
              accessibilityRole="button"
              accessibilityLabel="Volver a la pantalla de bienvenida"
            >
              <Text style={estilos.textoBotonVolver}>⬅ Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={estilos.contenedorClase}>
            <View style={estilos.barraSuperiorClase}>
              <View style={estilos.infoClaseActual}>
                <Text style={estilos.simboloPequeno} accessibilityElementsHidden>
                  {claseSeleccionada.simbolo}
                </Text>
                <Text style={estilos.tituloClaseActual}>Clase {claseSeleccionada.nombre}</Text>
              </View>

              <TouchableOpacity
                style={estilos.botonCambiarClase}
                onPress={() => {
                  setClaseSeleccionada(null);
                  setEstudiantePendiente(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Cambiar de clase"
                testID="btn-cambiar-clase"
              >
                <Text style={estilos.textoCambiarClase}>⬅ Cambiar de clase</Text>
              </TouchableOpacity>
            </View>

            <View style={estilos.bannerInstruccion}>
              <Text style={estilos.iconoDedo} accessibilityElementsHidden>
                👆
              </Text>
              <Text style={estilos.textoInstruccion}>Busca tu dibujo o foto y tócalo</Text>
            </View>

            {/* Cuadrícula accesible de estudiantes */}
            <CuadriculaEstudiantes
              estudiantes={estudiantesDeClase}
              alSeleccionarEstudiante={handleSeleccionarEstudiante}
              estudianteSeleccionadoId={estudiantePendiente?.id}
              tamanioMinimoTarjeta={140}
            />
          </View>
        )}

        {/* Modal de confirmación al pulsar fotografía (RF1.7) */}
        <ModalConfirmacionEstudiante
          estudiante={estudiantePendiente}
          visible={modalVisible}
          alConfirmar={handleConfirmarEstudiante}
          alCancelar={handleCancelarConfirmacion}
        />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  contenedor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 16,
    width: "100%",
  },
  cabecera: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 600,
    width: "100%",
    marginTop: 20,
  },
  iconoPrincipal: {
    fontSize: 54,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A365D",
    textAlign: "center",
    marginBottom: 6,
  },
  subtituloLecturaFacil: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A5568",
    textAlign: "center",
    marginBottom: 28,
  },
  cuadriculaClases: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    width: "100%",
    marginBottom: 32,
  },
  tarjetaClase: {
    minWidth: 150,
    minHeight: 140, // >= 120px
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 12,
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      },
      default: {
        elevation: 2,
      },
    }),
  },
  simboloClase: {
    fontSize: 50,
  },
  nombreClase: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
  },
  botonVolverInicio: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#EDF2F7",
    borderWidth: 1,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonVolver: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5568",
  },
  contenedorClase: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  barraSuperiorClase: {
    width: "100%",
    maxWidth: 900,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#E2E8F0",
    flexWrap: "wrap",
    gap: 12,
  },
  infoClaseActual: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  simboloPequeno: {
    fontSize: 28,
  },
  tituloClaseActual: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A365D",
  },
  botonCambiarClase: {
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  textoCambiarClase: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4A5568",
  },
  bannerInstruccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "#EBF8FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#BEE3F8",
  },
  iconoDedo: {
    fontSize: 24,
  },
  textoInstruccion: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2B6CB0",
  },
});
