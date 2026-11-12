// Panel de inicio de los adultos (tutor docente y familia): accesos grandes en cuadrícula, el primero
// destacado, dentro de la pantalla común (cabecera + barra inferior) y sin scroll.
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";

import type { Paleta } from "../temas";
import { useApariencia, useEstilos } from "../ui/apariencia";
import { Icono, type NombreIcono } from "../ui/Icono";
import { Texto } from "../ui/Texto";
import { Pantalla } from "./Pantalla";

export interface AccesoPanel {
  icono: NombreIcono;
  titulo: string;
  descripcion: string;
  etiquetaAccesible: string;
  alPulsar: () => void;
}

export function PanelAdulto({
  titulo,
  saludo,
  accesos,
  alCerrarSesion,
  etiquetaCerrarSesion = "Cerrar sesión",
}: {
  /** Nombre de la pantalla en la cabecera («Panel del tutor»). */
  titulo: string;
  /** Saludo con el nombre de la persona. */
  saludo: string;
  /** El primero es el acceso principal y va destacado. */
  accesos: AccesoPanel[];
  alCerrarSesion: () => void;
  etiquetaCerrarSesion?: string;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const { width } = useWindowDimensions();
  const dosColumnas = width >= 700;

  return (
    <Pantalla
      titulo={titulo}
      simbolo={<Icono nombre="persona" color={colores.primario} tam={32} />}
      derecha={
        <TouchableOpacity
          style={e.salir}
          onPress={alCerrarSesion}
          accessibilityRole="button"
          accessibilityLabel={etiquetaCerrarSesion}
        >
          <Icono nombre="salir" color={colores.texto} tam={22} />
          <Texto style={e.salirTexto}>Cerrar sesión</Texto>
        </TouchableOpacity>
      }
    >
      <View style={e.columna}>
        <Texto style={e.saludo}>{saludo}</Texto>
        <View style={e.lista}>
          {accesos.map((a, i) => {
            const principal = i === 0;
            const colorIcono = principal ? colores.textoSobrePrimario : colores.primario;
            return (
              <TouchableOpacity
                key={a.titulo}
                style={[
                  e.acceso,
                  dosColumnas ? e.accesoMitad : null,
                  principal && e.accesoPrincipal,
                ]}
                onPress={a.alPulsar}
                accessibilityRole="button"
                accessibilityLabel={a.etiquetaAccesible}
              >
                <Icono nombre={a.icono} color={colorIcono} tam={34} />
                <View style={e.textos}>
                  <Texto style={[e.accesoTitulo, principal && e.textoPrincipal]}>{a.titulo}</Texto>
                  <Texto
                    style={[e.accesoDescripcion, principal && e.textoPrincipal]}
                    numberOfLines={2}
                  >
                    {a.descripcion}
                  </Texto>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    columna: { flex: 1, width: "100%", maxWidth: 980, alignSelf: "center", padding: 20, gap: 16 },
    saludo: { fontSize: 22, fontWeight: "700", color: c.texto },
    lista: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
    acceso: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      minHeight: 92,
      paddingVertical: 14,
      paddingHorizontal: 18,
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 14,
    },
    accesoMitad: { width: "48.9%" },
    accesoPrincipal: { backgroundColor: c.primario, borderColor: c.primario },
    textos: { flex: 1, gap: 2 },
    accesoTitulo: { fontSize: 19, fontWeight: "700", color: c.texto },
    accesoDescripcion: { fontSize: 15, color: c.textoSecundario },
    textoPrincipal: { color: c.textoSobrePrimario },
    salir: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 48,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    salirTexto: { fontSize: 16, fontWeight: "700", color: c.texto },
  });
