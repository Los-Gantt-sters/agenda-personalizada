// Fija la letra de una pantalla, por encima de la que se haya elegido en Preferencias. La usa la
// pantalla 43 (Progreso e historial), que va en Andika como en el boceto de la profesora.
import { useMemo, type ReactNode } from "react";

import { FUENTES, type FuenteLetra } from "../preferencias/opciones";
import { LetraFijaContexto } from "./apariencia";

export function LetraFija({ fuente, children }: { fuente: FuenteLetra; children: ReactNode }) {
  const valor = useMemo(
    () => ({ normal: FUENTES[fuente].familiaNormal, negrita: FUENTES[fuente].familiaNegrita }),
    [fuente],
  );
  return <LetraFijaContexto.Provider value={valor}>{children}</LetraFijaContexto.Provider>;
}
