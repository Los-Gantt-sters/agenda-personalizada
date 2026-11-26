// Administración · Menús, dietas y alergias (pantallas 46 y 46b, SCRUM-235 / SCRUM-260).
// 46: lista de alumnos con su tipo de menú y sus alergias. 46b: editar el menú de un alumno (tipo de
// menú, alergias de una lista fija más las que se escriben a mano, y observaciones para Cocina).
// Lo que se guarda aquí lo lee la cocina en el parte diario (54). Sin ventanas emergentes: «Editar»
// abre otra pantalla y «Atrás» vuelve a la lista sin cambiar nada.
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import {
  ALERGENOS_FIJOS,
  IDS_ALERGENOS_FIJOS,
  TIPOS_MENU,
  nombreAlergia,
  nombreTipoMenu,
} from "../../src/componentes/administracion/menus";
import { Pantalla } from "../../src/pantalla";
import {
  guardarMenuAlumno,
  listarMenusAlumnos,
  type MenuAlumno,
} from "../../src/servicios/menusService";
import type { Paleta } from "../../src/temas";
import type { DietaComedor } from "../../src/tipos/alumnos";
import { Icono, Texto, useApariencia, useEstilos } from "../../src/ui";

const ERROR_CARGA = "No se han podido cargar los alumnos. Inténtalo otra vez.";

export default function MenusYAlergias() {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const [alumnos, setAlumnos] = useState<MenuAlumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Edición de un alumno (46b)
  const [editando, setEditando] = useState<MenuAlumno | null>(null);
  const [tipo, setTipo] = useState<DietaComedor>("normal");
  const [alergias, setAlergias] = useState<string[]>([]);
  const [nuevaAlergia, setNuevaAlergia] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [guardadoId, setGuardadoId] = useState<string | null>(null);

  const aplicar = useCallback((r: Awaited<ReturnType<typeof listarMenusAlumnos>>) => {
    if (r.success) setAlumnos(r.data ?? []);
    setErrorCarga(r.success ? null : ERROR_CARGA);
    setCargando(false);
  }, []);

  useEffect(() => {
    let montada = true;
    listarMenusAlumnos().then((r) => montada && aplicar(r));
    return () => {
      montada = false;
    };
  }, [aplicar]);

  function reintentar() {
    setCargando(true);
    setErrorCarga(null);
    void listarMenusAlumnos().then(aplicar);
  }

  const nombreCompleto = (a: MenuAlumno) => [a.nombre, a.apellidos].filter(Boolean).join(" ");

  function abrir(a: MenuAlumno) {
    setEditando(a);
    setTipo(a.dietaComedor);
    setAlergias(a.alergias);
    setNuevaAlergia("");
    setObservaciones(a.observacionesCocina);
    setErrorGuardar(null);
    setGuardadoId(null);
  }

  function alternarAlergia(id: string) {
    setAlergias((actuales) =>
      actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id],
    );
  }

  function anadirAlergia() {
    const texto = nuevaAlergia.trim();
    if (!texto) return;
    setAlergias((actuales) =>
      actuales.some((x) => x.toLowerCase() === texto.toLowerCase())
        ? actuales
        : [...actuales, texto],
    );
    setNuevaAlergia("");
  }

  async function guardar() {
    if (!editando || guardando) return;
    setGuardando(true);
    setErrorGuardar(null);
    // Si dejó una alergia escrita sin pulsar «Añadir», se cuenta igualmente
    const textoPendiente = nuevaAlergia.trim();
    const todas = textoPendiente ? [...alergias, textoPendiente] : alergias;
    const r = await guardarMenuAlumno(editando.id, {
      dietaComedor: tipo,
      alergias: todas,
      observacionesCocina: observaciones,
    });
    setGuardando(false);
    if (!r.success || !r.data) {
      setErrorGuardar(r.error ?? "No se ha podido guardar.");
      return;
    }
    const guardado = r.data;
    setAlumnos((actuales) =>
      actuales.map((a) => (a.id === editando.id ? { ...a, ...guardado } : a)),
    );
    setGuardadoId(editando.id);
    setEditando(null);
  }

  // ---- 46b: editar el menú de un alumno ----
  if (editando) {
    const personalizadas = alergias.filter((x) => !IDS_ALERGENOS_FIJOS.includes(x));
    return (
      <Pantalla
        sinAyuda
        sinAccesibilidad
        titulo={`Menú de ${nombreCompleto(editando)}`}
        simbolo={<Icono nombre="personas" color={colores.primario} tam={36} />}
        alAtras={() => setEditando(null)}
        etiquetaAtras="Atrás: volver a la lista sin cambiar"
        alAdelante={guardando ? null : () => void guardar()}
        textoAdelante="Guardar"
        etiquetaAdelante="Guardar el menú y las alergias"
      >
        <ScrollView contentContainerStyle={estilos.contenido}>
          <Texto style={estilos.detalle}>{editando.aula ?? "Sin aula"}</Texto>

          <Texto style={estilos.titulo}>Tipo de menú</Texto>
          <View style={estilos.rejilla}>
            {TIPOS_MENU.map((t) => (
              <Pressable
                key={t.id}
                style={[estilos.opcion, tipo === t.id && estilos.opcionActiva]}
                accessibilityRole="radio"
                accessibilityState={{ checked: tipo === t.id }}
                accessibilityLabel={t.nombre}
                testID={`tipo-menu-${t.id}`}
                onPress={() => setTipo(t.id)}
              >
                <Texto style={[estilos.textoOpcion, tipo === t.id && estilos.textoOpcionActiva]}>
                  {tipo === t.id ? "✓ " : ""}
                  {t.nombre}
                </Texto>
              </Pressable>
            ))}
          </View>

          <Texto style={estilos.titulo}>Alergias e intolerancias médicas</Texto>
          <View style={estilos.rejilla}>
            {ALERGENOS_FIJOS.map((a) => {
              const marcada = alergias.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  style={[estilos.opcion, marcada && estilos.opcionActiva]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: marcada }}
                  accessibilityLabel={a.nombre}
                  testID={`alergia-${a.id}`}
                  onPress={() => alternarAlergia(a.id)}
                >
                  <Texto style={[estilos.textoOpcion, marcada && estilos.textoOpcionActiva]}>
                    {marcada ? "✓ " : ""}
                    {a.nombre}
                  </Texto>
                </Pressable>
              );
            })}
            {personalizadas.map((a) => (
              <Pressable
                key={a}
                style={[estilos.opcion, estilos.opcionActiva]}
                accessibilityRole="button"
                accessibilityLabel={`Quitar la alergia ${a}`}
                testID={`alergia-libre-${a}`}
                onPress={() => alternarAlergia(a)}
              >
                <Texto style={[estilos.textoOpcion, estilos.textoOpcionActiva]}>✓ {a} ✕</Texto>
              </Pressable>
            ))}
          </View>

          <View style={estilos.filaAnadir}>
            <TextInput
              style={[estilos.campo, estilos.campoAnadir]}
              value={nuevaAlergia}
              onChangeText={setNuevaAlergia}
              onSubmitEditing={anadirAlergia}
              placeholder="Otra alergia (por ejemplo: kiwi)"
              placeholderTextColor={colores.textoSecundario}
              accessibilityLabel="Otra alergia"
              testID="nueva-alergia"
            />
            <Pressable
              style={estilos.boton}
              accessibilityRole="button"
              accessibilityLabel="Añadir alergia"
              testID="anadir-alergia"
              onPress={anadirAlergia}
            >
              <Texto style={estilos.textoBoton}>+ Añadir alergia</Texto>
            </Pressable>
          </View>

          <Texto style={estilos.titulo}>Observaciones para Cocina</Texto>
          <TextInput
            style={[estilos.campo, estilos.campoLargo]}
            value={observaciones}
            onChangeText={setObservaciones}
            multiline
            placeholder="Por ejemplo: servir pan sin gluten precintado"
            placeholderTextColor={colores.textoSecundario}
            accessibilityLabel="Observaciones para Cocina"
            testID="observaciones-cocina"
          />

          {errorGuardar && (
            <View style={estilos.filaIcono}>
              <Icono nombre="alerta" color={colores.peligro} tam={22} />
              <Texto style={estilos.error} accessibilityRole="alert">
                {errorGuardar}
              </Texto>
            </View>
          )}
        </ScrollView>
      </Pantalla>
    );
  }

  // ---- 46: lista de alumnos ----
  return (
    <Pantalla
      sinAyuda
      sinAccesibilidad
      titulo="Menús, dietas y alergias"
      simbolo={<Icono nombre="personas" color={colores.primario} tam={36} />}
    >
      <View style={estilos.pantalla}>
        <Texto style={estilos.detalle}>
          Lo que pongas aquí lo ve la cocina en el parte diario. El alumno del comedor solo anota
          quién falta.
        </Texto>

        {cargando && <Texto style={estilos.estado}>Cargando alumnos…</Texto>}

        {errorCarga && (
          <View style={estilos.filaIcono}>
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

        {!cargando && !errorCarga && alumnos.length === 0 && (
          <Texto style={estilos.estado}>Todavía no hay alumnos dados de alta.</Texto>
        )}

        {!cargando && !errorCarga && (
          <ScrollView contentContainerStyle={estilos.lista}>
            {alumnos.map((a) => (
              <View key={a.id} style={estilos.fila} testID={`fila-${a.id}`}>
                <View style={estilos.columna}>
                  <Texto style={estilos.nombre}>{nombreCompleto(a)}</Texto>
                  <Texto style={estilos.detalle}>{a.aula ?? "Sin aula"}</Texto>
                  {guardadoId === a.id && (
                    <Texto style={estilos.guardado} accessibilityLiveRegion="polite">
                      Guardado
                    </Texto>
                  )}
                </View>
                <View style={estilos.columna}>
                  <Texto style={estilos.detalle}>Tipo de menú</Texto>
                  <Texto style={estilos.valor}>{nombreTipoMenu(a.dietaComedor)}</Texto>
                </View>
                <View style={estilos.columna}>
                  <Texto style={estilos.detalle}>Alergias e intolerancias</Texto>
                  <Texto style={estilos.valor}>
                    {a.alergias.length > 0
                      ? a.alergias.map(nombreAlergia).join(", ")
                      : "Sin alergias"}
                  </Texto>
                </View>
                <Pressable
                  style={estilos.boton}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar el menú de ${nombreCompleto(a)}`}
                  testID={`editar-${a.id}`}
                  onPress={() => abrir(a)}
                >
                  <Texto style={estilos.textoBoton}>Editar</Texto>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo, padding: 16, gap: 12 },
    contenido: { padding: 16, gap: 12, paddingBottom: 32 },
    titulo: { fontSize: 20, fontWeight: "700", color: c.texto, marginTop: 8 },
    estado: { fontSize: 18, color: c.textoSecundario },
    detalle: { fontSize: 15, color: c.textoSecundario },
    error: { fontSize: 16, fontWeight: "700", color: c.peligro },
    guardado: { fontSize: 15, fontWeight: "700", color: c.exito },
    filaIcono: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
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
    columna: { flexGrow: 1, flexBasis: 200, gap: 4 },
    nombre: { fontSize: 20, fontWeight: "700", color: c.texto },
    valor: { fontSize: 18, fontWeight: "700", color: c.texto },
    rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    opcion: {
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    opcionActiva: { borderColor: c.primario, backgroundColor: c.primario },
    textoOpcion: { fontSize: 17, fontWeight: "700", color: c.texto },
    textoOpcionActiva: { color: c.textoSobrePrimario },
    filaAnadir: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
    campo: {
      minHeight: 52,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      color: c.texto,
      fontSize: 18,
    },
    campoAnadir: { flexGrow: 1, flexBasis: 240 },
    campoLargo: { minHeight: 110, paddingTop: 12, textAlignVertical: "top" },
    boton: {
      alignSelf: "flex-start",
      minHeight: 48,
      minWidth: 48,
      justifyContent: "center",
      paddingHorizontal: 18,
      borderRadius: 10,
      backgroundColor: c.primario,
    },
    textoBoton: { fontSize: 16, fontWeight: "700", color: c.textoSobrePrimario },
  });
