// Calendario de la pantalla 43 (HU-25) para elegir el día, la semana o el mes que se quiere ver.
// No es una ventana flotante (regla de la profesora): se abre desde el desplegable del periodo y
// ocupa el sitio de los indicadores, la tabla y el resumen hasta que se elige o se cierra.
//   - Día: el mes entero y se toca un día.
//   - Semana: se toca una fila del mes (de lunes a domingo).
//   - Mes: los doce meses del año.
// Con las flechas de mes y de año se llega a cualquier fecha pasada (p. ej. septiembre del año
// pasado). Lo que aún no ha llegado no se puede elegir: no tiene historial.
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import {
  aISO,
  deISO,
  nombreMes,
  periodoDelMes,
  periodoQueContiene,
  semanasDelMes,
  textoDia,
  textoPeriodo,
  type Periodo,
  type TipoPeriodo,
} from "./periodos";
import { Boton } from "./piezas";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const TITULOS: Record<TipoPeriodo, string> = {
  dia: "Elige el día",
  semana: "Elige la semana",
  mes: "Elige el mes",
};
const AYUDAS: Record<TipoPeriodo, string> = {
  dia: "Toca un día. El de hoy lleva borde; los que aún no han llegado no se pueden elegir.",
  semana: "Toca cualquier día de una fila para ver esa semana, de lunes a domingo.",
  mes: "Toca un mes. Con las flechas del año se llega a los años anteriores.",
};

export interface CalendarioPeriodoProps {
  tipo: TipoPeriodo;
  /** El periodo que se está viendo: sale marcado y el calendario se abre en su mes. */
  periodo: Periodo;
  hoy: Date;
  alElegir: (periodo: Periodo) => void;
  alCerrar: () => void;
}

export function CalendarioPeriodo({
  tipo,
  periodo,
  hoy,
  alElegir,
  alCerrar,
}: CalendarioPeriodoProps) {
  const e = useEstilos(crearEstilos);
  const [vista, setVista] = useState(() => {
    const d = deISO(periodo.desde);
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });
  const { anio, mes } = vista;
  const hoyAnio = hoy.getFullYear();
  const hoyMes = hoy.getMonth();
  const enMesDeHoy = anio === hoyAnio && mes === hoyMes;

  const irAMes = (pasos: number) => {
    const d = new Date(anio, mes + pasos, 1);
    setVista({ anio: d.getFullYear(), mes: d.getMonth() });
  };
  const irAAnio = (pasos: number) => {
    const nuevo = anio + pasos;
    // Al llegar al año de hoy no se puede quedar en un mes que aún no ha llegado.
    setVista({ anio: nuevo, mes: nuevo === hoyAnio ? Math.min(mes, hoyMes) : mes });
  };

  return (
    <View style={e.tarjeta} testID="calendario-periodo">
      <View style={e.cabecera}>
        <Texto style={e.titulo} accessibilityRole="header" testID="cal-titulo">
          {TITULOS[tipo]}
        </Texto>
        {tipo !== "mes" ? (
          <Navegador
            texto={nombreMes(mes)}
            etiqueta="mes"
            anterior={() => irAMes(-1)}
            siguiente={enMesDeHoy || anio > hoyAnio ? null : () => irAMes(1)}
            testID="cal-mes"
          />
        ) : null}
        <Navegador
          texto={String(anio)}
          etiqueta="año"
          anterior={() => irAAnio(-1)}
          siguiente={anio >= hoyAnio ? null : () => irAAnio(1)}
          testID="cal-anio"
        />
        <Boton
          texto="Hoy"
          etiqueta={
            tipo === "dia" ? "Ver hoy" : tipo === "semana" ? "Ver esta semana" : "Ver este mes"
          }
          alPulsar={() => alElegir(periodoQueContiene(tipo, hoy))}
          testID="cal-hoy"
        />
        <Boton
          texto="Cerrar"
          etiqueta="Cerrar el calendario"
          lleno
          alPulsar={alCerrar}
          testID="cal-cerrar"
        />
      </View>

      {tipo === "mes" ? (
        <Meses anio={anio} periodo={periodo} hoy={hoy} alElegir={alElegir} />
      ) : (
        <Mes tipo={tipo} anio={anio} mes={mes} periodo={periodo} hoy={hoy} alElegir={alElegir} />
      )}

      <Texto style={e.ayuda}>{AYUDAS[tipo]}</Texto>
    </View>
  );
}

/** «‹ Noviembre ›» o «‹ 2026 ›». */
function Navegador({
  texto,
  etiqueta,
  anterior,
  siguiente,
  testID,
}: {
  texto: string;
  etiqueta: "mes" | "año";
  anterior: () => void;
  /** null: no se puede ir más adelante (aún no ha llegado). */
  siguiente: (() => void) | null;
  testID: string;
}) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const flecha = (activo: boolean) => (activo ? colores.primario : colores.borde);
  return (
    <View style={e.navegador}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta === "mes" ? "Mes anterior" : "Año anterior"}
        onPress={anterior}
        style={({ pressed }) => [e.flecha, pressed && e.pulsado]}
        testID={`${testID}-anterior`}
      >
        <Icono nombre="atras" color={flecha(true)} tam={24} />
      </Pressable>
      <Texto style={e.textoNavegador} testID={`${testID}-texto`}>
        {texto}
      </Texto>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta === "mes" ? "Mes siguiente" : "Año siguiente"}
        accessibilityState={{ disabled: siguiente === null }}
        disabled={siguiente === null}
        onPress={siguiente ?? undefined}
        style={({ pressed }) => [e.flecha, pressed && siguiente && e.pulsado]}
        testID={`${testID}-siguiente`}
      >
        <Icono nombre="siguiente" color={flecha(siguiente !== null)} tam={24} />
      </Pressable>
    </View>
  );
}

/** Un mes en filas de lunes a domingo: se elige un día o una semana entera. */
function Mes({
  tipo,
  anio,
  mes,
  periodo,
  hoy,
  alElegir,
}: {
  tipo: "dia" | "semana";
  anio: number;
  mes: number;
  periodo: Periodo;
  hoy: Date;
  alElegir: (p: Periodo) => void;
}) {
  const e = useEstilos(crearEstilos);
  const hoyISO = aISO(hoy);
  const semanaDeHoy = periodoQueContiene("semana", hoy).desde;
  const filas = semanasDelMes(anio, mes);
  const delMes = (fecha: string) => deISO(fecha).getMonth() === mes;

  return (
    <View style={e.rejilla}>
      <View
        style={e.filaDias}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {DIAS_SEMANA.map((d) => (
          <Texto key={d} style={e.letraDia}>
            {d}
          </Texto>
        ))}
      </View>
      {filas.map((fila) => {
        const lunes = fila[0];
        if (tipo === "semana") {
          const elegida = periodo.tipo === "semana" && periodo.desde === lunes;
          const futura = lunes > hoyISO;
          const semana = periodoQueContiene("semana", lunes);
          return (
            <Pressable
              key={lunes}
              accessibilityRole="button"
              accessibilityLabel={textoPeriodo(semana, hoy)}
              accessibilityState={{ selected: elegida, disabled: futura }}
              disabled={futura}
              onPress={() => alElegir(semana)}
              style={({ pressed }) => [
                e.filaSemana,
                lunes === semanaDeHoy && e.semanaDeHoy,
                elegida && e.semanaElegida,
                futura && e.apagada,
                pressed && !elegida && e.pulsado,
              ]}
              testID={`cal-semana-${lunes}`}
            >
              {fila.map((fecha) => (
                <Texto
                  key={fecha}
                  style={[
                    e.numero,
                    e.septimo,
                    !delMes(fecha) && e.fueraDelMes,
                    elegida && e.numeroElegido,
                    futura && e.numeroApagado,
                  ]}
                >
                  {String(deISO(fecha).getDate())}
                </Texto>
              ))}
            </Pressable>
          );
        }
        return (
          <View key={lunes} style={e.filaCeldas}>
            {fila.map((fecha) => {
              const elegido = periodo.tipo === "dia" && periodo.desde === fecha;
              const futuro = fecha > hoyISO;
              const esHoy = fecha === hoyISO;
              return (
                <Pressable
                  key={fecha}
                  accessibilityRole="button"
                  accessibilityLabel={`${textoDia(fecha)} de ${deISO(fecha).getFullYear()}${esHoy ? ", hoy" : ""}`}
                  accessibilityState={{ selected: elegido, disabled: futuro }}
                  disabled={futuro}
                  onPress={() => alElegir(periodoQueContiene("dia", fecha))}
                  style={({ pressed }) => [
                    e.celda,
                    delMes(fecha) && !futuro && e.celdaDelMes,
                    esHoy && e.celdaHoy,
                    elegido && e.celdaElegida,
                    pressed && !elegido && e.pulsado,
                  ]}
                  testID={`cal-dia-${fecha}`}
                >
                  <Texto
                    style={[
                      e.numero,
                      !delMes(fecha) && e.fueraDelMes,
                      elegido && e.numeroSobrePrimario,
                      futuro && e.numeroApagado,
                    ]}
                  >
                    {String(deISO(fecha).getDate())}
                  </Texto>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/** Los doce meses de un año. */
function Meses({
  anio,
  periodo,
  hoy,
  alElegir,
}: {
  anio: number;
  periodo: Periodo;
  hoy: Date;
  alElegir: (p: Periodo) => void;
}) {
  const e = useEstilos(crearEstilos);
  const elegidoDesde = periodo.tipo === "mes" ? periodo.desde : null;
  const filas = [0, 4, 8].map((inicio) => [inicio, inicio + 1, inicio + 2, inicio + 3]);
  return (
    <View style={e.rejilla}>
      {filas.map((fila) => (
        <View key={fila[0]} style={e.filaMeses}>
          {fila.map((mes) => {
            const p = periodoDelMes(anio, mes);
            const elegido = p.desde === elegidoDesde;
            const futuro =
              anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes > hoy.getMonth());
            const esEste = anio === hoy.getFullYear() && mes === hoy.getMonth();
            return (
              <Pressable
                key={mes}
                accessibilityRole="button"
                accessibilityLabel={`${nombreMes(mes)} de ${anio}${esEste ? ", este mes" : ""}`}
                accessibilityState={{ selected: elegido, disabled: futuro }}
                disabled={futuro}
                onPress={() => alElegir(p)}
                style={({ pressed }) => [
                  e.mes,
                  esEste && e.celdaHoy,
                  elegido && e.celdaElegida,
                  futuro && e.mesApagado,
                  pressed && !elegido && e.pulsado,
                ]}
                testID={`cal-mes-${p.desde.slice(0, 7)}`}
              >
                <Texto
                  style={[e.textoMes, elegido && e.numeroSobrePrimario, futuro && e.numeroApagado]}
                >
                  {nombreMes(mes)}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    tarjeta: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      gap: 10,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
    },
    cabecera: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    titulo: {
      flex: 1,
      fontSize: 20,
      fontWeight: "700",
      color: c.texto,
    },
    navegador: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 48,
      paddingHorizontal: 2,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
    },
    flecha: {
      width: 44,
      height: 44,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    textoNavegador: {
      minWidth: 104,
      textAlign: "center",
      fontSize: 17,
      fontWeight: "700",
      color: c.texto,
    },
    rejilla: {
      flex: 1,
      gap: 6,
    },
    filaDias: {
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 4,
    },
    letraDia: {
      flex: 1,
      textAlign: "center",
      fontSize: 14,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    filaCeldas: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 4,
    },
    celda: {
      flex: 1,
      minHeight: 40,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    celdaDelMes: {
      backgroundColor: c.fondo,
    },
    celdaHoy: {
      borderColor: c.primario,
    },
    celdaElegida: {
      backgroundColor: c.primario,
      borderColor: c.primario,
    },
    filaSemana: {
      flex: 1,
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 4,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: "transparent",
      backgroundColor: c.fondo,
    },
    semanaDeHoy: {
      borderColor: c.borde,
    },
    semanaElegida: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    apagada: {
      backgroundColor: "transparent",
    },
    numero: {
      textAlign: "center",
      fontSize: 17,
      fontWeight: "700",
      color: c.texto,
    },
    septimo: {
      flex: 1,
    },
    fueraDelMes: {
      fontWeight: "400",
      color: c.textoSecundario,
    },
    numeroElegido: {
      color: c.primario,
    },
    numeroSobrePrimario: {
      color: c.textoSobrePrimario,
    },
    numeroApagado: {
      fontWeight: "400",
      color: c.textoSecundario,
      opacity: 0.45,
    },
    filaMeses: {
      flex: 1,
      flexDirection: "row",
      gap: 12,
    },
    mes: {
      flex: 1,
      minHeight: 52,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    mesApagado: {
      borderStyle: "dashed",
      backgroundColor: c.fondo,
    },
    textoMes: {
      fontSize: 19,
      fontWeight: "700",
      color: c.texto,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
    },
    ayuda: {
      fontSize: 14.5,
      color: c.textoSecundario,
    },
  });
