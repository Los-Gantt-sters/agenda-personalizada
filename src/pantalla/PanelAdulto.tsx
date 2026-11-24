// Panel de inicio de los adultos (tutor docente 33 y familia 34): accesos grandes en cuadrícula 2x3,
// el primero destacado en color primario, soporte de tarjeta de alerta SOS con borde rojo e insignia
// («Push · 1 sin leer»), chip de usuario con iniciales y botón «Salir» en cabecera (SCRUM-228 / SCRUM-244).
import React from "react";
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";

import type { Paleta } from "../temas";
import { useApariencia, useEstilos } from "../ui/apariencia";
import { Icono, type NombreIcono } from "../ui/Icono";
import { Texto } from "../ui/Texto";
import { Pantalla } from "./Pantalla";

export interface AccesoPanel {
  id?: string;
  testID?: string;
  icono: NombreIcono;
  titulo: string;
  descripcion: string;
  etiquetaAccesible: string;
  /** Si es `true`, aplica fondo rojizo y borde rojo de 3px (ej. Alertas SOS con push sin leer en 33.html). */
  alertaActiva?: boolean;
  /** Texto opcional para píldora/insignia a la derecha del título (ej. «Push · 1 sin leer»). */
  insigniaTexto?: string;
  alPulsar: () => void;
}

export interface PanelAdultoProps {
  /** Nombre de la pantalla en la cabecera («Panel de control · Tutor» o «Panel de control · Familia»). */
  titulo: string;
  /** Saludo con el nombre de la persona debajo de la cabecera. */
  saludo: string;
  /** El primero es el acceso principal y va destacado en color primario. */
  accesos: AccesoPanel[];
  /** Acción al pulsar el botón «Salir» de la cabecera. */
  alCerrarSesion: () => void;
  /** Etiqueta de accesibilidad del botón de salida. */
  etiquetaCerrarSesion?: string;
  /** Texto visible en el botón de salida (`"Salir"` según 33.html y 34.html). */
  textoCerrarSesion?: string;
  /** Icono de la cabecera (`"persona"` en Tutor 33, `"casa"` en Familia 34). */
  iconoCabecera?: NombreIcono;
  /** Nombre del usuario autenticado para mostrar en la píldora de cabecera (`"Carmen Ruiz"`, `"Familia García"`). */
  nombreUsuario?: string;
  /** Iniciales del avatar en la píldora de cabecera (`"CR"`, `"FG"`). */
  inicialesUsuario?: string;
  /** Identificador de prueba del contenedor principal (`pantalla-33-panel-tutor` o `pantalla-34-panel-familia`). */
  testID?: string;
}

export function PanelAdulto({
  titulo,
  saludo,
  accesos,
  alCerrarSesion,
  etiquetaCerrarSesion = "Salir",
  textoCerrarSesion = "Salir",
  iconoCabecera = "persona",
  nombreUsuario,
  inicialesUsuario,
  testID,
}: PanelAdultoProps) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const { width } = useWindowDimensions();
  const dosColumnas = width >= 700 || width === 0;

  const derecha = (
    <View style={e.cabeceraDerecha}>
      {nombreUsuario ? (
        <View style={e.chipUsuario} testID="chip-usuario-panel-adulto">
          <View style={e.avatarUsuario}>
            <Texto style={e.avatarTexto}>
              {inicialesUsuario ??
                nombreUsuario
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("")}
            </Texto>
          </View>
          <Texto style={e.nombreUsuarioTexto}>{nombreUsuario}</Texto>
        </View>
      ) : null}
      <TouchableOpacity
        testID="boton-salir-panel-adulto"
        style={e.salir}
        onPress={alCerrarSesion}
        accessibilityRole="button"
        accessibilityLabel={etiquetaCerrarSesion}
      >
        <Icono nombre="salir" color={colores.texto} tam={18} />
        <Texto style={e.salirTexto}>{textoCerrarSesion}</Texto>
      </TouchableOpacity>
    </View>
  );

  return (
    <Pantalla
      titulo={titulo}
      simbolo={<Icono nombre={iconoCabecera} color={colores.primario} tam={30} />}
      derecha={derecha}
      sinAyuda
    >
      <View style={e.columna} testID={testID}>
        <Texto style={e.saludo}>{saludo}</Texto>
        <View style={e.lista}>
          {accesos.map((a, i) => {
            const principal = i === 0;
            const enAlerta = Boolean(a.alertaActiva);
            const colorIcono = principal
              ? colores.textoSobrePrimario
              : enAlerta
                ? colores.peligro
                : colores.primario;
            return (
              <TouchableOpacity
                key={a.id ?? a.titulo}
                testID={a.testID}
                style={[
                  e.acceso,
                  dosColumnas ? e.accesoMitad : null,
                  principal && e.accesoPrincipal,
                  enAlerta && e.accesoAlerta,
                ]}
                onPress={a.alPulsar}
                accessibilityRole="button"
                accessibilityLabel={a.etiquetaAccesible}
              >
                <Icono nombre={a.icono} color={colorIcono} tam={32} />
                <View style={e.textos}>
                  <View style={e.filaTitulo}>
                    <Texto style={[e.accesoTitulo, principal && e.textoPrincipal]}>
                      {a.titulo}
                    </Texto>
                    {a.insigniaTexto ? (
                      <View
                        style={[e.pildoraInsignia, enAlerta && e.pildoraInsigniaAlerta]}
                        testID={a.testID ? `${a.testID}-badge` : undefined}
                      >
                        <Texto
                          style={[e.textoPildoraInsignia, enAlerta && e.textoPildoraInsigniaAlerta]}
                        >
                          {a.insigniaTexto}
                        </Texto>
                      </View>
                    ) : null}
                  </View>
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
    columna: {
      flex: 1,
      width: "100%",
      maxWidth: 980,
      alignSelf: "center",
      padding: 20,
      gap: 14,
    },
    saludo: {
      fontSize: 23,
      fontWeight: "700",
      color: c.texto,
    },
    lista: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },
    acceso: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      minHeight: 96,
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 12,
    },
    accesoMitad: {
      width: "48.9%",
    },
    accesoPrincipal: {
      backgroundColor: c.primario,
      borderColor: c.primario,
    },
    accesoAlerta: {
      backgroundColor: "#FDECEC",
      borderWidth: 3,
      borderColor: c.peligro,
    },
    textos: {
      flex: 1,
      gap: 2,
    },
    filaTitulo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      flexWrap: "wrap",
    },
    accesoTitulo: {
      fontSize: 21,
      fontWeight: "700",
      color: c.texto,
    },
    accesoDescripcion: {
      fontSize: 14,
      color: c.textoSecundario,
    },
    textoPrincipal: {
      color: c.textoSobrePrimario,
    },
    pildoraInsignia: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    pildoraInsigniaAlerta: {
      backgroundColor: "#FDECEC",
      borderColor: c.peligro,
    },
    textoPildoraInsignia: {
      fontSize: 12,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    textoPildoraInsigniaAlerta: {
      color: c.peligro,
    },
    cabeceraDerecha: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    chipUsuario: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      height: 46,
      paddingLeft: 5,
      paddingRight: 14,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    avatarUsuario: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarTexto: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primario,
    },
    nombreUsuarioTexto: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    salir: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    salirTexto: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
  });
