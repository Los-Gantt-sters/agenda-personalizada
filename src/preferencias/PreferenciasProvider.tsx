// Preferencias de apariencia del estudiante activo (RI3.1). El tema vive en TemaProvider (T-04.1);
// aquí se guarda lo demás (letra, botones, forma) y se ofrece todo junto con usePreferencias().
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { useTema } from "../temas";
import { EstilosApariencia, estilosApariencia } from "./estilos";
import {
  PREFERENCIAS_POR_DEFECTO,
  PreferenciasApariencia,
  normalizarPreferencias,
} from "./opciones";

interface ValorPreferencias {
  preferencias: PreferenciasApariencia;
  /** Medidas ya calculadas (tamaños de texto y botones, radios, fuente). */
  estilos: EstilosApariencia;
  /** Cambia una o varias preferencias. Los cambios se aplican al momento (RF3.15). */
  cambiar: (cambios: Partial<PreferenciasApariencia>) => void;
  /** Vuelve a los valores por defecto (los de la variante A del prototipo). */
  restablecer: () => void;
}

const PreferenciasContext = createContext<ValorPreferencias | null>(null);

type SinTema = Omit<PreferenciasApariencia, "tema">;

interface Props {
  /** Preferencias con las que empieza (p. ej. las guardadas del perfil). Se sanean al entrar. */
  preferenciasIniciales?: Partial<PreferenciasApariencia>;
  children: React.ReactNode;
}

export function PreferenciasProvider({ preferenciasIniciales, children }: Props) {
  const { nombre: tema, cambiarTema } = useTema();
  const [resto, setResto] = useState<SinTema>(() => {
    const { tema: _tema, ...sinTema } = normalizarPreferencias(preferenciasIniciales);
    return sinTema;
  });

  const preferencias = useMemo<PreferenciasApariencia>(() => ({ ...resto, tema }), [resto, tema]);

  const cambiar = useCallback(
    (cambios: Partial<PreferenciasApariencia>) => {
      const { tema: nuevoTema, ...demas } = cambios;
      if (nuevoTema !== undefined) cambiarTema(nuevoTema);
      if (Object.keys(demas).length > 0) {
        // Se normaliza para ignorar valores que no existan
        setResto((actual) => {
          const { tema: _t, ...limpio } = normalizarPreferencias({ ...actual, ...demas });
          return limpio;
        });
      }
    },
    [cambiarTema],
  );

  const restablecer = useCallback(() => {
    const { tema: temaPorDefecto, ...sinTema } = PREFERENCIAS_POR_DEFECTO;
    cambiarTema(temaPorDefecto);
    setResto(sinTema);
  }, [cambiarTema]);

  const valor = useMemo<ValorPreferencias>(
    () => ({ preferencias, estilos: estilosApariencia(preferencias), cambiar, restablecer }),
    [preferencias, cambiar, restablecer],
  );

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}

/** Devuelve las preferencias activas. Debe usarse dentro de <PreferenciasProvider>. */
export function usePreferencias(): ValorPreferencias {
  const valor = useContext(PreferenciasContext);
  if (!valor) {
    throw new Error("usePreferencias debe usarse dentro de <PreferenciasProvider>");
  }
  return valor;
}

/**
 * Devuelve las preferencias activas, o null fuera de <PreferenciasProvider>. Para componentes
 * reutilizables que también se montan sueltos (p. ej. en los tests).
 */
export function usePreferenciasOpcional(): ValorPreferencias | null {
  return useContext(PreferenciasContext);
}
