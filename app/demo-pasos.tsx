// Demo de la HU-10 (SCRUM-93) sin Supabase: editor de pasos (28s) → guardado (28ok) → la tarea
// como la ve el alumno, paso a paso (07-07d) y con todos los pasos (07f).
// Los pasos y los archivos se quedan en memoria (las fotos, vídeos y audios subidos se ven con una
// URL local del navegador); al recargar se vuelve a empezar. Con Supabase el editor usaría
// repositorioPasosSupabase (src/servicios/pasosService.ts) y el bucket privado multimedia-pasos.
// Solo existe en desarrollo (__DEV__): en la app publicada /demo-pasos lleva al inicio.
import { Redirect } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  EditorPasos28s,
  PantallaPasos07,
  PantallaTodosPasos07f,
  crearRepositorioPasosMemoria,
} from "../src/componentes/pasos";
import { agendaDemo, hoyISO } from "../src/componentes/agenda";
import type { EntradaAgenda, PasoTarea } from "../src/componentes/agenda/tipos";
import { Pantalla } from "../src/pantalla";
import type { Paleta } from "../src/temas";
import { Icono, Texto, colorSobre, useApariencia, useEstilos } from "../src/ui";

const TAREA_DEMO = "00000000-0000-0000-0000-0000000000e2";

type Vista = "editor" | "guardado" | "pasos" | "todos";

export default function DemoPasos() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DemoPasosDesarrollo />;
}

function DemoPasosDesarrollo() {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const base = useMemo(() => agendaDemo(hoyISO()).find((x) => x.id === "e2")!, []);
  const repo = useMemo(
    () => crearRepositorioPasosMemoria({ [TAREA_DEMO]: base.tarea.pasos ?? [] }),
    [base],
  );
  const [vista, setVista] = useState<Vista>("editor");
  const [pasos, setPasos] = useState<PasoTarea[]>(base.tarea.pasos ?? []);
  const [inicio, setInicio] = useState<string | null>(null);

  const entrada: EntradaAgenda = {
    ...base,
    estado: "en_curso",
    inicio_real: inicio,
    tarea: { ...base.tarea, pasos },
  };

  if (vista === "editor") {
    return (
      <EditorPasos28s
        tareaId={TAREA_DEMO}
        repo={repo}
        nombreAdulto="Carmen Ruiz"
        alAtras={() => setVista("guardado")}
        onGuardado={(guardados) => {
          setPasos(guardados);
          setVista("guardado");
        }}
      />
    );
  }

  if (vista === "pasos") {
    return (
      <PantallaPasos07
        entrada={entrada}
        alSalir={() => setVista("guardado")}
        etiquetaSalir="Atrás: volver a la demo"
        alTerminar={() => setVista("guardado")}
      />
    );
  }

  if (vista === "todos") {
    return (
      <PantallaTodosPasos07f
        tarea={entrada.tarea}
        alAtras={() => setVista("guardado")}
        onEmpezar={() => {
          setInicio(new Date().toISOString());
          setVista("pasos");
        }}
      />
    );
  }

  // «28ok»: guardado. Desde aquí se prueba cómo lo ve el alumno.
  const opciones: { texto: string; ir: () => void; testID: string }[] = [
    {
      texto: "Ver la tarea paso a paso (07)",
      ir: () => {
        setInicio(new Date().toISOString());
        setVista("pasos");
      },
      testID: "demo-ver-07",
    },
    { texto: "Ver todos los pasos (07f)", ir: () => setVista("todos"), testID: "demo-ver-07f" },
    {
      texto: "Volver a editar los pasos (28s)",
      ir: () => setVista("editor"),
      testID: "demo-editar",
    },
  ];
  return (
    <Pantalla titulo="Tarea guardada" alAtras={() => setVista("editor")}>
      <View style={e.cuerpo}>
        <Icono nombre="check" color={colores.exito} tam={64} grosor={3.4} />
        <Texto style={e.titulo}>{`«${base.tarea.titulo}» tiene ${pasos.length} pasos`}</Texto>
        {opciones.map((o) => (
          <Pressable
            key={o.testID}
            testID={o.testID}
            accessibilityRole="button"
            onPress={o.ir}
            style={({ pressed }) => [e.boton, pressed && { opacity: 0.85 }]}
          >
            <Texto style={e.textoBoton}>{o.texto}</Texto>
          </Pressable>
        ))}
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cuerpo: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
    titulo: { fontSize: 26, fontWeight: "700", color: c.texto, textAlign: "center" },
    boton: {
      minWidth: 380,
      minHeight: 64,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      borderRadius: 14,
      backgroundColor: c.primario,
    },
    textoBoton: { fontSize: 20, fontWeight: "700", color: colorSobre(c.primario) },
  });
