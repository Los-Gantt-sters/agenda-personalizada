// Administración · Códigos QR de la visita (HU-15 · SCRUM-115 · T-15.3).
// El administrador escribe el nombre de cada sitio del centro (Biblioteca, Huerto...) y el enlace con
// su información, ve el código QR y los imprime para pegarlos en las puertas. Cuando el alumno los
// escanea en la visita (pantalla 13b), puede abrir esa información.
// Los enlaces se comprueban igual que en la visita (enlaceQR): solo https y, si está configurada la
// lista, solo sitios permitidos. Así no se imprime un QR que luego la visita no dejaría abrir.
// No se guardan: al salir se pierden. Guardar los enlaces de cada sala es SCRUM-270 (Sprint 3).
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { validarEnlaceQR } from "../../src/componentes/visita";
import { Pantalla } from "../../src/pantalla";
import type { Paleta } from "../../src/temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../src/ui";

interface CodigoSitio {
  id: number;
  nombre: string;
  url: string;
}

const MOTIVOS: Record<string, string> = {
  vacio: "Escribe el enlace.",
  largo: "El enlace es demasiado largo.",
  "no-es-enlace": "Eso no es un enlace. Tiene que empezar por https://",
  protocolo: "Solo se admiten enlaces seguros (https://).",
  credenciales: "El enlace no puede llevar usuario ni contraseña.",
  sitio: "Ese sitio no está en la lista de sitios permitidos de la visita.",
};

const puedeImprimir = Platform.OS === "web";

export default function CodigosQR() {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [nombre, setNombre] = useState("");
  const [enlace, setEnlace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codigos, setCodigos] = useState<CodigoSitio[]>([]);
  const [siguienteId, setSiguienteId] = useState(1);
  const [imprimiendo, setImprimiendo] = useState(false);

  // «Imprimir»: se pinta solo la hoja de códigos, se abre la impresión y al terminar se vuelve
  useEffect(() => {
    if (!imprimiendo || !puedeImprimir) return;
    const volver = () => setImprimiendo(false);
    globalThis.addEventListener?.("afterprint", volver);
    const t = setTimeout(() => globalThis.print?.(), 50);
    return () => {
      clearTimeout(t);
      globalThis.removeEventListener?.("afterprint", volver);
    };
  }, [imprimiendo]);

  const anadir = () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError("Escribe el nombre del sitio.");
      return;
    }
    const comprobado = validarEnlaceQR(enlace);
    if (!comprobado.valido) {
      setError(MOTIVOS[comprobado.motivo]);
      return;
    }
    setCodigos((antes) => [
      ...antes,
      { id: siguienteId, nombre: nombreLimpio, url: comprobado.url },
    ]);
    setSiguienteId((n) => n + 1);
    setNombre("");
    setEnlace("");
    setError(null);
  };

  const hoja = (
    <View style={e.hoja} testID="hoja-codigos">
      {codigos.map((c) => (
        <View key={c.id} style={e.tarjeta} testID={`codigo-qr-${c.id}`}>
          <QRCode value={c.url} size={200} ecl="M" />
          <Texto style={e.nombreSitio}>{c.nombre}</Texto>
          <Texto style={e.url} numberOfLines={2}>
            {c.url}
          </Texto>
          {imprimiendo ? null : (
            <Pressable
              style={e.botonQuitar}
              accessibilityRole="button"
              accessibilityLabel={`Quitar el código de ${c.nombre}`}
              onPress={() => setCodigos((antes) => antes.filter((x) => x.id !== c.id))}
            >
              <Icono nombre="cerrar" color={colores.peligro} tam={20} />
              <Texto style={e.textoQuitar}>Quitar</Texto>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );

  // Al imprimir, solo la hoja: sin cabecera, formulario ni botones
  if (imprimiendo) return <View style={e.paginaImpresion}>{hoja}</View>;

  return (
    <Pantalla
      titulo="Códigos QR de la visita"
      simbolo={<Icono nombre="enlace" color={colores.primario} tam={36} />}
    >
      <ScrollView contentContainerStyle={e.contenido}>
        <Texto style={e.subtitulo}>
          Escribe el nombre de cada sitio y el enlace con su información. Imprime los códigos y
          pégalos en las puertas: en la visita, el alumno los escanea para ver esa información.
        </Texto>

        <View style={e.formulario}>
          <View style={e.campo}>
            <Texto style={e.etiqueta}>Nombre del sitio</Texto>
            <TextInput
              style={e.entrada}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Por ejemplo, Biblioteca"
              accessibilityLabel="Nombre del sitio"
              testID="campo-nombre-sitio"
            />
          </View>
          <View style={e.campo}>
            <Texto style={e.etiqueta}>Enlace con la información</Texto>
            <TextInput
              style={e.entrada}
              value={enlace}
              onChangeText={setEnlace}
              placeholder="https://..."
              autoCapitalize="none"
              keyboardType="url"
              accessibilityLabel="Enlace con la información"
              testID="campo-enlace-sitio"
            />
          </View>
          <Pressable
            style={e.botonPrimario}
            accessibilityRole="button"
            accessibilityLabel="Añadir código"
            testID="btn-anadir-codigo"
            onPress={anadir}
          >
            <Texto style={e.textoBotonPrimario}>Añadir código</Texto>
          </Pressable>
        </View>

        {error ? (
          <View style={e.filaError} accessibilityRole="alert" testID="error-codigo">
            <Icono nombre="alerta" color={colores.peligro} tam={22} />
            <Texto style={e.error}>{error}</Texto>
          </View>
        ) : null}

        {codigos.length === 0 ? (
          <Texto style={e.vacio}>Todavía no hay códigos. Añade el primero.</Texto>
        ) : (
          <>
            {hoja}
            {puedeImprimir ? (
              <Pressable
                style={[e.botonPrimario, e.botonImprimir]}
                accessibilityRole="button"
                accessibilityLabel="Imprimir los códigos"
                testID="btn-imprimir-codigos"
                onPress={() => setImprimiendo(true)}
              >
                <Texto style={e.textoBotonPrimario}>Imprimir</Texto>
              </Pressable>
            ) : (
              <Texto style={e.vacio}>Para imprimir, abre esta pantalla en el ordenador.</Texto>
            )}
          </>
        )}

        <Texto style={e.nota}>
          Los códigos no se guardan: si sales de esta pantalla, se pierden.
        </Texto>
      </ScrollView>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenido: { padding: 20, gap: 16 },
    subtitulo: { fontSize: 17, color: c.textoSecundario, maxWidth: 820 },
    formulario: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 16 },
    campo: { flexGrow: 1, flexBasis: 260, gap: 6 },
    etiqueta: { fontSize: 17, fontWeight: "700", color: c.texto },
    entrada: {
      minHeight: 52,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      color: c.texto,
      fontSize: 17,
    },
    botonPrimario: {
      minHeight: 52,
      minWidth: 180,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: c.primario,
    },
    botonImprimir: { alignSelf: "flex-start" },
    textoBotonPrimario: { fontSize: 18, fontWeight: "700", color: c.textoSobrePrimario },
    filaError: { flexDirection: "row", alignItems: "center", gap: 8 },
    error: { fontSize: 17, fontWeight: "700", color: c.peligro },
    vacio: { fontSize: 17, color: c.textoSecundario },
    nota: { fontSize: 15, color: c.textoSecundario },
    hoja: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
    tarjeta: {
      width: 260,
      alignItems: "center",
      gap: 8,
      padding: 18,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: "#FFFFFF",
    },
    nombreSitio: { fontSize: 22, fontWeight: "700", color: "#000000", textAlign: "center" },
    url: { fontSize: 13, color: "#333333", textAlign: "center" },
    botonQuitar: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.peligro,
    },
    textoQuitar: { fontSize: 16, fontWeight: "700", color: c.peligro },
    paginaImpresion: { padding: 16, backgroundColor: "#FFFFFF" },
  });
