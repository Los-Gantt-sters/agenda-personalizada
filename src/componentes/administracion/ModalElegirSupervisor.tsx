import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { Supervisor } from "../../servicios/vinculosService";
import type { Paleta } from "../../temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../ui";

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
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const lista: { id: string | null; nombre: string }[] = [
    ...opciones,
    ...(textoSinAsignar ? [{ id: null, nombre: textoSinAsignar }] : []),
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={alCerrar}>
      <View style={estilos.fondoOscuro}>
        <View style={estilos.caja} accessibilityViewIsModal>
          <Texto style={estilos.titulo} accessibilityRole="header">
            {titulo}
          </Texto>

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
                  {elegida && <Icono nombre="check" color={colores.primario} tam={22} grosor={3} />}
                  <Texto style={[estilos.textoOpcion, elegida && estilos.textoElegida]}>
                    {opcion.nombre}
                  </Texto>
                </Pressable>
              );
            })}
          </ScrollView>

          {guardando && <Texto style={estilos.estado}>Guardando…</Texto>}
          {error && (
            <View style={estilos.filaError}>
              <Icono nombre="alerta" color={colores.peligro} tam={22} />
              <Texto style={estilos.error} accessibilityRole="alert">
                {error}
              </Texto>
            </View>
          )}

          <Pressable
            style={estilos.botonCerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sin cambiar"
            onPress={alCerrar}
          >
            <Texto style={estilos.textoBotonCerrar}>Cerrar</Texto>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    fondoOscuro: {
      flex: 1,
      backgroundColor: "rgba(34, 33, 31, 0.6)",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    caja: {
      width: "100%",
      maxWidth: 520,
      maxHeight: "90%",
      backgroundColor: c.superficie,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.borde,
      padding: 20,
      gap: 12,
    },
    titulo: { fontSize: 22, fontWeight: "700", color: c.texto },
    lista: { flexGrow: 0 },
    opcion: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    opcionElegida: {
      borderColor: c.primario,
      borderWidth: 3,
      backgroundColor: c.superficieDestacada,
    },
    textoOpcion: { fontSize: 18, color: c.texto },
    textoElegida: { fontWeight: "700" },
    estado: { fontSize: 16, color: c.textoSecundario },
    filaError: { flexDirection: "row", alignItems: "center", gap: 8 },
    error: { flexShrink: 1, fontSize: 16, fontWeight: "700", color: c.peligro },
    botonCerrar: {
      minHeight: 48,
      alignSelf: "flex-end",
      justifyContent: "center",
      paddingHorizontal: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
    },
    textoBotonCerrar: { fontSize: 16, fontWeight: "700", color: c.texto },
  });
