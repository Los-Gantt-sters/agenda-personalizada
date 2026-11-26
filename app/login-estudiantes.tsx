// Acceso del alumnado (HU-01). Es la primera pantalla de la app: ya no hay pantalla de bienvenida,
// que era un toque más para quien tiene dificultades motoras. Tres pasos, cada uno a pantalla
// completa y sin scroll:
//   1. ¿Cuál es tu clase?  → toca la forma de la clase. Desde aquí entran también los adultos.
//      (pantallas 01 y 01b: 9 clases por página y «Más aulas», MOD HU-01 · SCRUM-247)
//   2. Clase Triángulo     → busca tu foto o dibujo y tócalo.
//      (pantallas 02 y 02b: 9 alumnos por página y «Más alumnos»)
//   Las clases y los alumnos salen de la base de datos (lo que configura el administrador en la 48b,
//   SCRUM-249). Sin Supabase configurado, o si falla, se usan los datos de prueba (CLASES).
//   3. ¿Eres Alejandro?    → toca tus 3 dibujos y pulsa «Entrar».
// «Atrás» y «Adelante» van siempre en la barra de abajo (componente Pantalla).
// Sin «Ayuda» en estos tres pasos (petición de la profesora): el hueco de la izquierda se queda
// vacío para que las flechas no se muevan de sitio.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import {
  CLASES,
  ESTUDIANTES_MOCK,
  Estudiante,
  Clase,
  LONGITUD_SECUENCIA_DIBUJOS,
} from "../src/tipos/estudiante";
import {
  AvatarEstudiante,
  CredencialDibujos,
  CuadriculaEstudiantes,
  CuadriculaPaginada,
} from "../src/componentes/autenticacion";
import { IconoAula } from "../src/componentes/administracion/IconoAula";
import {
  obtenerAlumnosAcceso,
  obtenerAulasAcceso,
  usaBaseDatos,
  type AlumnoAcceso,
  type AulaAcceso,
} from "../src/servicios/accesoAlumnosService";
import { signInEstudianteConDibujos } from "../src/servicios/authService";
import { destinoTrasLoginAlumno } from "../src/servicios/destinoAgendaAlumno";
import { reproducirSonido } from "../src/servicios/sonidos";
import {
  obtenerAlumnoTableta,
  olvidarAlumnoTableta,
  recordarAlumnoTableta,
} from "../src/servicios/tabletaPersonal";
import type { AuthResult } from "../src/tipos/auth";
import type { Paleta } from "../src/temas";
import { Pantalla } from "../src/pantalla";
import {
  FormaClase,
  Icono,
  LogoColegio,
  PictogramaInterfaz,
  Texto,
  useApariencia,
  useEstilos,
} from "../src/ui";

/** Nombre de la clase en pantalla: el del administrador o, en las de prueba, «Clase <nombre>». */
const nombreDeClase = (c: Clase) => c.nombreVisible ?? `Clase ${c.nombre}`;

const aulaAClase = (a: AulaAcceso): Clase => ({
  id: a.id,
  nombre: a.nombre,
  nombreVisible: a.nombre,
  simbolo: "",
  iconoForma: a.iconoForma,
  iconoUrl: a.iconoUrl,
});

const alumnoAEstudiante = (a: AlumnoAcceso, aulaId: string): Estudiante => ({
  id: a.id,
  nombre: a.nombre,
  nombreCompleto: a.nombre,
  claseId: aulaId,
  icono: a.icono ?? "⭐",
  color: a.color ?? "",
});

/** Datos que llegan de la base de datos: mientras llegan, si fallan o ya están. */
type Carga<T> = { estado: "cargando" } | { estado: "error" } | { estado: "ok"; datos: T };

/** Forma o dibujo de la clase: el que configuró el administrador o, en las de prueba, su forma. */
function SimboloClase({ clase, tam }: { clase: Clase; tam: number }) {
  if (clase.nombreVisible !== undefined) {
    return <IconoAula iconoForma={clase.iconoForma} iconoUrl={clase.iconoUrl} tam={tam} />;
  }
  return <FormaClase claseId={clase.id} simbolo={clase.simbolo} tam={tam} />;
}

// Mensaje del prototipo (pantalla 04): amable y sin decir si el alumno existe (RF1.8)
const MENSAJE_SECUENCIA_INCORRECTA = "No es esa. Prueba otra vez";

export interface LoginEstudiantesScreenProps {
  /**
   * Callback opcional para conectar con SCRUM-51 (Jaime / signInEstudianteConDibujos).
   * Recibe el identificador del alumno y el array con los 3 dibujos seleccionados.
   */
  alCompletarCredencialVisual?: (
    alumnoId: string,
    secuenciaDibujos: string[],
  ) => Promise<void> | void;
  /**
   * Modo tableta personal (T-01.3): la tableta recuerda al último alumno que entró y abre
   * directamente su contraseña de 3 dibujos. En tabletas compartidas del aula se deja a false.
   */
  modoTabletaPersonal?: boolean;
}

export default function LoginEstudiantesScreen({
  alCompletarCredencialVisual,
  modoTabletaPersonal = process.env.EXPO_PUBLIC_MODO_TABLETA_PERSONAL === "true",
}: LoginEstudiantesScreenProps = {}) {
  const router = useRouter();
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [clase, setClase] = useState<Clase | null>(null);
  // Clase de la que se acaba de volver: «Adelante» lleva otra vez a ella.
  const [claseAnterior, setClaseAnterior] = useState<Clase | null>(null);
  const [alumno, setAlumno] = useState<Estudiante | null>(null);
  const [secuencia, setSecuencia] = useState<string[]>([]);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [comprobando, setComprobando] = useState(false);
  // Página de clases y de alumnos que se ve (0 = la primera), para «Página 2» y para volver a ella
  const [paginaClases, setPaginaClases] = useState(0);
  const [paginaAlumnos, setPaginaAlumnos] = useState(0);

  // SCRUM-249: aulas de la base de datos. Sin Supabase (pruebas, demos) se usan las de prueba; con
  // Supabase, nunca: si fallan, se avisa y se deja volver a probar.
  const [aulasBD, setAulasBD] = useState<Carga<Clase[]> | null>(() =>
    usaBaseDatos() ? { estado: "cargando" } : null,
  );
  // Alumnos de la base de datos del aula abierta. aulaPedida evita que la respuesta de un aula que
  // ya se ha dejado (el alumno volvió y tocó otra) pise la del aula abierta.
  const [alumnosBD, setAlumnosBD] = useState<({ aulaId: string } & Carga<Estudiante[]>) | null>(
    null,
  );
  const aulaPedida = useRef<string | null>(null);

  const clases = aulasBD?.estado === "ok" ? aulasBD.datos : Object.values(CLASES);
  const esDeBaseDatos = (c: Clase) => c.nombreVisible !== undefined;
  const cargaAlumnos =
    clase && esDeBaseDatos(clase) && alumnosBD?.aulaId === clase.id ? alumnosBD : null;
  const alumnosDeClase = !clase
    ? []
    : esDeBaseDatos(clase)
      ? cargaAlumnos?.estado === "ok"
        ? cargaAlumnos.datos
        : []
      : ESTUDIANTES_MOCK.filter((s) => s.claseId === clase.id);

  // Pantalla 01: las aulas que ha configurado el administrador (48b), en su orden
  const montado = useRef(true);
  useEffect(
    () => () => {
      montado.current = false;
    },
    [],
  );
  // Pide las aulas; el estado «cargando» lo pone quien la llama (al abrir, ya empieza así)
  const pedirAulas = useCallback(() => {
    if (!usaBaseDatos()) return;
    obtenerAulasAcceso().then((r) => {
      if (!montado.current) return;
      if (r.estado === "ok") setAulasBD({ estado: "ok", datos: r.datos.map(aulaAClase) });
      else if (r.estado === "error") setAulasBD({ estado: "error" });
      else setAulasBD(null); // sin Supabase: datos de prueba
    });
  }, []);
  useEffect(pedirAulas, [pedirAulas]);
  const volverAPedirAulas = () => {
    setAulasBD({ estado: "cargando" });
    pedirAulas();
  };

  /** Pide los alumnos de un aula de la base de datos (pantalla 02). Los errores no se guardan. */
  const cargarAlumnos = (c: Clase) => {
    aulaPedida.current = c.id;
    setAlumnosBD({ aulaId: c.id, estado: "cargando" });
    obtenerAlumnosAcceso(c.id).then((r) => {
      if (!montado.current || aulaPedida.current !== c.id) return; // ya se abrió otra aula
      setAlumnosBD(
        r.estado === "ok"
          ? { aulaId: c.id, estado: "ok", datos: r.datos.map((a) => alumnoAEstudiante(a, c.id)) }
          : { aulaId: c.id, estado: "error" },
      );
    });
  };

  // Modo tableta personal: si la tableta recuerda a un alumno, se abre directamente su contraseña.
  // Con la base de datos (SCRUM-249) se espera a tener las aulas y se busca al alumno entre los de
  // su aula (la tableta guarda las dos cosas); sin ella, entre los datos de prueba. Solo una vez.
  const tabletaRevisada = useRef(false);
  useEffect(() => {
    if (!modoTabletaPersonal || tabletaRevisada.current) return;
    // Aún no se sabe qué aulas hay (o fallaron: se revisa cuando el alumno vuelva a probar)
    if (aulasBD?.estado === "cargando" || aulasBD?.estado === "error") return;
    tabletaRevisada.current = true;
    const aulas = aulasBD?.estado === "ok" ? aulasBD.datos : null;

    obtenerAlumnoTableta().then(async (recordado) => {
      if (!montado.current || !recordado) return;
      if (!aulas) {
        const deprueba = ESTUDIANTES_MOCK.find((x) => x.id === recordado.alumnoId);
        if (!deprueba) return;
        setClase(Object.values(CLASES).find((c) => c.id === deprueba.claseId) ?? null);
        setAlumno(deprueba);
        return;
      }
      const aula = aulas.find((c) => c.id === recordado.aulaId);
      // Aula que ya no existe (o guardado de antes de SCRUM-249): se olvida y sigue el flujo normal
      if (!aula) return void olvidarAlumnoTableta();
      aulaPedida.current = aula.id;
      const r = await obtenerAlumnosAcceso(aula.id);
      // Si mientras tanto el alumno ha tocado un aula, manda lo que ha tocado
      if (!montado.current || aulaPedida.current !== aula.id || r.estado !== "ok") return;
      const alumnos = r.datos.map((a) => alumnoAEstudiante(a, aula.id));
      const encontrado = alumnos.find((x) => x.id === recordado.alumnoId);
      // Ya no está en esa aula (cambio de aula, baja…): se olvida. Si la petición falló, no se
      // sabe, y por eso arriba se sale sin olvidar.
      if (!encontrado) return void olvidarAlumnoTableta();
      setAlumnosBD({ aulaId: aula.id, estado: "ok", datos: alumnos });
      setClase(aula);
      setAlumno(encontrado);
    });
  }, [modoTabletaPersonal, aulasBD]);

  /**
   * Abre las fotos de una clase; si es de la base de datos, pide sus alumnos (pantalla 02).
   * Al tocar una clase se empieza en su página 1; con «Adelante» se vuelve a la página en la que
   * se estaba (mantenerPagina), como al volver de la contraseña.
   */
  const abrirClase = (c: Clase, mantenerPagina = false) => {
    if (!mantenerPagina) setPaginaAlumnos(0);
    setClase(c);
    if (!esDeBaseDatos(c)) return;
    // Si ya estaban (se vuelve a la misma aula), no se piden otra vez
    if (alumnosBD?.aulaId === c.id && alumnosBD.estado === "ok") {
      aulaPedida.current = c.id;
      return;
    }
    cargarAlumnos(c);
  };

  const elegirClase = (c: Clase) => {
    reproducirSonido("toque"); // T-01.3: feedback sonoro al pulsar
    abrirClase(c);
  };

  // La tarjeta de la foto ya suena al tocarla (TarjetaEstudiante)
  const elegirAlumno = (a: Estudiante) => {
    setMensajeError(null);
    setSecuencia([]);
    setAlumno(a);
  };

  const cambiarSecuencia = (nueva: string[]) => {
    // Al volver a tocar dibujos tras un fallo, el aviso ya ha cumplido: se quita.
    if (nueva.length > secuencia.length) setMensajeError(null);
    setSecuencia(nueva);
  };

  // «No soy yo»: la tableta deja de recordar a este alumno y se vuelve a las fotos de la clase.
  const noSoyYo = () => {
    if (modoTabletaPersonal) void olvidarAlumnoTableta();
    setMensajeError(null);
    setSecuencia([]);
    setAlumno(null);
  };

  const volverAClases = () => {
    setClaseAnterior(clase);
    setClase(null);
    setAlumno(null);
  };

  const entrar = async () => {
    if (!alumno || secuencia.length !== LONGITUD_SECUENCIA_DIBUJOS || comprobando) return;
    reproducirSonido("acierto");
    const dibujos = secuencia;

    if (alCompletarCredencialVisual) {
      if (modoTabletaPersonal) await recordarAlumnoTableta(alumno.id, alumno.claseId);
      await alCompletarCredencialVisual(alumno.id, dibujos);
      return;
    }

    // SCRUM-51: Supabase Auth comprueba la secuencia; la app nunca conoce la correcta
    setComprobando(true);
    let resultado: AuthResult | null = null;
    try {
      resultado = await signInEstudianteConDibujos(alumno.id, dibujos);
    } catch {
      // Sin conexión u otro fallo: para el alumno es igual que una secuencia incorrecta
      resultado = null;
    }
    setComprobando(false);

    if (!resultado?.success) {
      setMensajeError(MENSAJE_SECUENCIA_INCORRECTA);
      setSecuencia([]);
      return;
    }

    setMensajeError(null);
    // La tableta solo recuerda al alumno cuando ha entrado de verdad
    if (modoTabletaPersonal) await recordarAlumnoTableta(alumno.id, alumno.claseId);
    // SCRUM-227: a SU agenda con sus datos, semanal o diaria según su preferencia (HU-01 → HU-06).
    // replace: con «atrás» no se vuelve a la pantalla de acceso
    router.replace((await destinoTrasLoginAlumno(alumno.id)) as Href);
  };

  // ---- Paso 3: contraseña de 3 dibujos ----
  if (clase && alumno) {
    const completa = secuencia.length === LONGITUD_SECUENCIA_DIBUJOS;
    return (
      <Pantalla
        titulo={`¿Eres ${alumno.nombre}?`}
        simbolo={<AvatarEstudiante estudiante={alumno} />}
        alAtras={noSoyYo}
        etiquetaAtras="Atrás: no soy yo, volver a las fotos de la clase"
        alAdelante={completa && !comprobando ? () => void entrar() : null}
        etiquetaAdelante="Adelante: entrar"
        conSonido
        sinAyuda
      >
        <CredencialDibujos
          estudiante={alumno}
          secuencia={secuencia}
          alCambiarSecuencia={cambiarSecuencia}
          alEntrar={() => void entrar()}
          mensajeError={mensajeError}
          comprobando={comprobando}
        />
      </Pantalla>
    );
  }

  // ---- Paso 2: fotos de la clase ----
  if (clase) {
    return (
      <Pantalla
        titulo={nombreDeClase(clase)}
        simbolo={<SimboloClase clase={clase} tam={40} />}
        alAtras={volverAClases}
        etiquetaAtras="Atrás: elegir otra clase"
        conSonido
        sinAyuda
      >
        <View style={e.paso}>
          {/* Instrucción: texto con dibujo, sin borde ni fondo para que no parezca un botón */}
          <Instruccion texto="Busca tu foto o tu dibujo y tócalo" pagina={paginaAlumnos} />
          {cargaAlumnos?.estado === "cargando" ? (
            <AvisoCarga tipo="cargando" />
          ) : cargaAlumnos?.estado === "error" ? (
            <AvisoCarga
              tipo="error"
              texto="No se han podido cargar los alumnos de esta clase."
              alVolverAProbar={() => cargarAlumnos(clase)}
            />
          ) : (
            <CuadriculaEstudiantes
              key={clase.id}
              estudiantes={alumnosDeClase}
              alSeleccionarEstudiante={elegirAlumno}
              paginaInicial={paginaAlumnos}
              alCambiarPagina={setPaginaAlumnos}
            />
          )}
        </View>
      </Pantalla>
    );
  }

  // ---- Paso 1: elegir clase (primera pantalla de la app) ----
  return (
    <Pantalla
      titulo="¿Cuál es tu clase?"
      simbolo={<PictogramaInterfaz nombre="colegio" etiqueta="colegio" tam={48} />}
      derecha={<LogoColegio ancho={190} />}
      alAtras={null}
      alAdelante={claseAnterior ? () => abrirClase(claseAnterior, true) : null}
      etiquetaAdelante={claseAnterior ? `Adelante: ${nombreDeClase(claseAnterior)}` : undefined}
      conSonido
      sinAyuda
    >
      <View style={e.paso}>
        <Instruccion texto="Toca la forma de tu clase" pagina={paginaClases} />

        {aulasBD?.estado === "cargando" ? (
          <AvisoCarga tipo="cargando" />
        ) : aulasBD?.estado === "error" ? (
          <AvisoCarga
            tipo="error"
            texto="No se han podido cargar las clases."
            alVolverAProbar={volverAPedirAulas}
          />
        ) : (
          <CuadriculaPaginada
            elementos={clases}
            clave={(c) => c.id}
            queHayMas="aulas"
            paginaInicial={paginaClases}
            alCambiarPagina={setPaginaClases}
            testID="selector-clases-estudiante"
            pintar={(c) => (
              <TouchableOpacity
                style={e.tarjetaClase}
                accessibilityRole="button"
                accessibilityLabel={nombreDeClase(c)}
                testID={`tarjeta-clase-${c.id}`}
                onPress={() => elegirClase(c)}
              >
                <SimboloClase clase={c} tam={52} />
                <Texto style={e.nombreClase}>{nombreDeClase(c)}</Texto>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Los adultos (tutores, familias, administración y cocina) entran desde aquí */}
        <TouchableOpacity
          style={e.accesoAdultos}
          onPress={() => {
            reproducirSonido("toque");
            router.push("/login");
          }}
          accessibilityRole="button"
          accessibilityLabel="Acceso para tutores, familias, administración y cocina"
          testID="btn-acceso-supervisores"
        >
          <Icono nombre="llave" color={colores.primario} tam={26} />
          <Texto style={e.textoAdultos}>Tutores, familias, administración y cocina</Texto>
        </TouchableOpacity>
      </View>
    </Pantalla>
  );
}

/**
 * Instrucción de los pasos 1 y 2: dibujo de «tocar» y texto, sin borde ni fondo para que no parezca
 * un botón. En las páginas siguientes, la marca «Página 2» (pantallas 01b y 02b).
 */
function Instruccion({ texto, pagina }: { texto: string; pagina: number }) {
  const e = useEstilos(crearEstilos);
  return (
    <View style={e.instruccion}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <PictogramaInterfaz nombre="tocar" etiqueta="tocar" tam={52} />
      </View>
      <Texto style={e.textoInstruccion}>{texto}</Texto>
      {pagina > 0 ? (
        <View style={e.marcaPagina} testID="marca-pagina">
          <Texto style={e.textoMarcaPagina}>{`Página ${pagina + 1}`}</Texto>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Mientras llegan las clases o los alumnos de la base de datos, o si no han llegado (SCRUM-249).
 * El error se explica con icono y texto, y se puede volver a probar con un botón grande.
 */
function AvisoCarga({
  tipo,
  texto,
  alVolverAProbar,
}: {
  tipo: "cargando" | "error";
  texto?: string;
  alVolverAProbar?: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  if (tipo === "cargando") {
    return (
      <View style={e.aviso} testID="aviso-cargando" accessibilityLiveRegion="polite">
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <PictogramaInterfaz nombre="esperar" etiqueta="esperar" tam={72} />
        </View>
        <Texto style={e.textoAviso}>Cargando…</Texto>
      </View>
    );
  }
  return (
    <View style={e.aviso} testID="aviso-error-carga" accessibilityRole="alert">
      <View style={e.filaAviso}>
        <Icono nombre="alerta" color={colores.peligro} tam={32} grosor={2.8} />
        <Texto style={[e.textoAviso, { color: colores.peligro }]}>{texto}</Texto>
      </View>
      <TouchableOpacity
        style={e.botonVolverAProbar}
        accessibilityRole="button"
        accessibilityLabel="Volver a probar"
        testID="btn-volver-a-probar"
        onPress={() => {
          reproducirSonido("toque");
          alVolverAProbar?.();
        }}
      >
        <Icono nombre="adelante" color={colores.textoSobrePrimario} tam={30} grosor={3} />
        <Texto style={e.textoVolverAProbar}>Volver a probar</Texto>
      </TouchableOpacity>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    paso: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      padding: 20,
    },
    instruccion: { flexDirection: "row", alignItems: "center", gap: 14 },
    textoInstruccion: { fontSize: 26, fontWeight: "700", color: c.texto },
    marcaPagina: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    textoMarcaPagina: { fontSize: 16, fontWeight: "700", color: c.primario },
    // Tarjeta horizontal de la pantalla 01: forma (o dibujo) a la izquierda y nombre a la derecha
    tarjetaClase: {
      width: "100%",
      minHeight: 120,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    nombreClase: { fontSize: 22, fontWeight: "700", color: c.texto, flexShrink: 1 },
    accesoAdultos: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    textoAdultos: { fontSize: 17, fontWeight: "700", color: c.texto },
    aviso: { minHeight: 240, alignItems: "center", justifyContent: "center", gap: 20 },
    filaAviso: { flexDirection: "row", alignItems: "center", gap: 12 },
    textoAviso: { fontSize: 24, fontWeight: "700", color: c.texto, textAlign: "center" },
    botonVolverAProbar: {
      minWidth: 280,
      minHeight: 120,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor: c.primario,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    textoVolverAProbar: { fontSize: 26, fontWeight: "700", color: c.textoSobrePrimario },
  });
