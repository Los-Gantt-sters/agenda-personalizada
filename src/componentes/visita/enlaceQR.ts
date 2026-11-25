// Enlace de un código QR de la visita (HU-15 · SCRUM-114 · T-15.2).
// Un QR puede llevar cualquier texto, y una pegatina encima del QR de una puerta podría llevar a
// cualquier sitio (hay menores). Por eso, antes de ofrecer abrir nada:
//   - Solo enlaces https (nada de javascript:, data:, file:, intent:, http en claro...).
//   - Sin usuario ni contraseña en el enlace, y como mucho 2048 caracteres.
//   - Si está configurada la lista de sitios permitidos (EXPO_PUBLIC_QR_SITIOS_PERMITIDOS, separados
//     por comas), solo esos sitios y sus subdominios. Cuando exista el registro de enlaces por sala
//     (SCRUM-270), se abrirán solo los registrados.
// La ventana se abre al TOCAR un botón, no al leer el código: los navegadores bloquean las ventanas
// que no salen de un toque, y así el alumno ve a qué sitio va antes de entrar.
import { Linking, Platform } from "react-native";

export const LONGITUD_MAXIMA_QR = 2048;

export type EnlaceQR =
  | { valido: true; url: string; sitio: string }
  | {
      valido: false;
      motivo: "vacio" | "largo" | "no-es-enlace" | "protocolo" | "credenciales" | "sitio";
    };

/** Sitios permitidos de la configuración (en minúsculas y sin «www.»). Vacía = cualquiera https. */
export function sitiosPermitidos(
  valor: string | undefined = process.env.EXPO_PUBLIC_QR_SITIOS_PERMITIDOS,
): string[] {
  return (valor ?? "")
    .split(",")
    .map((s) =>
      s
        .trim()
        .toLowerCase()
        .replace(/^www\./, ""),
    )
    .filter(Boolean);
}

/** El sitio es uno de los permitidos o un subdominio suyo (biblioteca.centro.es con centro.es). */
function sitioPermitido(host: string, permitidos: string[]): boolean {
  if (permitidos.length === 0) return true;
  return permitidos.some((p) => host === p || host.endsWith(`.${p}`));
}

/** Comprueba el texto leído de un QR y, si se puede abrir, lo devuelve limpio. */
export function validarEnlaceQR(
  texto: string | null | undefined,
  permitidos: string[] = sitiosPermitidos(),
): EnlaceQR {
  const limpio = (texto ?? "").trim();
  if (!limpio) return { valido: false, motivo: "vacio" };
  if (limpio.length > LONGITUD_MAXIMA_QR) return { valido: false, motivo: "largo" };

  let url: URL;
  try {
    url = new URL(limpio);
  } catch {
    return { valido: false, motivo: "no-es-enlace" };
  }
  if (url.protocol !== "https:") return { valido: false, motivo: "protocolo" };
  if (url.username || url.password) return { valido: false, motivo: "credenciales" };
  if (!url.hostname) return { valido: false, motivo: "no-es-enlace" };

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!sitioPermitido(host, permitidos)) return { valido: false, motivo: "sitio" };

  return { valido: true, url: url.toString(), sitio: host };
}

/**
 * Abre un enlace ya comprobado fuera de la aplicación. Hay que llamarla desde un toque del alumno
 * (si no, el navegador la bloquea). Devuelve false si no se ha podido abrir.
 */
export async function abrirEnlaceExterno(url: string): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      // Sin «noopener» en la llamada para poder saber si el navegador la ha bloqueado (con noopener
      // siempre devuelve null); después se corta el acceso de esa página a la app.
      const ventana = globalThis.open?.(url, "_blank");
      if (!ventana) return false;
      ventana.opener = null;
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
