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
// T-08.4 (SCRUM-262): «Terminar» pregunta «¿Has terminado?» (pantalla 08). «No, sigo» y «Atrás»
// vuelven siempre al último paso de la tarea, con el formato que tenía.
// T-08.5 (SCRUM-263): al abrir una tarea hecha sale la pantalla 10, sin descripción ni valoración.
// T-08.6 (SCRUM-264): una tarea a medias abre la pantalla 10b («Retomar tarea»). El aviso de 5 minutos
// es la pantalla 08b para el alumno: espera a «Vale» y le devuelve justo donde estaba. Nunca corta la
// felicitación ni «¿Has terminado?»; a los adultos solo les sale la franja de arriba.
import { useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import type { RepositorioAgenda } from "./tipos";
import { useAgendaDia } from "./useAgendaDia";
import { AgendaTresBloques } from "./AgendaTresBloques";
import { PantallaTarea, type VistaTarea } from "./PantallaTarea";
import { PantallaTareaHecha } from "./PantallaTareaHecha";
import { PantallaTareaPendiente } from "./PantallaTareaPendiente";
import { esPendienteRetomar } from "./logica";
import { Pantalla } from "../../pantalla/Pantalla";
import { Texto, useApariencia } from "../../ui";
import { PantallaConfirmarFin } from "../ejecucion-tarea/PantallaConfirmarFin";
import { RefuerzoPositivo } from "../ejecucion-tarea/RefuerzoPositivo";
import type { Emocion } from "../ejecucion-tarea/emociones";
import {
  PREFERENCIAS_EJECUCION_POR_DEFECTO,
  type PreferenciasEjecucion,
} from "../ejecucion-tarea/tipos";
import { useAvisoAnticipado } from "../aviso-anticipado/useAvisoAnticipado";
import { AvisoFlotante } from "../aviso-anticipado/AvisoFlotante";
import { PantallaAviso } from "../aviso-anticipado/PantallaAviso";
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
    retomar,
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
  // Tarea por la que se está preguntando «¿Has terminado?» (pantalla 08).
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  // Paso y formato de cada tarea, para volver a ellos desde otra pantalla.
  const [vistas, setVistas] = useState<Record<string, VistaTarea>>({});
  // Lo mismo para el detalle abierto, aparte: mirar los pasos no adelanta la tarea al empezarla.
  const [vistaDetalle, setVistaDetalle] = useState<VistaTarea | undefined>(undefined);
  // Cerrar el aviso solo lo quita de la pantalla: la tarea en curso sigue igual.
  const { aviso, cerrar: cerrarAviso } = useAvisoAnticipado(entradas, preferenciasAviso, onAviso);

  // Si la tarea deja de ser la de «Ahora» (la cambia el tutor), ya no se pregunta por ella.
  const aConfirmar = bloques.ahora?.id === confirmandoId ? bloques.ahora : null;
  if (confirmandoId && !aConfirmar) setConfirmandoId(null);

  const olvidarVista = (idEntrada: string) =>
    setVistas((actuales) => {
      const resto = { ...actuales };
      delete resto[idEntrada];
      return resto;
    });

  const cerrarDetalle = () => {
    setAbiertaId(null);
    setVistaDetalle(undefined);
  };

  const pedirFin = (idEntrada: string) => {
    if (bloques.ahora?.id === idEntrada) setConfirmandoId(idEntrada);
  };

  // El refuerzo sale al momento, igual que la tarea pasa a «Hecho» al momento (actualización
  // optimista); si no se guarda, la tarea vuelve a «Ahora» y se avisa abajo.
  const terminar = (idEntrada: string) => {
    if (bloques.ahora?.id !== idEntrada) return;
    setTerminada({ id: idEntrada, titulo: bloques.ahora.tarea.titulo });
    setConfirmandoId(null);
    cerrarDetalle();
    void confirmarFin(idEntrada);
  };

  // El alumno ve el aviso a pantalla completa (más abajo); los adultos, en esta franja.
  const franjaAviso = abrirTareaEnCurso ? null : (
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
        onSeguir={() => {
          olvidarVista(terminada.id);
          setTerminada(null);
        }}
        onDeshacer={() => {
          void deshacerFin(terminada.id);
          setTerminada(null);
        }}
        onEmocion={(emocion) => onEmocion?.(terminada.id, emocion)}
      />
    );
  }

  // ---- «¿Has terminado?»: «No, sigo» y «Atrás» vuelven al último paso ----
  if (aConfirmar) {
    return (
      <PantallaConfirmarFin
        key={`confirmar-${aConfirmar.id}`}
        tarea={aConfirmar.tarea}
        onSi={() => terminar(aConfirmar.id)}
        onNo={() => setConfirmandoId(null)}
        conSonido={marco.conSonido}
      />
    );
  }

  // ---- Pantalla 08b: «Vale» y «Atrás» devuelven justo a donde estaba ----
  if (abrirTareaEnCurso && aviso) {
    return (
      <PantallaAviso
        key={`aviso-${aviso.emitido_en}`}
        aviso={aviso}
        preferencias={preferenciasAviso}
        onCerrar={cerrarAviso}
        conSonido={marco.conSonido}
      />
    );
  }

  // ---- Pantalla 10: una tarea ya hecha solo enseña el tick, el dibujo y su nombre ----
  if (abierta?.estado === "hecha") {
    return (
      <PantallaTareaHecha
        key={`hecha-${abierta.id}`}
        tarea={abierta.tarea}
        alAtras={cerrarDetalle}
        conSonido={marco.conSonido}
      />
    );
  }

  // ---- Pantalla 10b: una tarea a medias se puede retomar ----
  if (abierta && esPendienteRetomar(abierta)) {
    const otraEnCurso = entradas.some((e) => e.estado === "en_curso");
    const puedeRetomar = !soloMirar && !otraEnCurso;
    return (
      <PantallaTareaPendiente
        key={`pendiente-${abierta.id}`}
        entrada={abierta}
        conPasoGuardado={Boolean(vistas[abierta.id])}
        onRetomar={
          puedeRetomar
            ? () => {
                setEmpezadaAqui(abierta.id);
                cerrarDetalle();
                void retomar(abierta.id);
              }
            : undefined
        }
        nota={
          soloMirar
            ? "Solo para mirar: la tarea la retoma el alumno o su tutor"
            : otraEnCurso
              ? "Antes hay que terminar la tarea que está en curso"
              : undefined
        }
        alAtras={cerrarDetalle}
        conSonido={marco.conSonido}
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
        alAtras={cerrarDetalle}
        etiquetaAtras="Atrás: volver a la agenda"
        verReloj={verReloj}
        conSonido={marco.conSonido}
        aviso={franjaAviso}
        pie={pieError}
        vistaInicial={vistaDetalle}
        onCambioVista={setVistaDetalle}
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
        alAtras={() => {
          // Una tarea retomada vuelve a estar pendiente y sigue recordando su paso.
          if (!enCurso.pendiente_motivo) olvidarVista(enCurso.id);
          void deshacerEmpezar(enCurso.id);
        }}
        etiquetaAtras={
          enCurso.pendiente_motivo ? "Atrás: dejarla pendiente" : "Atrás: todavía no he empezado"
        }
        onTerminar={() => pedirFin(enCurso.id)}
        verReloj={verReloj}
        conSonido={marco.conSonido}
        aviso={franjaAviso}
        pie={pieError}
        vistaInicial={vistas[enCurso.id]}
        onCambioVista={(vista) => setVistas((v) => ({ ...v, [enCurso.id]: vista }))}
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
            onConfirmarFin={pedirFin}
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
