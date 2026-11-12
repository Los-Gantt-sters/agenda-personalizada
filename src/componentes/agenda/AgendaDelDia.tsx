// Agenda del día completa (T-06.2, HU-06): une el estado reactivo (useAgendaDia), la vista de tres
// bloques (T-06.1) y la pantalla de la tarea. La pantalla app/agenda.tsx le pasa el repositorio.
// T-08.1 (HU-08): «Empezar» y «Terminar»; al terminar, refuerzo positivo según el perfil (RF6.4).
// T-16.2 (HU-16): aviso 5 minutos antes de la siguiente tarea (RF4.6), según el perfil.
// Mejoras de la profesora (noviembre de 2026):
// - Nada de ventanas emergentes: el detalle, la tarea en curso y la felicitación son pantallas, cada
//   una con su cabecera y su barra de abajo. Por eso la agenda pinta aquí su propia Pantalla.
// - Al pulsar «Empezar» solo se ve esa tarea (sin «Hecho» ni «Después»). El alumno la sigue viendo
//   así mientras está en curso, también si se recarga la app. Un adulto que abre la agenda con una
//   tarea ya empezada ve la agenda entera (abrirTareaEnCurso = false): así su «Atrás» vuelve a su
//   panel y no deshace por error lo que empezó el alumno.
// - Basta un toque en «Empezar» y «Terminar»; «Atrás» los deshace por si el alumno se equivoca:
//   en la tarea en curso vuelve a la agenda sin empezar y en la felicitación, a la tarea sin terminar.
// - Las familias (soloMirar) ven la agenda pero no empiezan ni terminan tareas.
import { useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import type { RepositorioAgenda } from "./tipos";
import { useAgendaDia } from "./useAgendaDia";
import { AgendaTresBloques } from "./AgendaTresBloques";
import { PantallaTarea } from "./PantallaTarea";
import { Pantalla } from "../../pantalla/Pantalla";
import { Texto, useApariencia } from "../../ui";
import { RefuerzoPositivo } from "../ejecucion-tarea/RefuerzoPositivo";
import type { Emocion } from "../ejecucion-tarea/emociones";
import {
  PREFERENCIAS_EJECUCION_POR_DEFECTO,
  type PreferenciasEjecucion,
} from "../ejecucion-tarea/tipos";
import { useAvisoAnticipado } from "../aviso-anticipado/useAvisoAnticipado";
import { AvisoFlotante } from "../aviso-anticipado/AvisoFlotante";
import {
  AVISO_POR_DEFECTO,
  type EventoAviso,
  type PreferenciasAviso,
} from "../aviso-anticipado/tipos";

/** Cabecera y «Atrás» de la pantalla de la agenda (cambian según quién la mira). */
export interface MarcoAgenda {
  titulo: string;
  simbolo?: ReactNode;
  derecha?: ReactNode;
  /** «Atrás» en la agenda: con null desactivado (el alumno no sale de su agenda por error). */
  alAtras?: (() => void) | null;
  /** Sonido suave en los botones de la barra (pantallas del alumno). */
  conSonido?: boolean;
}

const MARCO_POR_DEFECTO: MarcoAgenda = { titulo: "Mi agenda", alAtras: null };

export function AgendaDelDia({
  repo,
  estudianteId,
  fecha,
  nombre,
  preferencias = PREFERENCIAS_EJECUCION_POR_DEFECTO,
  preferenciasAviso = AVISO_POR_DEFECTO,
  onAviso,
  onEmocion,
  tareasVisibles = 3,
  soloMirar = false,
  verReloj = true,
  abrirTareaEnCurso = true,
  marco = MARCO_POR_DEFECTO,
}: {
  repo: RepositorioAgenda;
  estudianteId: string;
  fecha?: string;
  /** Nombre del estudiante para el refuerzo («¡Muy bien, Marcos!»). */
  nombre?: string;
  preferencias?: PreferenciasEjecucion;
  /** HU-16: aviso 5 minutos antes (RNF4.3: se puede dejar en solo visual). */
  preferenciasAviso?: PreferenciasAviso;
  /** RI4.2: se llama con cada aviso emitido. */
  onAviso?: (evento: EventoAviso) => void;
  /** «¿Cómo te has sentido?»: se llama si el alumno contesta al terminar una tarea. */
  onEmocion?: (idEntrada: string, emocion: Emocion) => void;
  /** Cuántas tareas se ven en «Hecho» y en «Después» (preferencia del alumno: 1, 3 o todas). */
  tareasVisibles?: number;
  /** Familias: la misma agenda, pero sin «Empezar» ni «Terminar». */
  soloMirar?: boolean;
  /** Preferencia «Reloj»: si se ve el reloj mientras se hace una tarea. */
  verReloj?: boolean;
  /**
   * Si una tarea ya empezada se ve sola al abrir la agenda (el alumno). Con false (adultos) se ve la
   * agenda y solo se pasa a la tarea al pulsar «Empezar» en esta pantalla.
   */
  abrirTareaEnCurso?: boolean;
  /** Cabecera y «Atrás» de la agenda. */
  marco?: MarcoAgenda;
}) {
  // Se piden las que quiere ver el alumno; la vista enseña las que quepan en la pantalla.
  const {
    bloques,
    entradas,
    cargando,
    error,
    errorGuardado,
    empezar,
    confirmarFin,
    deshacerEmpezar,
    deshacerFin,
  } = useAgendaDia(repo, estudianteId, fecha, {
    maxHecho: tareasVisibles,
    maxDespues: tareasVisibles,
  });
  const { colores } = useApariencia();
  // Tarea abierta desde su tarjeta (detalle). Se guarda el id y no la entrada: si el tutor la
  // cambia con el detalle abierto, se ve al momento.
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const abierta = entradas.find((e) => e.id === abiertaId) ?? null;
  // Tarea recién terminada mientras se enseña el refuerzo positivo.
  // «¿Cómo te has sentido?»: la respuesta se entrega con onEmocion. Todavía no se guarda en el
  // colegio ni se enseña: falta decidir con el centro quién la ve y dónde se guarda.
  const [terminada, setTerminada] = useState<{ id: string; titulo: string } | null>(null);
  // Tarea empezada desde esta pantalla (para los adultos, que no entran directos a la tarea).
  const [empezadaAqui, setEmpezadaAqui] = useState<string | null>(null);
  // Cerrar el aviso solo lo quita de la pantalla: la tarea en curso sigue igual.
  const { aviso, cerrar: cerrarAviso } = useAvisoAnticipado(entradas, preferenciasAviso, onAviso);

  // El refuerzo sale al momento, igual que la tarea pasa a «Hecho» al momento (actualización
  // optimista); si no se guarda, la tarea vuelve a «Ahora» y se avisa abajo.
  const terminar = (idEntrada: string) => {
    if (bloques.ahora?.id !== idEntrada) return;
    setTerminada({ id: idEntrada, titulo: bloques.ahora.tarea.titulo });
    setAbiertaId(null);
    void confirmarFin(idEntrada);
  };

  const franjaAviso = (
    <AvisoFlotante aviso={aviso} preferencias={preferenciasAviso} onCerrar={cerrarAviso} />
  );
  // Aviso discreto solo si algo falla; no tapa la tarea.
  const pieError =
    error || errorGuardado ? (
      <Texto
        accessibilityLiveRegion="polite"
        style={{
          position: "absolute",
          bottom: 4,
          alignSelf: "center",
          color: colores.textoSecundario,
          fontSize: 14,
        }}
      >
        {errorGuardado ? "No se ha guardado. Prueba otra vez." : "Sin conexión con el colegio."}
      </Texto>
    ) : null;

  // ---- La felicitación: «Atrás» = todavía no había terminado ----
  if (terminada) {
    return (
      <RefuerzoPositivo
        tarea={terminada.titulo}
        nombre={nombre}
        preferencias={preferencias.refuerzo}
        onSeguir={() => setTerminada(null)}
        onDeshacer={() => {
          void deshacerFin(terminada.id);
          setTerminada(null);
        }}
        onEmocion={(emocion) => onEmocion?.(terminada.id, emocion)}
      />
    );
  }

  // ---- El detalle de una tarea (al tocar su tarjeta): «Atrás» vuelve a la agenda ----
  if (abierta) {
    return (
      <PantallaTarea
        key={`detalle-${abierta.id}`}
        entrada={abierta}
        // Una familia que abre la tarea en curso ve también el reloj, pero no «Terminar».
        enCurso={abierta.estado === "en_curso"}
        alAtras={() => setAbiertaId(null)}
        etiquetaAtras="Atrás: volver a la agenda"
        verReloj={verReloj}
        conSonido={marco.conSonido}
        aviso={franjaAviso}
        pie={pieError}
      />
    );
  }

  // ---- La tarea en curso: solo se ve ella. «Atrás» = todavía no había empezado ----
  const ahora = bloques.ahora;
  const enCurso =
    !soloMirar && ahora?.estado === "en_curso" && (abrirTareaEnCurso || empezadaAqui === ahora.id)
      ? ahora
      : null;
  if (enCurso) {
    return (
      <PantallaTarea
        key={`en-curso-${enCurso.id}`}
        entrada={enCurso}
        enCurso
        alAtras={() => void deshacerEmpezar(enCurso.id)}
        etiquetaAtras="Atrás: todavía no he empezado"
        onTerminar={() => terminar(enCurso.id)}
        verReloj={verReloj}
        conSonido={marco.conSonido}
        aviso={franjaAviso}
        pie={pieError}
      />
    );
  }

  // ---- La agenda del día ----
  return (
    <Pantalla
      titulo={marco.titulo}
      simbolo={marco.simbolo}
      derecha={marco.derecha}
      alAtras={marco.alAtras}
      conSonido={marco.conSonido}
    >
      {cargando && entradas.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator
            size="large"
            color={colores.primario}
            accessibilityLabel="Cargando tu agenda"
          />
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: colores.fondo }}>
          {franjaAviso}
          <AgendaTresBloques
            bloques={bloques}
            onEmpezar={(id) => {
              setEmpezadaAqui(id);
              void empezar(id);
            }}
            onConfirmarFin={terminar}
            maxTareas={tareasVisibles}
            soloMirar={soloMirar}
            verReloj={verReloj}
            onAbrir={(e) => setAbiertaId(e.id)}
          />
          {pieError}
        </View>
      )}
    </Pantalla>
  );
}
