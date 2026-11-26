// Panel de Administración · Consola integral (pantalla 48, SCRUM-235 y siguientes).
// Tres accesos arriba (Aulas y clases, Menús y alergias, Nuevo usuario), buscador y filtros
// (Curso, Rol, Aula) y la lista de todos los usuarios del centro. Solo lee: cada cosa se cambia en
// su pantalla. «Nuevo usuario / Perfil» (50b) está dibujado pero todavía no hace nada.
// Sin ventanas emergentes (profesora, noviembre de 2026).
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import {
  FILTROS_ROL,
  filtrarUsuarios,
  NOMBRE_ROL,
  SIN_FILTROS,
  textoAcceso,
  textoVinculos,
  type FiltrosPanel,
} from "../../src/componentes/administracion/panelUsuarios";
import { Pantalla } from "../../src/pantalla";
import { useSesionOpcional } from "../../src/sesion";
import {
  ERROR_PANEL,
  listarUsuariosPanel,
  type DatosPanel,
  type UsuarioPanel,
} from "../../src/servicios/usuariosPanelService";
import { limpiarMultimediaHuerfana } from "../../src/servicios/pasosService";
import type { Paleta } from "../../src/temas";
import { Icono, Texto, useApariencia, useEstilos, type NombreIcono } from "../../src/ui";

const ANCHO_TABLA = 900;
const SIN_DATOS: DatosPanel = { usuarios: [], cursos: [], aulas: [] };

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Pildora({
  texto,
  activa,
  etiqueta,
  alPulsar,
}: {
  texto: string;
  activa: boolean;
  etiqueta: string;
  alPulsar: () => void;
}) {
  const estilos = useEstilos(crearEstilos);
  return (
    <Pressable
      style={[estilos.pildora, activa && estilos.pildoraActiva]}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activa }}
      onPress={alPulsar}
    >
      <Texto style={[estilos.textoPildora, activa && estilos.textoPildoraActiva]}>{texto}</Texto>
    </Pressable>
  );
}

function Acceso({
  icono,
  titulo,
  detalle,
  principal,
  etiqueta,
  alPulsar,
  flecha = true,
  testID,
}: {
  icono: NombreIcono;
  titulo: string;
  detalle: string;
  principal?: "suave" | "lleno";
  etiqueta: string;
  alPulsar?: () => void;
  flecha?: boolean;
  testID: string;
}) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const lleno = principal === "lleno";
  return (
    <Pressable
      style={[
        estilos.acceso,
        principal === "suave" && estilos.accesoSuave,
        lleno && estilos.accesoLleno,
      ]}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={alPulsar ? undefined : "Todavía no está disponible"}
      testID={testID}
      onPress={alPulsar}
    >
      <View style={[estilos.cajaIcono, lleno && estilos.cajaIconoLlena]}>
        <Icono
          nombre={icono}
          color={lleno ? colores.textoSobrePrimario : colores.primario}
          tam={22}
        />
      </View>
      <View style={estilos.textoAcceso}>
        <Texto style={[estilos.tituloAcceso, lleno && estilos.textoSobreLleno]}>{titulo}</Texto>
        <Texto style={[estilos.detalleAcceso, lleno && estilos.textoSobreLleno]}>{detalle}</Texto>
      </View>
      {flecha && <Icono nombre="adelante" color={colores.primario} tam={18} />}
    </Pressable>
  );
}

function Fila({
  u,
  enTabla,
  alEditar,
}: {
  u: UsuarioPanel;
  enTabla: boolean;
  alEditar: () => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const puedeEditar = u.rol === "estudiante";
  return (
    <View style={[estilos.fila, enTabla && estilos.filaTabla]} testID={`usuario-${u.id}`}>
      <Texto style={[estilos.nombre, enTabla && estilos.colUsuario]}>{u.nombre}</Texto>
      <Texto style={[estilos.celda, enTabla && estilos.colRol]}>{NOMBRE_ROL[u.rol]}</Texto>
      <Texto style={[estilos.celda, enTabla && estilos.colCurso]}>
        {u.cursos.length ? u.cursos.join(", ") : "—"}
      </Texto>
      <Texto style={[estilos.celda, enTabla && estilos.colVinculos]}>{textoVinculos(u)}</Texto>
      <Texto style={[estilos.celda, enTabla && estilos.colAcceso]}>{textoAcceso(u)}</Texto>
      <Pressable
        style={[estilos.botonEditar, !puedeEditar && estilos.botonDesactivado]}
        accessibilityRole="button"
        accessibilityLabel={`Editar a ${u.nombre}`}
        accessibilityState={{ disabled: !puedeEditar }}
        accessibilityHint={puedeEditar ? undefined : "Todavía no está disponible"}
        testID={`editar-${u.id}`}
        onPress={puedeEditar ? alEditar : undefined}
      >
        <Texto style={estilos.textoEditar}>Editar</Texto>
      </Pressable>
    </View>
  );
}

export default function PanelAdministracion() {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const router = useRouter();
  const sesion = useSesionOpcional();
  const { width } = useWindowDimensions();
  const enTabla = width >= ANCHO_TABLA;

  const [datos, setDatos] = useState<DatosPanel>(SIN_DATOS);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosPanel>(SIN_FILTROS);

  // Guarda lo que devuelve listarUsuariosPanel (se llama cuando ya ha llegado la respuesta)
  const aplicar = useCallback((r: Awaited<ReturnType<typeof listarUsuariosPanel>>) => {
    if (r.success && r.data) setDatos(r.data);
    setErrorCarga(r.success ? null : ERROR_PANEL);
    setCargando(false);
  }, []);

  useEffect(() => {
    let montada = true;
    listarUsuariosPanel().then((r) => montada && aplicar(r));
    // HU-10: de paso, borra del almacenamiento las fotos y vídeos de tareas que ya no existen.
    void limpiarMultimediaHuerfana();
    return () => {
      montada = false;
    };
  }, [aplicar]);

  function reintentar() {
    setCargando(true);
    setErrorCarga(null);
    void listarUsuariosPanel().then(aplicar);
  }

  const visibles = useMemo(() => filtrarUsuarios(datos.usuarios, filtros), [datos, filtros]);

  const cambiar = (cambios: Partial<FiltrosPanel>) => setFiltros((f) => ({ ...f, ...cambios }));
  const nombreAdmin = sesion?.sesion?.user.fullName;

  async function salir() {
    await sesion?.cerrarSesion();
    router.replace("/");
  }

  return (
    <Pantalla
      sinAyuda
      sinAccesibilidad
      titulo="Panel de Administración · Centro Escolar"
      simbolo={<Icono nombre="escudo" color={colores.primario} tam={32} />}
      derecha={
        sesion ? (
          <View style={estilos.cabeceraDerecha}>
            {nombreAdmin ? (
              <View style={estilos.usuario}>
                <View style={estilos.avatar}>
                  <Texto style={estilos.textoAvatar}>{iniciales(nombreAdmin)}</Texto>
                </View>
                <Texto style={estilos.nombreAdmin}>{nombreAdmin}</Texto>
              </View>
            ) : null}
            <Pressable
              style={estilos.botonSalir}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              onPress={() => void salir()}
            >
              <Icono nombre="salir" color={colores.primario} tam={22} />
              <Texto style={estilos.textoSalir}>Salir</Texto>
            </Pressable>
          </View>
        ) : null
      }
    >
      <View style={estilos.pantalla}>
        <View style={estilos.accesos}>
          <Acceso
            icono="paleta"
            titulo="1. Aulas y Clases (01)"
            detalle="Nombre y forma/picto de las 9+ aulas"
            principal="suave"
            etiqueta="Ir a configurar aulas y clases"
            alPulsar={() => router.push("/admin/aulas")}
            testID="acceso-aulas"
          />
          <Acceso
            icono="cubiertos"
            titulo="2. Menús y Alergias"
            detalle="Dietas por alumno para Cocina (54)"
            etiqueta="Ir a menús, dietas y alergias"
            alPulsar={() => router.push("/admin/menus")}
            testID="acceso-menus"
          />
          <Acceso
            icono="mas"
            titulo="3. Nuevo Usuario / Perfil"
            detalle="Alta de alumno, tutor, familia o cocina"
            principal="lleno"
            etiqueta="Nuevo usuario o perfil"
            flecha={false}
            testID="acceso-nuevo-usuario"
          />
        </View>

        <View style={estilos.tarjetaFiltros}>
          <View style={estilos.campoBuscar}>
            <Icono nombre="buscar" color={colores.primario} tam={18} />
            <TextInput
              style={estilos.inputBuscar}
              value={filtros.texto}
              onChangeText={(t) => cambiar({ texto: t })}
              placeholder="Buscar usuario por nombre, correo, aula o dieta…"
              placeholderTextColor={colores.textoSecundario}
              accessibilityLabel="Buscar usuario por nombre, correo, aula o dieta"
              testID="buscar-usuario"
            />
          </View>

          <View style={estilos.filaFiltro}>
            <Texto style={estilos.etiquetaFiltro}>Curso:</Texto>
            <Pildora
              texto="Todos"
              activa={filtros.curso === null}
              etiqueta="Mostrar todos los cursos"
              alPulsar={() => cambiar({ curso: null })}
            />
            {datos.cursos.map((c) => (
              <Pildora
                key={c}
                texto={c}
                activa={filtros.curso === c}
                etiqueta={`Solo el curso ${c}`}
                alPulsar={() => cambiar({ curso: c })}
              />
            ))}
          </View>

          <View style={estilos.filaFiltro}>
            <Texto style={estilos.etiquetaFiltro}>Rol:</Texto>
            <Pildora
              texto={`Todos (${datos.usuarios.length})`}
              activa={filtros.rol === null}
              etiqueta="Mostrar todos los roles"
              alPulsar={() => cambiar({ rol: null })}
            />
            {FILTROS_ROL.map((r) => (
              <Pildora
                key={r.id}
                texto={r.nombre}
                activa={filtros.rol === r.id}
                etiqueta={`Solo ${r.nombre.toLowerCase()}`}
                alPulsar={() => cambiar({ rol: r.id })}
              />
            ))}
          </View>

          <View style={estilos.filaFiltro}>
            <Texto style={estilos.etiquetaFiltro}>Aula:</Texto>
            <Pildora
              texto="Todas"
              activa={filtros.aula === null}
              etiqueta="Mostrar todas las aulas"
              alPulsar={() => cambiar({ aula: null })}
            />
            {datos.aulas.map((a) => (
              <Pildora
                key={a}
                texto={a}
                activa={filtros.aula === a}
                etiqueta={`Solo el aula ${a}`}
                alPulsar={() => cambiar({ aula: a })}
              />
            ))}
          </View>
        </View>

        {cargando && <Texto style={estilos.estado}>Cargando usuarios…</Texto>}

        {errorCarga && (
          <View style={estilos.filaError}>
            <Icono nombre="alerta" color={colores.peligro} tam={22} />
            <Texto style={estilos.error} accessibilityRole="alert">
              {errorCarga}
            </Texto>
            <Pressable
              style={estilos.botonEditar}
              accessibilityRole="button"
              accessibilityLabel="Reintentar la carga"
              onPress={reintentar}
            >
              <Texto style={estilos.textoEditar}>Reintentar</Texto>
            </Pressable>
          </View>
        )}

        {!cargando && !errorCarga && visibles.length === 0 && (
          <Texto style={estilos.estado}>
            {datos.usuarios.length === 0
              ? "Todavía no hay usuarios."
              : "Ningún usuario coincide con la búsqueda."}
          </Texto>
        )}

        {!cargando && !errorCarga && visibles.length > 0 && (
          <ScrollView contentContainerStyle={estilos.lista}>
            {enTabla && (
              <View style={[estilos.fila, estilos.filaTabla, estilos.cabeceraTabla]}>
                <Texto style={[estilos.titulo, estilos.colUsuario]}>USUARIO</Texto>
                <Texto style={[estilos.titulo, estilos.colRol]}>ROL</Texto>
                <Texto style={[estilos.titulo, estilos.colCurso]}>CURSO</Texto>
                <Texto style={[estilos.titulo, estilos.colVinculos]}>
                  AULA Y VÍNCULOS (TUTOR / FAMILIA)
                </Texto>
                <Texto style={[estilos.titulo, estilos.colAcceso]}>MENÚ / ACCESO</Texto>
                <View style={estilos.huecoEditar} />
              </View>
            )}
            {visibles.map((u) => (
              <Fila
                key={u.id}
                u={u}
                enTabla={enTabla}
                alEditar={() => router.push("/admin/vinculos")}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo, padding: 12, gap: 10 },
    cabeceraDerecha: { flexDirection: "row", alignItems: "center", gap: 10 },
    usuario: { flexDirection: "row", alignItems: "center", gap: 8 },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primario,
    },
    textoAvatar: { fontSize: 14, fontWeight: "700", color: c.textoSobrePrimario },
    nombreAdmin: { fontSize: 16, fontWeight: "700", color: c.texto },
    botonSalir: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
    },
    textoSalir: { fontSize: 16, fontWeight: "700", color: c.primario },

    accesos: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    acceso: {
      flexGrow: 1,
      flexBasis: 240,
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    accesoSuave: { borderColor: c.primario, backgroundColor: c.superficieDestacada },
    accesoLleno: { borderColor: c.primario, backgroundColor: c.primario },
    cajaIcono: {
      width: 42,
      height: 42,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.superficieDestacada,
    },
    cajaIconoLlena: { backgroundColor: "rgba(255,255,255,0.18)" },
    textoAcceso: { flex: 1 },
    tituloAcceso: { fontSize: 16, fontWeight: "700", color: c.texto },
    detalleAcceso: { fontSize: 14, color: c.textoSecundario },
    textoSobreLleno: { color: c.textoSobrePrimario },

    tarjetaFiltros: {
      gap: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    campoBuscar: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.fondo,
    },
    inputBuscar: { flex: 1, minHeight: 40, fontSize: 16, color: c.texto },
    filaFiltro: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
    etiquetaFiltro: { fontSize: 15, fontWeight: "700", color: c.texto },
    pildora: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 14,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    pildoraActiva: { borderColor: c.primario, backgroundColor: c.primario },
    textoPildora: { fontSize: 15, fontWeight: "700", color: c.texto },
    textoPildoraActiva: { color: c.textoSobrePrimario },

    estado: { fontSize: 18, color: c.textoSecundario },
    filaError: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
    error: { fontSize: 16, fontWeight: "700", color: c.peligro },

    lista: { gap: 8, paddingBottom: 24 },
    fila: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    filaTabla: { flexWrap: "nowrap", gap: 12 },
    cabeceraTabla: { borderWidth: 0, backgroundColor: c.fondo, paddingVertical: 4 },
    titulo: { fontSize: 13, fontWeight: "700", color: c.textoSecundario },
    nombre: { fontSize: 17, fontWeight: "700", color: c.texto, minWidth: 160 },
    celda: { fontSize: 15, color: c.texto },
    colUsuario: { flex: 1.3 },
    colRol: { flex: 1 },
    colCurso: { flex: 0.9 },
    colVinculos: { flex: 2.4 },
    colAcceso: { flex: 1.5 },
    huecoEditar: { width: 96 },
    botonEditar: {
      minHeight: 48,
      minWidth: 96,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
    },
    botonDesactivado: { opacity: 0.45 },
    textoEditar: { fontSize: 16, fontWeight: "700", color: c.primario },
  });
