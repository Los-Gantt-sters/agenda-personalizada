// Pantalla 28s: editor de pasos y multimedia (SCRUM-95 · T-10.2, HU-10).
// Igual para el tutor y para la familia, sin pestañas arriba. Según el boceto definitivo:
// - Cabecera «Crear o editar tarea · Pasos y multimedia», con el nombre del adulto y «Salir».
// - A la izquierda, la lista ordenable de pasos («Pasos de la tarea (N)», «Añadir paso»); cada fila
//   lleva el dibujo, «Paso N: título» y qué formatos tiene. Abajo, «Subir», «Bajar» y «Quitar».
// - A la derecha, el paso elegido: título corto, texto en Lectura Fácil (el que se ve en 07b) y 4
//   tarjetas: pictograma (ARASAAC + propios, «Elegir pictograma» → 28p), foto real, vídeo y audio.
// - Abajo, «Atrás» (→ 28) y «Guardar» (→ 28ok).
// Las fotos se comprimen y todo se valida antes de subir (T-10.3, compresionMultimedia). Mientras
// no se pulse «Guardar» no cambia nada de la tarea: los archivos ya subidos que no se guardan se
// quedan sin usar en el bucket.
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import type { FormatoPaso, PasoTarea } from "../agenda/tipos";
import { Pantalla } from "../../pantalla/Pantalla";
import type { Paleta } from "../../temas";
import {
  FORMA,
  Icono,
  Texto,
  colorSobre,
  useApariencia,
  useEstilos,
  type NombreIcono,
} from "../../ui";
import { formatosDelPaso, tituloDe } from "./formatosPaso";
import { SelectorPictograma28p } from "./SelectorPictograma28p";
import {
  LIMITES,
  prepararMultimedia,
  textoTamano,
  type TipoMultimedia,
} from "../../servicios/compresionMultimedia";
import type { RepositorioPasos } from "../../servicios/pasosService";

/** Longitud máxima del título corto (la de pasos_tarea.titulo). */
export const MAX_TITULO_PASO = 80;

interface Fila {
  /** Clave estable para React aunque el paso aún no tenga id. */
  clave: string;
  paso: PasoTarea;
}

let contadorClaves = 0;
const nuevaClave = () => `f${++contadorClaves}`;

const ABREVIATURAS: Record<FormatoPaso, string> = {
  pictograma: "Picto",
  texto: "Texto",
  foto: "Foto",
  video: "Vídeo",
  audio: "Audio",
};

/** Pide un archivo al navegador (solo web). null si se cancela. */
function elegirArchivo(tipo: TipoMultimedia): Promise<Blob | null> {
  if (Platform.OS !== "web" || typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolver) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = LIMITES[tipo].tiposMime.join(",");
    input.onchange = () => resolver(input.files?.[0] ?? null);
    input.oncancel = () => resolver(null);
    input.click();
  });
}

/** Grabación de voz con el micrófono (solo web, MediaRecorder). */
function useGrabadora() {
  const [grabando, setGrabando] = useState(false);
  const grabadora = useRef<MediaRecorder | null>(null);
  const disponible =
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";

  const empezar = async (alTerminar: (audio: Blob) => void) => {
    const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
    const r = new MediaRecorder(flujo);
    const trozos: Blob[] = [];
    r.ondataavailable = (ev) => trozos.push(ev.data);
    r.onstop = () => {
      flujo.getTracks().forEach((t) => t.stop());
      setGrabando(false);
      alTerminar(new Blob(trozos, { type: r.mimeType || "audio/webm" }));
    };
    grabadora.current = r;
    r.start();
    setGrabando(true);
  };
  const parar = () => grabadora.current?.stop();
  useEffect(() => () => grabadora.current?.stop(), []);
  return { disponible, grabando, empezar, parar };
}

export function EditorPasos28s({
  tareaId,
  repo,
  pasosIniciales,
  nombreAdulto,
  alAtras,
  alSalir,
  onGuardado,
}: {
  tareaId: string;
  repo: RepositorioPasos;
  /** Pasos con los que se abre; si no se dan, se leen del repositorio. */
  pasosIniciales?: PasoTarea[];
  /** Nombre del tutor o familiar en la cabecera («Carmen Ruiz»). */
  nombreAdulto?: string;
  /** «Atrás» (→ 28). */
  alAtras: () => void;
  /** «Salir» de la cabecera (cerrar sesión). */
  alSalir?: () => void;
  /** Tras guardar bien (→ 28ok). */
  onGuardado: (pasos: PasoTarea[]) => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [filas, setFilas] = useState<Fila[] | null>(
    pasosIniciales ? pasosIniciales.map((paso) => ({ clave: nuevaClave(), paso })) : null,
  );
  const [elegido, setElegido] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState<TipoMultimedia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eligiendoPicto, setEligiendoPicto] = useState(false);
  const grabadora = useGrabadora();

  useEffect(() => {
    if (filas) return;
    let vivo = true;
    repo
      .obtenerPasos(tareaId)
      .then((pasos) => vivo && setFilas(pasos.map((paso) => ({ clave: nuevaClave(), paso }))))
      .catch(() => {
        if (!vivo) return;
        setFilas([]);
        setError("No se han podido cargar los pasos. Revisa la conexión.");
      });
    return () => {
      vivo = false;
    };
  }, [filas, repo, tareaId]);

  const lista = filas ?? [];
  const actual = lista[Math.min(elegido, lista.length - 1)];

  const cambiarPaso = (cambios: Partial<PasoTarea>) =>
    setFilas((fs) =>
      (fs ?? []).map((f, i) => (i === elegido ? { ...f, paso: { ...f.paso, ...cambios } } : f)),
    );

  const anadir = () => {
    setFilas((fs) => [
      ...(fs ?? []),
      { clave: nuevaClave(), paso: { orden: (fs?.length ?? 0) + 1, titulo: "", texto: "" } },
    ]);
    setElegido(lista.length);
  };
  const mover = (delta: -1 | 1) => {
    const destino = elegido + delta;
    if (destino < 0 || destino >= lista.length) return;
    setFilas((fs) => {
      const copia = [...(fs ?? [])];
      [copia[elegido], copia[destino]] = [copia[destino], copia[elegido]];
      return copia;
    });
    setElegido(destino);
  };
  const quitar = () => {
    if (!actual) return;
    setFilas((fs) => (fs ?? []).filter((_, i) => i !== elegido));
    setElegido((i) => Math.max(0, Math.min(i, lista.length - 2)));
  };

  const subir = async (tipo: TipoMultimedia, archivo: Blob | null) => {
    if (!archivo) return;
    setError(null);
    setSubiendo(tipo);
    try {
      const preparado = await prepararMultimedia(tipo, archivo);
      if (!preparado.ok) {
        setError(preparado.error);
        return;
      }
      const recurso = await repo.subirMultimedia(tareaId, tipo, preparado.archivo);
      cambiarPaso({ [tipo]: recurso } as Partial<PasoTarea>);
    } catch {
      setError("No se ha podido subir el archivo. Prueba otra vez.");
    } finally {
      setSubiendo(null);
    }
  };

  const guardar = async () => {
    const sinTitulo = lista.findIndex((f) => !(f.paso.titulo ?? "").trim());
    if (sinTitulo >= 0) {
      setElegido(sinTitulo);
      setError(`El paso ${sinTitulo + 1} necesita un título corto.`);
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const guardados = await repo.guardarPasos(
        tareaId,
        lista.map((f, i) => ({ ...f.paso, orden: i + 1 })),
      );
      onGuardado(guardados);
    } catch {
      setError("No se ha podido guardar. Revisa la conexión y prueba otra vez.");
    } finally {
      setGuardando(false);
    }
  };

  if (eligiendoPicto && actual) {
    return (
      <SelectorPictograma28p
        terminoInicial={tituloDe(actual.paso)}
        alElegir={(p) => {
          cambiarPaso({
            pictograma_id: p.id,
            pictograma_url: p.urlImagen,
            pictograma_origen: "arasaac",
          });
          setEligiendoPicto(false);
        }}
        alAtras={() => setEligiendoPicto(false)}
      />
    );
  }

  const derecha = (
    <View style={e.cabeceraDerecha}>
      {nombreAdulto ? (
        <View style={e.usuario}>
          <View style={e.avatar}>
            <Texto style={e.iniciales}>
              {nombreAdulto
                .split(/\s+/)
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Texto>
          </View>
          <Texto style={e.nombreUsuario}>{nombreAdulto}</Texto>
        </View>
      ) : null}
      {alSalir ? (
        <BotonPequeno icono="salir" texto="Salir" onPress={alSalir} testID="btn-28s-salir" />
      ) : null}
    </View>
  );

  return (
    <Pantalla
      titulo="Crear o editar tarea · Pasos y multimedia"
      derecha={derecha}
      alAtras={alAtras}
      etiquetaAtras="Atrás: datos de la tarea"
      alAdelante={guardando || subiendo || !filas ? null : () => void guardar()}
      textoAdelante={guardando ? "Guardando…" : "Guardar"}
      testID="pantalla-28s-editor-pasos"
    >
      {!filas ? (
        <View style={e.cargando}>
          <ActivityIndicator
            size="large"
            color={colores.primario}
            accessibilityLabel="Cargando pasos"
          />
        </View>
      ) : (
        <View style={e.cuerpo}>
          {/* ---- Lista de pasos ---- */}
          <View style={[e.tarjeta, e.panelLista]}>
            <View style={e.filaTitulo}>
              <Texto
                style={e.titulo}
                accessibilityRole="header"
              >{`Pasos de la tarea (${lista.length})`}</Texto>
              <BotonPequeno
                icono="mas"
                texto="Añadir paso"
                onPress={anadir}
                primario
                testID="btn-28s-anadir"
              />
            </View>
            <ScrollView style={e.lista} contentContainerStyle={{ gap: 7 }}>
              {lista.length === 0 ? (
                <Texto style={e.ayuda}>Todavía no hay pasos. Pulsa «Añadir paso».</Texto>
              ) : null}
              {lista.map((f, i) => {
                const formatos = formatosDelPaso(f.paso);
                const sel = i === elegido;
                return (
                  <Pressable
                    key={f.clave}
                    testID={`fila-paso-${i + 1}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sel, selected: sel }}
                    accessibilityLabel={`Paso ${i + 1}: ${tituloDe(f.paso) || "sin título"}`}
                    onPress={() => setElegido(i)}
                    style={[e.fila, sel && e.filaElegida]}
                  >
                    <View style={e.placaMini}>
                      {f.paso.pictograma_url ? (
                        <Image
                          source={{ uri: f.paso.pictograma_url }}
                          style={e.miniPicto}
                          resizeMode="contain"
                        />
                      ) : (
                        <Icono nombre="imagen" color={colores.textoSecundario} tam={22} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Texto style={e.textoFila} numberOfLines={1}>
                        {`Paso ${i + 1}: ${tituloDe(f.paso) || "(sin título)"}`}
                      </Texto>
                      <Texto style={e.formatosFila} numberOfLines={1}>
                        {(Object.keys(ABREVIATURAS) as FormatoPaso[]).map((k, j) => (
                          <Texto key={k} style={formatos[k] ? e.formatoSi : e.formatoNo}>
                            {`${j > 0 ? " · " : ""}${ABREVIATURAS[k]}`}
                          </Texto>
                        ))}
                      </Texto>
                    </View>
                    {sel ? (
                      <View style={e.check}>
                        <Icono
                          nombre="check"
                          color={colorSobre(colores.primario)}
                          tam={14}
                          grosor={3}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={e.filaOrden}>
              <BotonPequeno
                texto="↑ Subir"
                onPress={() => mover(-1)}
                desactivado={elegido <= 0}
                testID="btn-28s-subir"
                flex
              />
              <BotonPequeno
                texto="↓ Bajar"
                onPress={() => mover(1)}
                desactivado={elegido >= lista.length - 1}
                testID="btn-28s-bajar"
                flex
              />
              <BotonPequeno
                icono="cerrar"
                texto="Quitar"
                onPress={quitar}
                desactivado={!actual}
                peligro
                testID="btn-28s-quitar"
              />
            </View>
          </View>

          {/* ---- Paso elegido ---- */}
          <View style={[e.tarjeta, e.panelPaso]}>
            {actual ? (
              <>
                <View style={e.filaTitulo}>
                  <Texto style={e.titulo} numberOfLines={1} testID="titulo-configurando">
                    {`Configurando Paso ${elegido + 1} de ${lista.length} · ${tituloDe(actual.paso) || "sin título"}`}
                  </Texto>
                  <View style={e.pildoraOk}>
                    <Texto style={e.textoPildoraOk}>
                      {`${Object.values(formatosDelPaso(actual.paso)).filter(Boolean).length} formatos del paso`}
                    </Texto>
                  </View>
                </View>

                <View style={e.filaCampos}>
                  <View style={{ flex: 1 }}>
                    <Texto style={e.etiquetaCampo} nativeID="lbl-titulo-paso">
                      Título corto del paso
                    </Texto>
                    <TextInput
                      testID="campo-titulo-paso"
                      accessibilityLabelledBy="lbl-titulo-paso"
                      accessibilityLabel="Título corto del paso"
                      value={actual.paso.titulo ?? ""}
                      maxLength={MAX_TITULO_PASO}
                      onChangeText={(titulo) => cambiarPaso({ titulo })}
                      placeholder="Abre el grifo"
                      placeholderTextColor={colores.textoSecundario}
                      style={[e.campo, e.campoTitulo]}
                    />
                  </View>
                  <View style={{ flex: 1.6 }}>
                    <Texto style={e.etiquetaCampo} nativeID="lbl-texto-paso">
                      2. Texto del paso en Lectura Fácil (se muestra en 07b)
                    </Texto>
                    <TextInput
                      testID="campo-texto-paso"
                      accessibilityLabelledBy="lbl-texto-paso"
                      accessibilityLabel="Texto del paso en Lectura Fácil"
                      value={actual.paso.texto}
                      onChangeText={(texto) => cambiarPaso({ texto })}
                      placeholder="Gira el grifo despacio para que salga agua templada."
                      placeholderTextColor={colores.textoSecundario}
                      multiline
                      style={e.campo}
                    />
                  </View>
                </View>

                <Texto style={e.subtitulo}>Pictograma, foto, vídeo y audio de este paso:</Texto>
                <View style={e.rejilla}>
                  <TarjetaMedio
                    numero={1}
                    titulo="Pictograma"
                    pildora="ARASAAC + Propios"
                    detalle={actual.paso.pictograma_url ? "Elegido" : "Buscador unificado"}
                    destacada
                    miniatura={actual.paso.pictograma_url ?? null}
                    acciones={[
                      {
                        icono: "buscar",
                        texto: "Elegir pictograma",
                        primario: true,
                        onPress: () => setEligiendoPicto(true),
                        testID: "btn-28s-elegir-picto",
                      },
                    ]}
                  />
                  <TarjetaMedio
                    numero={3}
                    titulo="Foto real"
                    pildora={actual.paso.foto ? "Adjunta" : undefined}
                    detalle={
                      actual.paso.foto
                        ? textoTamano(actual.paso.foto.tamano_bytes ?? 0)
                        : "Sin foto"
                    }
                    miniatura={actual.paso.foto?.url ?? null}
                    icono="imagen"
                    cargando={subiendo === "foto"}
                    acciones={[
                      {
                        icono: "mas",
                        texto: "Subir foto",
                        onPress: async () => subir("foto", await elegirArchivo("foto")),
                        testID: "btn-28s-subir-foto",
                      },
                      ...(actual.paso.foto
                        ? [
                            {
                              icono: "cerrar" as NombreIcono,
                              texto: "Quitar",
                              onPress: () => cambiarPaso({ foto: null }),
                              testID: "btn-28s-quitar-foto",
                            },
                          ]
                        : []),
                    ]}
                  />
                  <TarjetaMedio
                    numero={4}
                    titulo="Vídeo del paso"
                    pildora={
                      actual.paso.video?.duracion_segundos != null
                        ? `0:${String(actual.paso.video.duracion_segundos).padStart(2, "0")} s`
                        : actual.paso.video
                          ? "Adjunto"
                          : undefined
                    }
                    detalle={
                      actual.paso.video
                        ? textoTamano(actual.paso.video.tamano_bytes ?? 0)
                        : `Corto: máximo ${LIMITES.video.maxSegundos} s`
                    }
                    icono="reproducir"
                    oscura
                    cargando={subiendo === "video"}
                    acciones={[
                      {
                        icono: "reproducir",
                        texto: "Subir vídeo",
                        onPress: async () => subir("video", await elegirArchivo("video")),
                        testID: "btn-28s-subir-video",
                      },
                      ...(actual.paso.video
                        ? [
                            {
                              icono: "cerrar" as NombreIcono,
                              texto: "Quitar",
                              onPress: () => cambiarPaso({ video: null }),
                              testID: "btn-28s-quitar-video",
                            },
                          ]
                        : []),
                    ]}
                  />
                  <TarjetaMedio
                    numero={5}
                    titulo="Audio del paso"
                    pildora="Locución + voz"
                    detalle={
                      grabadora.grabando
                        ? "Grabando… pulsa «Parar»"
                        : actual.paso.audio
                          ? `Voz grabada${actual.paso.audio.duracion_segundos != null ? ` (0:${String(actual.paso.audio.duracion_segundos).padStart(2, "0")})` : ""}`
                          : "Sin grabar: la tableta lee el texto"
                    }
                    icono="altavoz"
                    verde
                    cargando={subiendo === "audio"}
                    acciones={[
                      ...(grabadora.disponible
                        ? [
                            grabadora.grabando
                              ? {
                                  icono: "cerrar" as NombreIcono,
                                  texto: "Parar",
                                  primario: true,
                                  onPress: grabadora.parar,
                                  testID: "btn-28s-parar-grabacion",
                                }
                              : {
                                  icono: "altavoz" as NombreIcono,
                                  texto: "Grabar",
                                  onPress: () =>
                                    void grabadora
                                      .empezar((blob) => void subir("audio", blob))
                                      .catch(() =>
                                        setError(
                                          "No se puede usar el micrófono. Revisa los permisos del navegador.",
                                        ),
                                      ),
                                  testID: "btn-28s-grabar",
                                },
                          ]
                        : []),
                      {
                        icono: "mas",
                        texto: "Subir audio",
                        onPress: async () => subir("audio", await elegirArchivo("audio")),
                        testID: "btn-28s-subir-audio",
                      },
                      ...(actual.paso.audio
                        ? [
                            {
                              icono: "cerrar" as NombreIcono,
                              texto: "Quitar",
                              onPress: () => cambiarPaso({ audio: null }),
                              testID: "btn-28s-quitar-audio",
                            },
                          ]
                        : []),
                    ]}
                  />
                </View>
              </>
            ) : (
              <View style={e.cargando}>
                <Texto style={e.ayuda}>Añade un paso para configurarlo.</Texto>
              </View>
            )}
          </View>
        </View>
      )}
      {error ? (
        <Texto
          style={e.error}
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          testID="error-28s"
        >
          {error}
        </Texto>
      ) : null}
    </Pantalla>
  );
}

function BotonPequeno({
  icono,
  texto,
  onPress,
  primario = false,
  peligro = false,
  desactivado = false,
  flex = false,
  testID,
}: {
  icono?: NombreIcono;
  texto: string;
  onPress: () => void;
  primario?: boolean;
  peligro?: boolean;
  desactivado?: boolean;
  flex?: boolean;
  testID?: string;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const tinta = primario
    ? colorSobre(colores.primario)
    : peligro
      ? colores.peligro
      : colores.primario;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: desactivado }}
      disabled={desactivado}
      onPress={onPress}
      style={({ pressed }) => [
        e.botonPequeno,
        primario && e.botonPequenoPrimario,
        flex && { flex: 1 },
        desactivado && e.apagado,
        pressed && e.pulsado,
      ]}
    >
      {icono ? <Icono nombre={icono} color={tinta} tam={16} /> : null}
      <Texto
        style={[
          e.textoBotonPequeno,
          { color: primario ? tinta : peligro ? colores.peligro : colores.texto },
        ]}
      >
        {texto}
      </Texto>
    </Pressable>
  );
}

function TarjetaMedio({
  numero,
  titulo,
  pildora,
  detalle,
  miniatura,
  icono = "imagen",
  destacada = false,
  oscura = false,
  verde = false,
  cargando = false,
  acciones,
}: {
  numero: number;
  titulo: string;
  pildora?: string;
  detalle: string;
  miniatura?: string | null;
  icono?: NombreIcono;
  destacada?: boolean;
  oscura?: boolean;
  verde?: boolean;
  cargando?: boolean;
  acciones: {
    icono: NombreIcono;
    texto: string;
    onPress: () => void;
    primario?: boolean;
    testID?: string;
  }[];
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  return (
    <View style={[e.tarjetaMedio, destacada && e.tarjetaMedioDestacada]} testID={`medio-${numero}`}>
      <View
        style={[
          e.miniaturaMedio,
          oscura && { backgroundColor: "#1F2328" },
          verde && { backgroundColor: colores.superficieDestacada },
        ]}
      >
        {cargando ? (
          <ActivityIndicator color={colores.primario} accessibilityLabel="Subiendo" />
        ) : miniatura ? (
          <Image source={{ uri: miniatura }} style={e.imagenMiniatura} resizeMode="contain" />
        ) : (
          <Icono
            nombre={icono}
            color={oscura ? "#FFFFFF" : verde ? colores.exito : colores.primario}
            tam={28}
          />
        )}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={e.filaTituloMedio}>
          <Texto style={e.tituloMedio}>{`${numero}. ${titulo}`}</Texto>
          {pildora ? (
            <View style={e.pildoraOk}>
              <Texto style={[e.textoPildoraOk, { fontSize: 11 }]}>{pildora}</Texto>
            </View>
          ) : null}
        </View>
        <Texto style={e.detalleMedio} numberOfLines={1}>
          {detalle}
        </Texto>
        <View style={e.filaAcciones}>
          {acciones.map((a) => (
            <BotonPequeno
              key={a.texto}
              icono={a.icono}
              texto={a.texto}
              onPress={a.onPress}
              primario={a.primario}
              testID={a.testID}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cargando: { flex: 1, alignItems: "center", justifyContent: "center" },
    cuerpo: {
      flex: 1,
      flexDirection: "row",
      gap: 16,
      padding: 20,
      backgroundColor: c.fondo,
      minHeight: 0,
    },
    tarjeta: {
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 12,
      padding: 14,
      gap: 10,
      minHeight: 0,
    },
    panelLista: { width: 330 },
    panelPaso: { flex: 1 },
    filaTitulo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    titulo: { fontSize: 18, fontWeight: "700", color: c.texto, flexShrink: 1 },
    subtitulo: { fontSize: 15, fontWeight: "700", color: c.primario },
    ayuda: { fontSize: 16, color: c.textoSecundario },
    lista: { flex: 1 },
    fila: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 12,
      backgroundColor: c.superficie,
    },
    filaElegida: {
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    placaMini: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    miniPicto: { width: 36, height: 36 },
    textoFila: { fontSize: 15, fontWeight: "700", color: c.texto },
    formatosFila: { fontSize: 12 },
    formatoSi: { color: c.texto, fontWeight: "700" },
    formatoNo: { color: c.textoSecundario, textDecorationLine: "line-through" },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.primario,
      alignItems: "center",
      justifyContent: "center",
    },
    filaOrden: { flexDirection: "row", gap: 6 },
    botonPequeno: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    botonPequenoPrimario: { backgroundColor: c.primario, borderColor: c.primario },
    textoBotonPequeno: { fontSize: 14, fontWeight: "700" },
    apagado: { opacity: 0.4 },
    pulsado: { opacity: 0.8 },
    pildoraOk: {
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.exito,
      backgroundColor: c.superficie,
    },
    textoPildoraOk: { fontSize: 13, fontWeight: "700", color: c.exito },
    filaCampos: { flexDirection: "row", gap: 12 },
    etiquetaCampo: { fontSize: 14, fontWeight: "700", color: c.texto, marginBottom: 4 },
    campo: {
      minHeight: 48,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: c.texto,
      backgroundColor: c.superficie,
    },
    campoTitulo: { fontWeight: "700" },
    rejilla: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 12, minHeight: 0 },
    tarjetaMedio: {
      flexBasis: "47%",
      flexGrow: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 12,
      backgroundColor: c.superficie,
    },
    tarjetaMedioDestacada: { borderColor: c.primario, backgroundColor: c.superficieDestacada },
    miniaturaMedio: {
      width: 64,
      height: 64,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    imagenMiniatura: { width: 64, height: 64 },
    filaTituloMedio: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    tituloMedio: { fontSize: 15, fontWeight: "700", color: c.texto },
    detalleMedio: { fontSize: 13, color: c.textoSecundario },
    filaAcciones: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    cabeceraDerecha: { flexDirection: "row", alignItems: "center", gap: 10 },
    usuario: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingLeft: 4,
      paddingRight: 12,
      minHeight: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.borde,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      justifyContent: "center",
    },
    iniciales: { fontSize: 13, fontWeight: "700", color: c.primario },
    nombreUsuario: { fontSize: 15, fontWeight: "700", color: c.texto },
    error: {
      position: "absolute",
      bottom: 6,
      alignSelf: "center",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.peligro,
      color: c.peligro,
      fontSize: 15,
      fontWeight: "700",
    },
  });
