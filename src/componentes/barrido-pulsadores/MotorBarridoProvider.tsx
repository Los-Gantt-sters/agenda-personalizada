// Motor de barrido visual automático y manual con foco grueso (SCRUM-120 · T-05.1, HU-05).
// Permite recorrer secuencialmente los elementos interactivos de la pantalla de forma automática
// (1 único pulsador) o manual (2 pulsadores: avanzar y seleccionar), garantizando RNF3.4 y RF14.2.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  CONFIGURACION_BARRIDO_POR_DEFECTO,
  VELOCIDADES_BARRIDO_MS,
  type ConfiguracionBarrido,
  type IntervaloBarridoMs,
  type ModoBarridoPulsador,
  type ObjetivoBarrido,
  type RegistroActivacionBarrido,
} from "./tiposBarrido";

export interface ContextoMotorBarrido {
  configuracion: ConfiguracionBarrido;
  objetivosActivos: ObjetivoBarrido[];
  indiceFoco: number;
  objetivoEnfocado: ObjetivoBarrido | null;
  pausado: boolean;
  ultimaActivacion: RegistroActivacionBarrido | null;
  historialActivaciones: RegistroActivacionBarrido[];
  actualizarConfiguracion: (cambios: Partial<ConfiguracionBarrido>) => void;
  cambiarModo: (modo: ModoBarridoPulsador) => void;
  ajustarVelocidadStepper: (direccion: "inc" | "dec") => void;
  avanzarFoco: () => void;
  retrocederFoco: () => void;
  enfocarPorId: (id: string) => void;
  seleccionarActual: (
    origen?: RegistroActivacionBarrido["origen"],
  ) => RegistroActivacionBarrido | null;
  accionarPulsadorUnico: (
    origen?: RegistroActivacionBarrido["origen"],
  ) => RegistroActivacionBarrido | null;
  pausarBarrido: () => void;
  reanudarBarrido: () => void;
  registrarObjetivo: (objetivo: ObjetivoBarrido) => void;
  desregistrarObjetivo: (id: string) => void;
}

const MotorBarridoContext = createContext<ContextoMotorBarrido | null>(null);

export interface MotorBarridoProviderProps {
  configuracionInicial?: Partial<ConfiguracionBarrido>;
  objetivosIniciales?: ObjetivoBarrido[];
  pausadoInicial?: boolean;
  alActivarObjetivo?: (registro: RegistroActivacionBarrido) => void;
  children: ReactNode;
}

export function MotorBarridoProvider({
  configuracionInicial,
  objetivosIniciales = [],
  pausadoInicial = false,
  alActivarObjetivo,
  children,
}: MotorBarridoProviderProps): React.JSX.Element {
  const [configuracion, setConfiguracion] = useState<ConfiguracionBarrido>(() => ({
    ...CONFIGURACION_BARRIDO_POR_DEFECTO,
    ...configuracionInicial,
  }));
  const [mapaObjetivos, setMapaObjetivos] = useState<Record<string, ObjetivoBarrido>>(() => {
    const inicial: Record<string, ObjetivoBarrido> = {};
    objetivosIniciales.forEach((o, idx) => {
      inicial[o.id] = { ...o, orden: o.orden ?? idx };
    });
    return inicial;
  });
  const [indiceFoco, setIndiceFoco] = useState<number>(0);
  const [pausado, setPausado] = useState<boolean>(pausadoInicial);
  const [historialActivaciones, setHistorialActivaciones] = useState<RegistroActivacionBarrido[]>(
    [],
  );

  const ordenLlegadaRef = useRef<number>(objetivosIniciales.length);

  const objetivosActivos = useMemo<ObjetivoBarrido[]>(() => {
    return Object.values(mapaObjetivos)
      .filter((o) => !o.deshabilitado)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  }, [mapaObjetivos]);

  const indiceSeguro = useMemo<number>(() => {
    if (configuracion.modo === "desactivado" || objetivosActivos.length === 0) {
      return -1;
    }
    if (indiceFoco < 0 || indiceFoco >= objetivosActivos.length) {
      return 0;
    }
    return indiceFoco;
  }, [configuracion.modo, indiceFoco, objetivosActivos.length]);

  const objetivoEnfocado = useMemo<ObjetivoBarrido | null>(() => {
    if (indiceSeguro < 0 || indiceSeguro >= objetivosActivos.length) {
      return null;
    }
    return objetivosActivos[indiceSeguro] ?? null;
  }, [indiceSeguro, objetivosActivos]);

  const actualizarConfiguracion = useCallback((cambios: Partial<ConfiguracionBarrido>) => {
    setConfiguracion((actual) => ({ ...actual, ...cambios }));
  }, []);

  const cambiarModo = useCallback((modo: ModoBarridoPulsador) => {
    setConfiguracion((actual) => ({ ...actual, modo }));
    setIndiceFoco(0);
  }, []);

  const ajustarVelocidadStepper = useCallback((direccion: "inc" | "dec") => {
    setConfiguracion((actual) => {
      const idxActual = VELOCIDADES_BARRIDO_MS.indexOf(actual.intervaloMs);
      const idxBase = idxActual === -1 ? 1 : idxActual;
      const nuevoIdx =
        direccion === "inc"
          ? Math.min(VELOCIDADES_BARRIDO_MS.length - 1, idxBase + 1)
          : Math.max(0, idxBase - 1);
      const nuevoIntervalo: IntervaloBarridoMs = VELOCIDADES_BARRIDO_MS[nuevoIdx];
      return { ...actual, intervaloMs: nuevoIntervalo };
    });
  }, []);

  const avanzarFoco = useCallback(() => {
    setIndiceFoco((actual) => {
      if (objetivosActivos.length === 0) return -1;
      const base = actual < 0 || actual >= objetivosActivos.length ? 0 : actual;
      if (base + 1 >= objetivosActivos.length) {
        return configuracion.ciclico ? 0 : objetivosActivos.length - 1;
      }
      return base + 1;
    });
  }, [configuracion.ciclico, objetivosActivos.length]);

  const retrocederFoco = useCallback(() => {
    setIndiceFoco((actual) => {
      if (objetivosActivos.length === 0) return -1;
      const base = actual < 0 || actual >= objetivosActivos.length ? 0 : actual;
      if (base - 1 < 0) {
        return configuracion.ciclico ? objetivosActivos.length - 1 : 0;
      }
      return base - 1;
    });
  }, [configuracion.ciclico, objetivosActivos.length]);

  const enfocarPorId = useCallback(
    (id: string) => {
      const idx = objetivosActivos.findIndex((o) => o.id === id);
      if (idx !== -1) {
        setIndiceFoco(idx);
      }
    },
    [objetivosActivos],
  );

  const seleccionarActual = useCallback(
    (
      origen: RegistroActivacionBarrido["origen"] = "pulsador_seleccion",
    ): RegistroActivacionBarrido | null => {
      if (!objetivoEnfocado) return null;
      const registro: RegistroActivacionBarrido = {
        id: objetivoEnfocado.id,
        etiqueta: objetivoEnfocado.etiqueta,
        modo: configuracion.modo,
        origen,
        timestamp: Date.now(),
      };
      objetivoEnfocado.alActivar();
      setHistorialActivaciones((prev) => [registro, ...prev]);
      alActivarObjetivo?.(registro);
      return registro;
    },
    [alActivarObjetivo, configuracion.modo, objetivoEnfocado],
  );

  const accionarPulsadorUnico = useCallback(
    (
      origen: RegistroActivacionBarrido["origen"] = "pulsador_unico",
    ): RegistroActivacionBarrido | null => {
      if (configuracion.modo === "desactivado") return null;
      return seleccionarActual(origen);
    },
    [configuracion.modo, seleccionarActual],
  );

  const registrarObjetivo = useCallback((objetivo: ObjetivoBarrido) => {
    setMapaObjetivos((actual) => {
      const previo = actual[objetivo.id];
      const ordenAsignado = objetivo.orden ?? previo?.orden ?? ordenLlegadaRef.current++;
      return {
        ...actual,
        [objetivo.id]: { ...objetivo, orden: ordenAsignado },
      };
    });
  }, []);

  const desregistrarObjetivo = useCallback((id: string) => {
    setMapaObjetivos((actual) => {
      if (!(id in actual)) return actual;
      const copia = { ...actual };
      delete copia[id];
      return copia;
    });
  }, []);

  // Temporizador de barrido automático (T-05.1)
  useEffect(() => {
    if (configuracion.modo !== "automatico" || pausado || objetivosActivos.length === 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setIndiceFoco((actual) => {
        if (objetivosActivos.length === 0) return -1;
        const base = actual < 0 || actual >= objetivosActivos.length ? 0 : actual;
        if (base + 1 >= objetivosActivos.length) {
          return configuracion.ciclico ? 0 : objetivosActivos.length - 1;
        }
        return base + 1;
      });
    }, configuracion.intervaloMs);

    return () => clearInterval(timer);
  }, [
    configuracion.ciclico,
    configuracion.intervaloMs,
    configuracion.modo,
    objetivosActivos.length,
    pausado,
  ]);

  const valor = useMemo<ContextoMotorBarrido>(
    () => ({
      configuracion,
      objetivosActivos,
      indiceFoco: indiceSeguro,
      objetivoEnfocado,
      pausado,
      ultimaActivacion: historialActivaciones[0] ?? null,
      historialActivaciones,
      actualizarConfiguracion,
      cambiarModo,
      ajustarVelocidadStepper,
      avanzarFoco,
      retrocederFoco,
      enfocarPorId,
      seleccionarActual,
      accionarPulsadorUnico,
      pausarBarrido: () => setPausado(true),
      reanudarBarrido: () => setPausado(false),
      registrarObjetivo,
      desregistrarObjetivo,
    }),
    [
      accionarPulsadorUnico,
      actualizarConfiguracion,
      ajustarVelocidadStepper,
      avanzarFoco,
      cambiarModo,
      configuracion,
      desregistrarObjetivo,
      enfocarPorId,
      historialActivaciones,
      indiceSeguro,
      objetivoEnfocado,
      objetivosActivos,
      pausado,
      registrarObjetivo,
      retrocederFoco,
      seleccionarActual,
    ],
  );

  return <MotorBarridoContext.Provider value={valor}>{children}</MotorBarridoContext.Provider>;
}

export function useMotorBarrido(): ContextoMotorBarrido {
  const ctx = useContext(MotorBarridoContext);
  if (!ctx) {
    throw new Error("useMotorBarrido debe usarse dentro de <MotorBarridoProvider>");
  }
  return ctx;
}

export function useMotorBarridoOpcional(): ContextoMotorBarrido | null {
  return useContext(MotorBarridoContext);
}
