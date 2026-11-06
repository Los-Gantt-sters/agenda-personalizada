// Contexto de tema: cualquier componente lee los colores activos con useTema() y no usa colores fijos.
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { InfoTema, NombreTema, Paleta, TEMAS, TEMA_POR_DEFECTO } from "./paletas";

interface ValorTema {
  /** Nombre del tema activo. */
  nombre: NombreTema;
  /** Colores del tema activo. */
  colores: Paleta;
  /** Datos completos del tema activo (etiqueta, si es oscuro, si es alto contraste). */
  tema: InfoTema;
  /** Cambia el tema activo (por ejemplo, al elegirlo el tutor en las preferencias del estudiante). */
  cambiarTema: (nombre: NombreTema) => void;
}

const TemaContext = createContext<ValorTema | null>(null);

interface Props {
  /** Tema con el que empieza; por defecto, el claro. */
  temaInicial?: NombreTema;
  children: React.ReactNode;
}

export function TemaProvider({ temaInicial = TEMA_POR_DEFECTO, children }: Props) {
  const [nombre, setNombre] = useState<NombreTema>(temaInicial);

  const cambiarTema = useCallback((nuevo: NombreTema) => {
    if (TEMAS[nuevo]) {
      setNombre(nuevo);
    }
  }, []);

  const valor = useMemo<ValorTema>(
    () => ({ nombre, colores: TEMAS[nombre].paleta, tema: TEMAS[nombre], cambiarTema }),
    [nombre, cambiarTema],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

/** Devuelve el tema activo. Debe usarse dentro de <TemaProvider>. */
export function useTema(): ValorTema {
  const valor = useContext(TemaContext);
  if (!valor) {
    throw new Error("useTema debe usarse dentro de <TemaProvider>");
  }
  return valor;
}
