// Aviso suave al acabarse el tiempo (HU-09, T-09.3): parpadeo lento y campanita, una sola vez.
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform } from "react-native";

import { reproducirSonido } from "../../servicios/sonidos";
import { seAcabaDeAgotar } from "./calculoReloj";

// Tres pulsos lentos y luego quieto: avisa sin convertirse en una distracción constante
const PULSOS = 3;
const MEDIO_PULSO_MS = 900;
const OPACIDAD_MINIMA = 0.4;

type Opciones = {
  sonido: boolean;
  parpadeo: boolean;
  onTiempoAgotado?: () => void;
};

/** `true` si el usuario ha pedido al sistema reducir el movimiento de la interfaz. */
function useReducirMovimiento(): boolean {
  const [reducir, setReducir] = useState(false);
  useEffect(() => {
    let montado = true;
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => montado && setReducir(valor));
    const suscripcion = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducir);
    return () => {
      montado = false;
      suscripcion.remove();
    };
  }, []);
  return reducir;
}

/**
 * Vigila la fracción de tiempo restante y, en el momento en que llega a cero, lanza el aviso.
 * Devuelve la opacidad animada que hay que aplicar al reloj para el parpadeo.
 */
export function useAlarmaSuave(
  fraccion: number,
  { sonido, parpadeo, onTiempoAgotado }: Opciones,
): Animated.Value {
  // Se crea una sola vez y se mantiene entre pintadas (no hace falta volver a pintar al animarlo)
  const [opacidad] = useState(() => new Animated.Value(1));
  const animacion = useRef<Animated.CompositeAnimation | null>(null);
  const fraccionAnterior = useRef(fraccion);
  const reducirMovimiento = useReducirMovimiento();

  // Se guarda la última versión del callback para no tener que repetir el efecto cuando cambie
  const onTiempoAgotadoRef = useRef(onTiempoAgotado);
  useEffect(() => {
    onTiempoAgotadoRef.current = onTiempoAgotado;
  });

  useEffect(() => {
    const anterior = fraccionAnterior.current;
    fraccionAnterior.current = fraccion;

    // Si se reinicia el tiempo, se corta el parpadeo y el reloj vuelve a verse entero
    if (fraccion > 0) {
      animacion.current?.stop();
      opacidad.setValue(1);
      return;
    }
    if (!seAcabaDeAgotar(anterior, fraccion)) return;

    if (sonido) reproducirSonido("finTiempo");
    onTiempoAgotadoRef.current?.();

    if (parpadeo && !reducirMovimiento) {
      const paso = (valor: number) =>
        Animated.timing(opacidad, {
          toValue: valor,
          duration: MEDIO_PULSO_MS,
          easing: Easing.inOut(Easing.sin),
          // El driver nativo no existe en web
          useNativeDriver: Platform.OS !== "web",
        });
      animacion.current = Animated.loop(Animated.sequence([paso(OPACIDAD_MINIMA), paso(1)]), {
        iterations: PULSOS,
      });
      animacion.current.start();
    }
  }, [fraccion, sonido, parpadeo, reducirMovimiento, opacidad]);

  return opacidad;
}
