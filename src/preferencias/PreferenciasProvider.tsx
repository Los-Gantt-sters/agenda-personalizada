// Preferencias de apariencia del estudiante activo (RI3.1). El tema vive en TemaProvider (T-04.1);
// aquí se guarda todo lo demás (letra, botones, forma, formato 17, locución, vistaAgenda 24,
// tareasVisibles 24, reloj y avisoPrevio 25, ayudas 26 y barrido por pulsadores) y se sincroniza
// también con MotorBarridoProvider cuando está montado.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useMotorBarridoOpcional } from "../componentes/barrido-pulsadores/MotorBarridoProvider";
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
  /** Cambia una o varias preferencias. Los cambios se aplican y persisten en el proveedor (RF3.15). */
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
  const motorBarrido = useMotorBarridoOpcional();
  const actualizarMotorBarrido = motorBarrido?.actualizarConfiguracion;

  const [resto, setResto] = useState<SinTema>(() => {
    const { tema: _tema, ...sinTema } = normalizarPreferencias(preferenciasIniciales);
    return sinTema;
  });

  const preferencias = useMemo<PreferenciasApariencia>(() => ({ ...resto, tema }), [resto, tema]);

  // Sincroniza el modo y la velocidad de barrido con MotorBarridoProvider cuando está activo
  useEffect(() => {
    if (!actualizarMotorBarrido) return;
    actualizarMotorBarrido({
      modo: resto.modoBarrido,
      intervaloMs: resto.intervaloBarridoMs,
    });
  }, [actualizarMotorBarrido, resto.intervaloBarridoMs, resto.modoBarrido]);

  const cambiar = useCallback(
    (cambios: Partial<PreferenciasApariencia>) => {
      const { tema: nuevoTema, ...demas } = cambios;
      if (nuevoTema !== undefined) cambiarTema(nuevoTema);
      if (Object.keys(demas).length > 0) {
        setResto((actual) => {
          const { tema: _t, ...limpio } = normalizarPreferencias({ ...actual, ...demas });
          return limpio;
        });
      }
    },
    [cambiarTema],
  );

  const restablecer = useCallback(() => {
    const { tema: temaPorDefecto, ...sinTema } = normalizarPreferencias(PREFERENCIAS_POR_DEFECTO);
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
