import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { Supervisor } from "../../servicios/vinculosService";

// Contraste sobre blanco: tinta 15,97:1 · secundario 7,35:1 · error 6,57:1 · éxito 6,52:1.
// Los bordes de los botones usan «secundario» para llegar al 3:1 de WCAG 1.4.11.
export const COLORES_CONSOLA = {
  fondo: "#f4f7fb",
  tarjeta: "#ffffff",
  tinta: "#14213d",
  secundario: "#4a5670",
  primario: "#1f5fa8",
  linea: "#c6d1e2",
  error: "#b42318",
  exito: "#1e6b3a",
};

type Props = {
  visible: boolean;
  titulo: string;
  opciones: Supervisor[];
  /** id del supervisor elegido ahora mismo (null si no hay). */
  actualId: string | null;
  /** Texto de la opción «nadie» (p. ej. «Sin familia»). Si no se pasa, no se ofrece. */
  textoSinAsignar?: string;
  guardando: boolean;
  error: string | null;
  alElegir: (supervisorId: string | null) => void;
  alCerrar: () => void;
};

/** Ventana para elegir un tutor de aula o una familia con botones grandes (SCRUM-61). */
export function ModalElegirSupervisor({
  visible,
  titulo,
  opciones,
  actualId,
  textoSinAsignar,
  guardando,
  error,
  alElegir,
  alCerrar,
}: Props) {
  const lista: { id: string | null; nombre: string }[] = [
    ...opciones,
    ...(textoSinAsignar ? [{ id: null, nombre: textoSinAsignar }] : []),
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={alCerrar}>
      <View style={estilos.fondoOscuro}>
        <View style={estilos.caja} accessibilityViewIsModal>
          <Text style={estilos.titulo} accessibilityRole="header">
            {titulo}
          </Text>

          <ScrollView style={estilos.lista} accessibilityRole="radiogroup">
            {lista.map((opcion) => {
              const elegida = opcion.id === actualId;
              return (
                <Pressable
                  key={opcion.id ?? "ninguno"}
                  style={[estilos.opcion, elegida && estilos.opcionElegida]}
                  accessibilityRole="radio"
                  accessibilityLabel={opcion.nombre}
                  accessibilityState={{ checked: elegida, disabled: guardando }}
                  disabled={guardando}
                  onPress={() => alElegir(opcion.id)}
                >
                  <Text style={estilos.textoOpcion}>
                    {elegida ? "✓ " : ""}
                    {opcion.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {guardando && <Text style={estilos.estado}>Guardando…</Text>}
          {error && (
            <Text style={estilos.error} accessibilityRole="alert">
              ⚠️ {error}
            </Text>
          )}

          <Pressable
            style={estilos.botonCerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sin cambiar"
            onPress={alCerrar}
          >
            <Text style={estilos.textoBotonCerrar}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondoOscuro: {
    flex: 1,
    backgroundColor: "rgba(20, 33, 61, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  caja: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    backgroundColor: COLORES_CONSOLA.tarjeta,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  titulo: { fontSize: 22, fontWeight: "700", color: COLORES_CONSOLA.tinta },
  lista: { flexGrow: 0 },
  opcion: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORES_CONSOLA.secundario,
    backgroundColor: COLORES_CONSOLA.tarjeta,
  },
  opcionElegida: { borderColor: COLORES_CONSOLA.primario, borderWidth: 3 },
  textoOpcion: { fontSize: 18, color: COLORES_CONSOLA.tinta },
  estado: { fontSize: 16, color: COLORES_CONSOLA.secundario },
  error: { fontSize: 16, fontWeight: "700", color: COLORES_CONSOLA.error },
  botonCerrar: {
    minHeight: 48,
    alignSelf: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORES_CONSOLA.secundario,
  },
  textoBotonCerrar: { fontSize: 16, fontWeight: "700", color: COLORES_CONSOLA.tinta },
});
