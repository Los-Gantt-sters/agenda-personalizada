/**
 * Pantalla 54 — Cocina · Parte del día
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/54.html`
 * para el destino de login automático del rol `cocina` (SCRUM-228 / SCRUM-244 · T-02.5).
 */

import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";

export interface ParteCocina54Props {
  /** Nombre del perfil de cocina en cabecera (`"Cocina Central"` por defecto). */
  nombreUsuario?: string;
  /** Fecha mostrada en cabecera (`"Jueves, 12 de noviembre"` por defecto). */
  fechaTexto?: string;
  /** Recuento de menú normal (`28` por defecto). */
  menuNormal?: number;
  /** Recuento de menú triturado (`4` por defecto). */
  triturado?: number;
  /** Recuento de menú sin gluten (`2` por defecto). */
  sinGluten?: number;
  /** Acción al pulsar «Atrás» o «Salir» (-> Pantalla 05 `/login`). */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 54 (Cocina · Parte del día) tras el inicio de sesión con rol `cocina`.
 * @param props Propiedades del parte diario de cocina
 * @returns Vista de resumen de comensales por dieta y confirmación del parte
 */
export function ParteCocina54({
  nombreUsuario = "Cocina Central",
  fechaTexto = "Jueves, 12 de noviembre",
  menuNormal = 28,
  triturado = 4,
  sinGluten = 2,
  alCerrarSesion,
}: ParteCocina54Props) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const [confirmado, setConfirmado] = useState(true);

  const totalComensales = menuNormal + triturado + sinGluten;

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <Texto style={estilos.fechaTexto}>{fechaTexto}</Texto>
      <View style={estilos.chipUsuario} testID="chip-usuario-54">
        <Texto style={estilos.chipTexto}>{nombreUsuario}</Texto>
      </View>
      <Pressable
        testID="boton-salir-54"
        accessibilityRole="button"
        accessibilityLabel="Salir"
        onPress={alCerrarSesion}
        style={estilos.botonSalir}
      >
        <Icono nombre="salir" tam={18} color={colores.texto} />
        <Texto style={estilos.textoSalir}>Salir</Texto>
      </Pressable>
    </View>
  );

  return (
    <MarcoPantalla
      titulo="Cocina · Parte del día"
      simbolo={<Icono nombre="lista" tam={30} color={colores.primario} />}
      derecha={derecha}
      atras={alCerrarSesion ?? null}
      adelante={null}
    >
      <View style={estilos.contenedor} testID="pantalla-54-parte-cocina">
        <View style={estilos.filaContadores}>
          <View style={estilos.tarjetaContador}>
            <Texto style={estilos.etiquetaContador}>MENÚ NORMAL</Texto>
            <Texto style={[estilos.numeroContador, { color: colores.primario }]}>
              {String(menuNormal)}
            </Texto>
          </View>
          <View style={estilos.tarjetaContador}>
            <Texto style={estilos.etiquetaContador}>TRITURADO</Texto>
            <Texto style={[estilos.numeroContador, { color: "#9A5B00" }]}>
              {String(triturado)}
            </Texto>
          </View>
          <View style={estilos.tarjetaContador}>
            <Texto style={estilos.etiquetaContador}>SIN GLUTEN</Texto>
            <Texto style={[estilos.numeroContador, { color: colores.peligro }]}>
              {String(sinGluten)}
            </Texto>
          </View>
          <View style={estilos.tarjetaContador}>
            <Texto style={estilos.etiquetaContador}>TOTAL COMENSALES</Texto>
            <Texto style={[estilos.numeroContador, { color: colores.exito }]}>
              {String(totalComensales)}
            </Texto>
          </View>
        </View>

        <View style={estilos.tarjetaConfirmacion}>
          <View style={estilos.infoConfirmacion}>
            <Texto style={estilos.tituloConfirmacion}>Aulas confirmadas: 3 de 3</Texto>
            <Texto style={estilos.subtituloConfirmacion}>
              Última actualización: Clase Triángulo (10:12) · Alergia a frutos secos: Miriam
            </Texto>
          </View>
          <Pressable
            testID="btn-confirmar-parte-54"
            accessibilityRole="button"
            accessibilityLabel="Parte confirmado"
            onPress={() => setConfirmado((v) => !v)}
            style={estilos.botonConfirmado}
          >
            <Icono nombre="check" tam={20} color="#FFFFFF" />
            <Texto style={estilos.textoBotonConfirmado}>
              {confirmado ? "Parte confirmado" : "Confirmar parte"}
            </Texto>
          </Pressable>
        </View>
      </View>
    </MarcoPantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cabeceraDerecha: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    fechaTexto: {
      fontSize: 15,
      color: c.textoSecundario,
    },
    chipUsuario: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    chipTexto: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    botonSalir: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 44,
      paddingHorizontal: 12,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    textoSalir: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    contenedor: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
      gap: 18,
      backgroundColor: c.fondo,
    },
    filaContadores: {
      flexDirection: "row",
      gap: 16,
    },
    tarjetaContador: {
      flex: 1,
      padding: 22,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      alignItems: "center",
      gap: 6,
    },
    etiquetaContador: {
      fontSize: 15,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    numeroContador: {
      fontSize: 44,
      fontWeight: "700",
    },
    tarjetaConfirmacion: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 22,
      paddingVertical: 18,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      gap: 16,
    },
    infoConfirmacion: {
      flex: 1,
      gap: 4,
    },
    tituloConfirmacion: {
      fontSize: 19,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloConfirmacion: {
      fontSize: 15,
      color: c.textoSecundario,
    },
    botonConfirmado: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 52,
      paddingHorizontal: 18,
      borderRadius: FORMA.radio,
      backgroundColor: c.exito,
    },
    textoBotonConfirmado: {
      fontSize: 17,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
