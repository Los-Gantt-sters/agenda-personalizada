// Desplegable de calendario de la agenda semanal (SCRUM-124 · T-17.1, MOD HU-17, pantalla 06b).
// Boceto 06b: en la cabecera, «Del 12 al 18 de noviembre ▾»; al pulsarlo se abre el mes con
// flechas para cambiar de mes, la semana elegida marcada y «Cerrar». Tocar un día lleva a su semana.
// Se pinta dentro de la pantalla (no es una ventana emergente del sistema).
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import type { Paleta } from "../../temas";
import { Icono, Texto, colorSobre, useApariencia, useEstilos } from "../../ui";
import {
  INICIALES_DIA,
  aFecha,
  lunesDe,
  moverMes,
  rejillaMes,
  textoDiaMes,
  textoMes,
  textoSemana,
} from "./semana";

/** Lado de cada día del calendario (área táctil mínima de 48 × 48, RNF6.3). */
const LADO_DIA = 48;

/** Botón de la cabecera que abre y cierra el calendario. */
export function BotonSemana({
  lunes,
  abierto,
  onPress,
}: {
  lunes: string;
  abierto: boolean;
  onPress: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  return (
    <Pressable
      testID="btn-selector-semana"
      accessibilityRole="button"
      accessibilityLabel={`Semana: ${textoSemana(lunes)}. Cambiar de semana`}
      accessibilityState={{ expanded: abierto }}
      onPress={onPress}
      style={({ pressed }) => [e.botonSemana, pressed && e.pulsado]}
    >
      <Icono nombre="calendario" color={colores.primario} tam={22} />
      <Texto style={e.textoBotonSemana} numberOfLines={1}>
        {textoSemana(lunes)}
      </Texto>
      <Texto style={e.flecha}>{abierto ? "▲" : "▼"}</Texto>
    </Pressable>
  );
}

/** El mes con la semana elegida marcada. */
export function CalendarioSemana({
  lunes,
  hoy,
  alElegirSemana,
  alCerrar,
}: {
  lunes: string;
  hoy: string;
  /** Se llama con el lunes de la semana del día tocado. */
  alElegirSemana: (lunes: string) => void;
  alCerrar: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const inicio = aFecha(lunes);
  const [mes, setMes] = useState({ anio: inicio.getFullYear(), mes: inicio.getMonth() });
  const filas = rejillaMes(mes.anio, mes.mes);

  return (
    <View
      style={e.calendario}
      testID="calendario-semana"
      accessibilityLabel="Calendario: elige una semana"
    >
      <View style={e.filaMes}>
        <Texto style={e.textoMes} accessibilityRole="header" testID="mes-calendario">
          {textoMes(mes.anio, mes.mes)}
        </Texto>
        <View style={e.flechasMes}>
          <Pressable
            testID="btn-mes-anterior"
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
            onPress={() => setMes(moverMes(mes.anio, mes.mes, -1))}
            style={({ pressed }) => [e.botonMes, pressed && e.pulsado]}
          >
            <Icono nombre="atras" color={colores.primario} tam={22} grosor={3} />
          </Pressable>
          <Pressable
            testID="btn-mes-siguiente"
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
            onPress={() => setMes(moverMes(mes.anio, mes.mes, 1))}
            style={({ pressed }) => [e.botonMes, pressed && e.pulsado]}
          >
            <Icono nombre="adelante" color={colores.primario} tam={22} grosor={3} />
          </Pressable>
        </View>
      </View>

      <View style={e.filaDias} accessibilityElementsHidden importantForAccessibility="no">
        {INICIALES_DIA.map((d) => (
          <Texto key={d} style={e.inicial}>
            {d}
          </Texto>
        ))}
      </View>
      {filas.map((fila, i) => (
        <View key={i} style={e.filaDias}>
          {fila.map((dia, j) => {
            if (!dia) return <View key={j} style={e.hueco} />;
            const enSemana = lunesDe(dia) === lunes;
            const esHoy = dia === hoy;
            return (
              <Pressable
                key={dia}
                testID={`dia-calendario-${dia}`}
                accessibilityRole="button"
                accessibilityLabel={`${textoDiaMes(dia)}${esHoy ? ", hoy" : ""}`}
                accessibilityState={{ selected: enSemana }}
                onPress={() => alElegirSemana(lunesDe(dia))}
                style={({ pressed }) => [
                  e.dia,
                  enSemana && e.diaSemana,
                  esHoy && e.diaHoy,
                  pressed && e.pulsado,
                ]}
              >
                <Texto style={[e.textoDia, enSemana && e.textoDiaSemana]}>
                  {String(aFecha(dia).getDate())}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={e.filaCerrar}>
        <Pressable
          testID="btn-cerrar-calendario"
          accessibilityRole="button"
          accessibilityLabel="Cerrar el calendario"
          onPress={alCerrar}
          style={({ pressed }) => [e.botonCerrar, pressed && e.pulsado]}
        >
          <Texto style={e.textoCerrar}>Cerrar</Texto>
        </Pressable>
      </View>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    botonSemana: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    textoBotonSemana: { fontSize: 17, fontWeight: "700", color: c.texto },
    flecha: { fontSize: 12, color: c.textoSecundario },
    calendario: {
      width: LADO_DIA * 7 + 6 * 4 + 32,
      padding: 16,
      gap: 4,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({
        web: { boxShadow: "0 10px 25px rgba(0,0,0,0.18)" },
        default: { elevation: 8 },
      }),
    },
    filaMes: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    textoMes: { fontSize: 18, fontWeight: "700", color: c.texto },
    flechasMes: { flexDirection: "row", gap: 6 },
    botonMes: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
    },
    filaDias: { flexDirection: "row", gap: 4 },
    inicial: {
      width: LADO_DIA,
      textAlign: "center",
      fontSize: 13,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    hueco: { width: LADO_DIA, height: LADO_DIA },
    dia: {
      width: LADO_DIA,
      height: LADO_DIA,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    diaSemana: { backgroundColor: c.primario },
    diaHoy: { borderWidth: 3, borderColor: c.foco },
    textoDia: { fontSize: 16, color: c.texto },
    textoDiaSemana: { color: colorSobre(c.primario), fontWeight: "700" },
    filaCerrar: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6 },
    botonCerrar: {
      minHeight: 44,
      paddingHorizontal: 18,
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    textoCerrar: { fontSize: 15, fontWeight: "700", color: c.primario },
    pulsado: { opacity: 0.8 },
  });
