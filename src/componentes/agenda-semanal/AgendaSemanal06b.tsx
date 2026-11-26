// Pantalla 06b: agenda semanal del alumno (SCRUM-124 · T-17.1, MOD HU-17).
// Según el boceto definitivo (Drive, Prototipo/definitiva_v2/06b) y los cambios del 17-11 y el 19-11:
// - Cabecera «Agenda semanal»; en el centro, el desplegable del calendario («Del 12 al 18 de
//   noviembre ▾») para cambiar de semana; a la derecha, un único botón «Ver hoy» (→ 06), en vez de
//   pestañas Hoy | Semana.
// - La semana entera, de lunes a domingo (también sábado y domingo): una tarjeta por día con su
//   nombre, el número, el dibujo de su primera tarea y cuántas tareas tiene. La de hoy va marcada
//   («Jueves · Hoy») y es la elegida al entrar.
// - «Toca un día de la semana para abrir la agenda»: tocar una tarjeta abre la agenda de ese día (06).
// - Abajo, «Atrás» apagado (el alumno no sale de su agenda por error) y «Adelante» → 06.
// RNF4.1: sin scroll; las tarjetas se ajustan al ancho.
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import type { RepositorioAgenda } from "../agenda/tipos";
import { PictogramaTarea } from "../agenda/PictogramaTarea";
import { hoyISO } from "../agenda/useAgendaDia";
import { Pantalla } from "../../pantalla/Pantalla";
import type { Paleta } from "../../temas";
import { Icono, PictogramaInterfaz, Texto, useApariencia, useEstilos } from "../../ui";
import { BotonSemana, CalendarioSemana } from "./CalendarioSemana";
import { NOMBRES_DIA, aFecha, lunesDe, textoDiaMes, textoTareas } from "./semana";
import { useSemana } from "./useSemana";

export function AgendaSemanal06b({
  repo,
  estudianteId,
  hoy = hoyISO(),
  alAbrirDia,
  alVerHoy,
  derechaExtra,
}: {
  repo: RepositorioAgenda;
  estudianteId: string;
  /** Fecha de hoy (AAAA-MM-DD). */
  hoy?: string;
  /** Abre la agenda de un día (06). */
  alAbrirDia: (fecha: string) => void;
  /** «Ver hoy» (→ 06 de hoy). */
  alVerHoy: () => void;
  /** Algo más en la cabecera, a la derecha (p. ej. el nombre del alumno). */
  derechaExtra?: ReactNode;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const ventana = useWindowDimensions();
  const [lunes, setLunes] = useState(() => lunesDe(hoy));
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [ancho, setAncho] = useState<number | null>(null);
  const { dias, cargando, error } = useSemana(repo, estudianteId, lunes);

  // Al entrar está elegido hoy; en otra semana, su lunes.
  const elegido = lunesDe(hoy) === lunes ? hoy : lunes;
  const anchoUtil = (ancho ?? ventana.width) - 48;
  const anchoTarjeta = Math.max(84, Math.min(150, (anchoUtil - 10 * 6) / 7));
  const tamPicto = Math.min(72, anchoTarjeta - 24);

  return (
    <Pantalla
      titulo="Agenda semanal"
      simbolo={<PictogramaInterfaz nombre="agenda" etiqueta="agenda" tam={44} />}
      derecha={
        <View style={e.cabecera}>
          <BotonSemana
            lunes={lunes}
            abierto={calendarioAbierto}
            onPress={() => setCalendarioAbierto((a) => !a)}
          />
          <Pressable
            testID="btn-ver-hoy"
            accessibilityRole="button"
            accessibilityLabel="Ver hoy"
            onPress={alVerHoy}
            style={({ pressed }) => [e.botonVerHoy, pressed && e.pulsado]}
          >
            <Icono nombre="calendario" color={colores.primario} tam={22} />
            <Texto style={e.textoVerHoy}>Ver hoy</Texto>
          </Pressable>
          {derechaExtra}
        </View>
      }
      alAtras={null}
      alAdelante={() => alAbrirDia(elegido)}
      etiquetaAdelante="Adelante: abrir la agenda del día"
      conSonido
      testID="pantalla-06b-semana"
    >
      <View
        style={e.cuerpo}
        onLayout={(ev) => {
          const w = ev.nativeEvent.layout.width;
          if (ancho === null || Math.abs(ancho - w) > 1) setAncho(w);
        }}
      >
        <Texto style={e.instruccion} accessibilityRole="header">
          Toca un día de la semana para abrir la agenda
        </Texto>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color={colores.primario}
            accessibilityLabel="Cargando la semana"
          />
        ) : (
          <View style={e.filaDias} testID="dias-semana">
            {dias.map((d, i) => {
              const esHoy = d.fecha === hoy;
              const esElegido = d.fecha === elegido;
              const nombre = `${NOMBRES_DIA[i]}${esHoy ? " · Hoy" : ""}`;
              const primera = d.entradas[0];
              return (
                <Pressable
                  key={d.fecha}
                  testID={`tarjeta-dia-${d.fecha}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${NOMBRES_DIA[i]} ${textoDiaMes(d.fecha)}${esHoy ? ", hoy" : ""}: ${textoTareas(d.entradas.length)}`}
                  accessibilityState={{ selected: esElegido }}
                  onPress={() => alAbrirDia(d.fecha)}
                  style={({ pressed }) => [
                    e.tarjeta,
                    { width: anchoTarjeta },
                    esElegido && e.tarjetaElegida,
                    pressed && e.pulsado,
                  ]}
                >
                  {esElegido ? (
                    <View style={e.check}>
                      <Icono
                        nombre="check"
                        color={colores.textoSobrePrimario}
                        tam={16}
                        grosor={3}
                      />
                    </View>
                  ) : null}
                  <Texto
                    style={[e.nombreDia, esHoy && e.nombreHoy]}
                    numberOfLines={2}
                    testID={`nombre-dia-${i}`}
                  >
                    {nombre}
                  </Texto>
                  <Texto style={e.numeroDia}>{String(aFecha(d.fecha).getDate())}</Texto>
                  {primera ? (
                    <PictogramaTarea tarea={primera.tarea} tam={tamPicto} />
                  ) : (
                    <View style={{ width: tamPicto, height: tamPicto }} />
                  )}
                  <View style={[e.pildora, esHoy && e.pildoraHoy]}>
                    <Texto style={[e.textoPildora, esHoy && e.textoPildoraHoy]} numberOfLines={1}>
                      {textoTareas(d.entradas.length)}
                    </Texto>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {error ? (
          <Texto style={e.error} accessibilityLiveRegion="polite">
            Sin conexión con el colegio.
          </Texto>
        ) : null}

        {calendarioAbierto ? (
          <View style={e.capaCalendario}>
            <CalendarioSemana
              lunes={lunes}
              hoy={hoy}
              alElegirSemana={(l) => {
                setLunes(l);
                setCalendarioAbierto(false);
              }}
              alCerrar={() => setCalendarioAbierto(false)}
            />
          </View>
        ) : null}
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cabecera: { flexDirection: "row", alignItems: "center", gap: 10 },
    botonVerHoy: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    textoVerHoy: { fontSize: 17, fontWeight: "700", color: c.primario },
    cuerpo: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 22,
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: c.fondo,
    },
    instruccion: { fontSize: 24, fontWeight: "700", color: c.texto, textAlign: "center" },
    filaDias: { flexDirection: "row", gap: 10, justifyContent: "center" },
    tarjeta: {
      minHeight: 260,
      maxHeight: 300,
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    tarjetaElegida: {
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    check: {
      position: "absolute",
      top: -10,
      right: -10,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.primario,
      alignItems: "center",
      justifyContent: "center",
    },
    nombreDia: { fontSize: 16, fontWeight: "700", color: c.textoSecundario, textAlign: "center" },
    nombreHoy: { color: c.primario },
    numeroDia: { fontSize: 32, fontWeight: "700", color: c.texto },
    pildora: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    pildoraHoy: { borderColor: c.primario, backgroundColor: c.superficieDestacada },
    textoPildora: { fontSize: 13, fontWeight: "700", color: c.texto },
    textoPildoraHoy: { color: c.primario },
    capaCalendario: {
      position: "absolute",
      top: 8,
      alignSelf: "center",
      zIndex: 20,
      elevation: 20,
    },
    error: { position: "absolute", bottom: 4, fontSize: 14, color: c.textoSecundario },
    pulsado: { opacity: 0.85 },
  });
