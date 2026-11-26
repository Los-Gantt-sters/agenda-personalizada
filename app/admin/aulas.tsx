// Administración · Configurar aulas y clases (pantalla 48b, SCRUM-235 / SCRUM-259).
// El administrador pone nombre e icono a cada aula; se ven en la pantalla 01 (alumno) y en la 35
// (tutor). Puede haber más de 9: 01 y 35 las reparten en páginas. Los cambios se guardan todos
// juntos con «Guardar configuración» (barra de abajo). Sin ventanas emergentes: «Cambiar icono»
// abre otra pantalla y «Atrás» vuelve sin cambiar nada.
// SCRUM-249: no puede haber aulas sin curso lectivo (la 01 solo enseña las del curso activo), así
// que «Añadir nueva aula» abre antes otra pantalla para elegir su curso entre los no cerrados.
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { ElegirIconoAula } from "../../src/componentes/administracion/ElegirIconoAula";
import { IconoAula } from "../../src/componentes/administracion/IconoAula";
import { Pantalla } from "../../src/pantalla";
import {
  crearAula,
  guardarConfiguracionAulas,
  obtenerAulas,
  obtenerCursosAbiertos,
} from "../../src/servicios/aulasService";
import type { Paleta } from "../../src/temas";
import type { Aula, CursoLectivo } from "../../src/tipos/alumnos";
import { Icono, Texto, useApariencia, useEstilos } from "../../src/ui";

const ERROR_CARGA = "No se han podido cargar las aulas. Inténtalo otra vez.";
const ERROR_CARGA_CURSOS = "No se han podido cargar los cursos. Inténtalo otra vez.";
const NOMBRE_AULA_NUEVA = "Clase nueva";
const PREFIJO_NUEVA = "nueva-";

type AulaEditable = Pick<Aula, "id" | "nombre" | "iconoForma" | "iconoUrl" | "cursoLectivoId">;

/** Cursos lectivos no cerrados: mientras llegan, si fallan o ya están. */
type CargaCursos =
  { estado: "cargando" } | { estado: "error" } | { estado: "ok"; datos: CursoLectivo[] };

export default function ConfigurarAulas() {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const [aulas, setAulas] = useState<AulaEditable[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  /** Posición del aula cuyo icono se está eligiendo. */
  const [eligiendo, setEligiendo] = useState<number | null>(null);
  const [contadorNuevas, setContadorNuevas] = useState(0);
  /** Se está eligiendo el curso de un aula nueva (pantalla propia, antes de añadirla). */
  const [eligiendoCurso, setEligiendoCurso] = useState(false);
  const [cursos, setCursos] = useState<CargaCursos>({ estado: "cargando" });

  // Guarda en el estado lo que devuelve obtenerAulas (se llama cuando ya ha llegado la respuesta)
  const aplicar = useCallback((r: Awaited<ReturnType<typeof obtenerAulas>>) => {
    if (r.success) {
      setAulas(
        (r.data ?? []).map((a) => ({
          id: a.id,
          nombre: a.nombre,
          iconoForma: a.iconoForma,
          iconoUrl: a.iconoUrl ?? null,
          cursoLectivoId: a.cursoLectivoId ?? null,
        })),
      );
    }
    setErrorCarga(r.success ? null : ERROR_CARGA);
    setCargando(false);
  }, []);

  useEffect(() => {
    let montada = true;
    obtenerAulas().then((r) => montada && aplicar(r));
    return () => {
      montada = false;
    };
  }, [aplicar]);

  // Cursos para elegir el de las aulas nuevas y para poner el de cada aula en la lista
  const pedirCursos = useCallback(() => {
    let vigente = true;
    obtenerCursosAbiertos().then((r) => {
      if (!vigente) return;
      setCursos(r.success ? { estado: "ok", datos: r.data ?? [] } : { estado: "error" });
    });
    return () => {
      vigente = false;
    };
  }, []);
  useEffect(pedirCursos, [pedirCursos]);

  function reintentarCursos() {
    setCursos({ estado: "cargando" });
    pedirCursos();
  }

  const cursoDe = (id: string | null | undefined) =>
    cursos.estado === "ok" ? cursos.datos.find((c) => c.id === id) : undefined;

  function reintentar() {
    setCargando(true);
    setErrorCarga(null);
    void obtenerAulas().then(aplicar);
  }

  function cambiar(indice: number, cambios: Partial<AulaEditable>) {
    setGuardado(false);
    setAulas((actuales) => actuales.map((a, i) => (i === indice ? { ...a, ...cambios } : a)));
  }

  function anadir(cursoLectivoId: string) {
    setGuardado(false);
    setEligiendoCurso(false);
    setAulas((actuales) => [
      ...actuales,
      {
        id: `${PREFIJO_NUEVA}${contadorNuevas}`,
        nombre: NOMBRE_AULA_NUEVA,
        iconoForma: "tri",
        iconoUrl: null,
        cursoLectivoId,
      },
    ]);
    setContadorNuevas((n) => n + 1);
  }

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    setErrorGuardar(null);
    setGuardado(false);

    // Primero se crean las aulas nuevas (así tienen id real) y luego se guarda todo en orden
    const resueltas: AulaEditable[] = [];
    for (const a of aulas) {
      if (!a.id.startsWith(PREFIJO_NUEVA)) {
        resueltas.push(a);
        continue;
      }
      const r = await crearAula({
        nombre: a.nombre,
        cursoLectivoId: a.cursoLectivoId ?? "",
        iconoForma: a.iconoForma,
        iconoUrl: a.iconoUrl,
      });
      if (!r.success || !r.data) {
        setGuardando(false);
        setErrorGuardar(r.error ?? "No se ha podido guardar.");
        return;
      }
      resueltas.push({ ...a, id: r.data.id });
    }

    const r = await guardarConfiguracionAulas(resueltas);
    setGuardando(false);
    if (!r.success) {
      setErrorGuardar(r.error ?? "No se ha podido guardar.");
      return;
    }
    setAulas(resueltas);
    setGuardado(true);
  }

  // ---- Elegir el curso de un aula nueva: una pantalla propia, antes de añadirla ----
  if (eligiendoCurso) {
    return (
      <Pantalla
        titulo="¿De qué curso es la nueva aula?"
        simbolo={<Icono nombre="calendario" color={colores.primario} tam={36} />}
        alAtras={() => setEligiendoCurso(false)}
        etiquetaAtras="Atrás: volver a la lista sin añadir"
      >
        <View style={estilos.pantalla}>
          {cursos.estado === "cargando" && <Texto style={estilos.estado}>Cargando cursos…</Texto>}
          {cursos.estado === "error" && (
            <View style={estilos.filaError}>
              <Icono nombre="alerta" color={colores.peligro} tam={22} />
              <Texto style={estilos.error} accessibilityRole="alert">
                {ERROR_CARGA_CURSOS}
              </Texto>
              <Pressable
                style={estilos.boton}
                accessibilityRole="button"
                accessibilityLabel="Reintentar la carga de los cursos"
                onPress={reintentarCursos}
              >
                <Texto style={estilos.textoBoton}>Reintentar</Texto>
              </Pressable>
            </View>
          )}
          {cursos.estado === "ok" && cursos.datos.length === 0 && (
            <Texto style={estilos.estado}>
              No hay ningún curso abierto. Crea primero el curso lectivo y vuelve a añadir el aula.
            </Texto>
          )}
          {cursos.estado === "ok" &&
            cursos.datos.map((c) => (
              <Pressable
                key={c.id}
                style={estilos.botonCurso}
                accessibilityRole="button"
                accessibilityLabel={`Curso ${c.anioEscolar}${c.activo ? ", el actual" : ""}`}
                testID={`curso-${c.id}`}
                onPress={() => anadir(c.id)}
              >
                <Texto style={estilos.textoAnadir}>
                  {c.anioEscolar}
                  {c.activo ? " · curso actual" : ""}
                </Texto>
              </Pressable>
            ))}
        </View>
      </Pantalla>
    );
  }

  // ---- Elegir el icono de un aula: una pantalla propia ----
  if (eligiendo !== null && aulas[eligiendo]) {
    const aula = aulas[eligiendo];
    return (
      <Pantalla
        titulo={`Icono de ${aula.nombre}`}
        simbolo={<IconoAula iconoForma={aula.iconoForma} iconoUrl={aula.iconoUrl} tam={36} />}
        alAtras={() => setEligiendo(null)}
        etiquetaAtras="Atrás: volver a la lista sin cambiar"
      >
        <ElegirIconoAula
          iconoUrlActual={aula.iconoUrl}
          alElegir={(icono) => {
            cambiar(eligiendo, icono);
            setEligiendo(null);
          }}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Configurar aulas y clases"
      simbolo={<Icono nombre="personas" color={colores.primario} tam={36} />}
      alAdelante={cargando || errorCarga || guardando ? null : () => void guardar()}
      textoAdelante="Guardar configuración"
      etiquetaAdelante="Guardar configuración de las aulas"
    >
      <View style={estilos.pantalla}>
        <Texto style={estilos.subtitulo}>
          Cambia el nombre y el icono de cada aula. Se ven en la pantalla donde el alumno elige su
          clase y en la del tutor.
        </Texto>

        <Pressable
          style={estilos.botonAnadir}
          accessibilityRole="button"
          accessibilityLabel="Añadir nueva aula al centro"
          testID="anadir-aula"
          onPress={() => setEligiendoCurso(true)}
        >
          <Texto style={estilos.textoAnadir}>+ Añadir nueva aula al centro</Texto>
        </Pressable>

        {cargando && <Texto style={estilos.estado}>Cargando aulas…</Texto>}

        {errorCarga && (
          <View style={estilos.filaError}>
            <Icono nombre="alerta" color={colores.peligro} tam={22} />
            <Texto style={estilos.error} accessibilityRole="alert">
              {errorCarga}
            </Texto>
            <Pressable
              style={estilos.boton}
              accessibilityRole="button"
              accessibilityLabel="Reintentar la carga"
              onPress={reintentar}
            >
              <Texto style={estilos.textoBoton}>Reintentar</Texto>
            </Pressable>
          </View>
        )}

        {errorGuardar && (
          <View style={estilos.filaError}>
            <Icono nombre="alerta" color={colores.peligro} tam={22} />
            <Texto style={estilos.error} accessibilityRole="alert">
              {errorGuardar}
            </Texto>
          </View>
        )}

        {guardado && (
          <View style={estilos.filaError}>
            <Icono nombre="check" color={colores.exito} tam={22} grosor={3} />
            <Texto style={estilos.guardado} accessibilityLiveRegion="polite">
              Configuración guardada
            </Texto>
          </View>
        )}

        {!cargando && !errorCarga && aulas.length === 0 && (
          <Texto style={estilos.estado}>Todavía no hay aulas. Añade la primera.</Texto>
        )}

        {!cargando && !errorCarga && (
          <ScrollView contentContainerStyle={estilos.lista}>
            {aulas.map((a, i) => {
              const curso = cursoDe(a.cursoLectivoId);
              return (
                <View key={a.id} style={estilos.fila} testID={`aula-${i}`}>
                  <View style={estilos.columnaNombre}>
                    <Texto style={estilos.detalle}>
                      {`Aula #${i + 1}`}
                      {/* Hasta tener los cursos no se sabe si se ve en la 01: solo el número */}
                      {cursos.estado !== "ok"
                        ? ""
                        : !curso
                          ? " · Sin curso abierto: no se ve en 01"
                          : curso.activo
                            ? ` · Curso ${curso.anioEscolar} · Visible en 01 y 35`
                            : ` · Curso ${curso.anioEscolar} · Se verá en 01 cuando empiece ese curso`}
                    </Texto>
                    <TextInput
                      style={estilos.campo}
                      value={a.nombre}
                      onChangeText={(t) => cambiar(i, { nombre: t })}
                      accessibilityLabel={`Nombre del aula ${i + 1}`}
                      testID={`nombre-aula-${i}`}
                    />
                  </View>
                  <View style={estilos.columnaIcono}>
                    <IconoAula iconoForma={a.iconoForma} iconoUrl={a.iconoUrl} tam={48} />
                    <Pressable
                      style={estilos.boton}
                      accessibilityRole="button"
                      accessibilityLabel={`Cambiar icono de ${a.nombre}`}
                      testID={`cambiar-icono-${i}`}
                      onPress={() => setEligiendo(i)}
                    >
                      <Texto style={estilos.textoBoton}>Cambiar icono</Texto>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo, padding: 16, gap: 12 },
    subtitulo: { fontSize: 16, color: c.textoSecundario, maxWidth: 760 },
    estado: { fontSize: 18, color: c.textoSecundario },
    filaError: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
    error: { fontSize: 16, fontWeight: "700", color: c.peligro },
    guardado: { fontSize: 16, fontWeight: "700", color: c.exito },
    lista: { gap: 10, paddingBottom: 24 },
    fila: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    columnaNombre: { flexGrow: 1, flexBasis: 260, gap: 6 },
    columnaIcono: { flexDirection: "row", alignItems: "center", gap: 12 },
    detalle: { fontSize: 15, color: c.textoSecundario },
    campo: {
      minHeight: 52,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.fondo,
      color: c.texto,
      fontSize: 20,
      fontWeight: "700",
    },
    boton: {
      alignSelf: "flex-start",
      minHeight: 48,
      minWidth: 48,
      justifyContent: "center",
      paddingHorizontal: 18,
      borderRadius: 10,
      backgroundColor: c.primario,
    },
    botonAnadir: {
      alignSelf: "flex-start",
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 18,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
    },
    botonCurso: {
      alignSelf: "flex-start",
      minHeight: 64,
      minWidth: 280,
      justifyContent: "center",
      paddingHorizontal: 22,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
    },
    textoBoton: { fontSize: 16, fontWeight: "700", color: c.textoSobrePrimario },
    textoAnadir: { fontSize: 16, fontWeight: "700", color: c.primario },
  });
