// Elegir el tutor de aula o la familia de un estudiante con botones grandes (SCRUM-61).
// Mejora de la profesora (noviembre de 2026): ya no es una ventana emergente. La consola de vínculos
// la enseña como una pantalla más, con el nombre arriba y «Atrás» abajo para salir sin cambiar nada.
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { Supervisor } from "../../servicios/vinculosService";
import type { Paleta } from "../../temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../ui";

type Props = {
  opciones: Supervisor[];
  /** id del supervisor elegido ahora mismo (null si no hay). */
  actualId: string | null;
  /** Texto de la opción «nadie» (p. ej. «Sin familia»). Si no se pasa, no se ofrece. */
  textoSinAsignar?: string;
  guardando: boolean;
  error: string | null;
  alElegir: (supervisorId: string | null) => void;
};

/** Lista para elegir un tutor de aula o una familia con botones grandes (SCRUM-61). */
export function ElegirSupervisor({
  opciones,
  actualId,
  textoSinAsignar,
  guardando,
  error,
  alElegir,
}: Props) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const lista: { id: string | null; nombre: string }[] = [
    ...opciones,
    ...(textoSinAsignar ? [{ id: null, nombre: textoSinAsignar }] : []),
  ];

  return (
    <View style={estilos.caja}>
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
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    caja: {
      flex: 1,
      width: "100%",
      maxWidth: 640,
      alignSelf: "center",
      padding: 20,
      gap: 12,
    },
    lista: { flexGrow: 0 },
    opcion: {
      minHeight: 64,
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
    textoOpcion: { fontSize: 20, color: c.texto },
    textoElegida: { fontWeight: "700" },
    estado: { fontSize: 16, color: c.textoSecundario },
    filaError: { flexDirection: "row", alignItems: "center", gap: 8 },
    error: { flexShrink: 1, fontSize: 16, fontWeight: "700", color: c.peligro },
  });
