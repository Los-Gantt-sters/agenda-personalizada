// Pantalla 08c «Cambio de actividad · Plan B» (HU-22 · SCRUM-140). Transición calmada cuando el tutor
// activa el Plan B: lo que tocaba (apagado), una flecha y lo que toca ahora (destacado).
// «Atrás» está desactivado y «Siguiente» (en la barra, un solo botón) lleva a los pasos (07).
import { StyleSheet, View } from "react-native";

import { Pantalla } from "../../pantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import { PictogramaTarea } from "../agenda/PictogramaTarea";
import type { Tarea } from "../agenda/tipos";

type TareaVista = Pick<Tarea, "titulo" | "pictograma_url" | "emoji">;

export function PantallaPlanBActivo({
  original,
  nueva,
  onSiguiente,
  conSonido = false,
}: {
  /** La tarea que tocaba. */
  original: TareaVista;
  /** La tarea Plan B. */
  nueva: TareaVista;
  onSiguiente: () => void;
  conSonido?: boolean;
}) {
  const { colores, canal } = useApariencia();
  const e = useEstilos(crearEstilos);
  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";

  return (
    <Pantalla
      titulo="Cambio de actividad · Plan B"
      simbolo={<Icono nombre="campana" color={colores.primario} tam={30} />}
      alAtras={null}
      alAdelante={onSiguiente}
      textoAdelante="Siguiente"
      etiquetaAdelante={`Siguiente: empezar ${nueva.titulo}`}
      conSonido={conSonido}
      testID="pantalla-plan-b-activo"
    >
      <View style={e.cuerpo} accessibilityLiveRegion="polite">
        <Texto style={e.mensaje} accessibilityRole="header">
          Hoy cambiamos de actividad
        </Texto>
        <View style={e.cambio}>
          <View
            style={[e.tarjeta, e.antes]}
            accessible
            accessibilityLabel={`Antes: ${original.titulo}`}
          >
            {verDibujo ? <PictogramaTarea tarea={original} tam={110} /> : null}
            {verTexto ? <Texto style={e.textoAntes}>{original.titulo}</Texto> : null}
          </View>
          <Icono nombre="adelante" color={colores.primario} tam={48} grosor={3} />
          <View
            style={[e.tarjeta, e.ahora]}
            accessible
            accessibilityLabel={`Plan B: ${nueva.titulo}`}
          >
            {verDibujo ? <PictogramaTarea tarea={nueva} tam={140} /> : null}
            {verTexto ? <Texto style={e.textoAhora}>{`Plan B: ${nueva.titulo}`}</Texto> : null}
          </View>
        </View>
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cuerpo: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: 16,
      backgroundColor: c.fondo,
    },
    mensaje: { fontSize: 30, fontWeight: "700", color: c.texto, textAlign: "center" },
    cambio: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
    },
    tarjeta: {
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      padding: 20,
      borderRadius: FORMA.radio,
      borderWidth: 2,
    },
    antes: { width: 260, minHeight: 240, borderColor: c.borde, opacity: 0.55 },
    ahora: {
      width: 310,
      minHeight: 270,
      borderWidth: 4,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    textoAntes: { fontSize: 19, fontWeight: "700", color: c.textoSecundario, textAlign: "center" },
    textoAhora: { fontSize: 24, fontWeight: "700", color: c.texto, textAlign: "center" },
  });
