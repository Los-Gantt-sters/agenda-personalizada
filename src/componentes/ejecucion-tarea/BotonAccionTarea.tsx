// Botones gigantes «EMPEZAR» y «TERMINAR» (T-08.1, HU-08).
// RF6.1: «Empezar» pone la tarea en curso. RF6.4: «Terminar» la da por hecha.
// RNF6.1: se mantienen pulsados 1,5 s (BotonMantener). RNF6.3: área táctil muy por encima de 48 × 48.
// RNF6.4: solo botones, sin ningún campo de texto.
// Texto grande en mayúsculas y «Mantén pulsado» debajo, sin pictograma (decisión del equipo, 8-nov).
import { BotonMantener } from "../agenda/BotonMantener";
import { colores } from "../agenda/colores";
import type { AccionTarea } from "./tipos";

/** Lado mínimo del área táctil (RNF6.3). */
export const AREA_TACTIL_MINIMA = 48;

const CONFIG: Record<AccionTarea, { texto: string; color: string; relleno: string }> = {
  empezar: { texto: "Empezar", color: colores.primario, relleno: colores.exito },
  terminar: { texto: "Terminar", color: colores.exito, relleno: colores.primario },
};

export function BotonAccionTarea({
  accion,
  onConfirmar,
  duracionMs = 1500,
  desactivado = false,
}: {
  accion: AccionTarea;
  onConfirmar: () => void;
  duracionMs?: number;
  desactivado?: boolean;
}) {
  const c = CONFIG[accion];
  return (
    <BotonMantener
      testID={`boton-${accion}`}
      texto={c.texto}
      grande
      ayuda={duracionMs > 0 ? "Mantén pulsado" : undefined}
      color={c.color}
      colorRelleno={c.relleno}
      duracionMs={duracionMs}
      desactivado={desactivado}
      onConfirmar={onConfirmar}
    />
  );
}
