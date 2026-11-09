// Cliente de la API pública de ARASAAC (RF16.3). Es la única capa que habla con ARASAAC, así el
// resto de la app no depende de su formato (mismo criterio que RNF16.6 para el backend).
import { limpiarTermino, normalizarTexto } from "./texto";
import { ErrorArasaac, PictogramaArasaac } from "./tipos";
import {
  IDIOMA_POR_DEFECTO,
  TAMANO_POR_DEFECTO,
  URL_API_ARASAAC,
  esIdentificadorValido,
  urlImagenPictograma,
} from "./urls";

export const LONGITUD_MINIMA_TERMINO = 2;
export const LONGITUD_MAXIMA_TERMINO = 60;
export const LIMITE_POR_DEFECTO = 30;

export interface OpcionesCliente {
  /** Función fetch a usar (por defecto, la global). Se inyecta en los tests. */
  fetchFn?: typeof fetch;
  /** Idioma de búsqueda (por defecto, español). */
  idioma?: string;
  /** Milisegundos máximos de espera por petición. */
  tiempoMaxMs?: number;
  /** Tiempo que se reutiliza una búsqueda ya hecha, para no repetir peticiones. */
  ttlCacheMs?: number;
  /** Reloj, para poder probar la caducidad de la caché. */
  ahora?: () => number;
  /** Dirección base de la API. */
  urlApi?: string;
}

export interface OpcionesBusqueda {
  /** Máximo de pictogramas a devolver. */
  limite?: number;
  /** Para cancelar la búsqueda (p. ej. cuando el usuario sigue escribiendo). */
  senal?: AbortSignal;
}

export interface ClienteArasaac {
  /** Busca pictogramas por palabra. Sin resultados devuelve una lista vacía. */
  buscar(termino: string, opciones?: OpcionesBusqueda): Promise<PictogramaArasaac[]>;
  /** Devuelve un pictograma por su identificador, o null si no existe. */
  obtener(id: number, opciones?: { senal?: AbortSignal }): Promise<PictogramaArasaac | null>;
  /** Vacía la caché de búsquedas. */
  limpiarCache(): void;
}

interface RespuestaJson {
  /** Código HTTP de la respuesta. */
  estado: number;
  cuerpo: unknown;
}

/** Normaliza un pictograma de la API; devuelve null si le faltan datos imprescindibles. */
export function normalizarPictograma(
  crudo: unknown,
  termino?: string,
  tamano: number = TAMANO_POR_DEFECTO,
): PictogramaArasaac | null {
  if (typeof crudo !== "object" || crudo === null) return null;
  const datos = crudo as Record<string, unknown>;
  const id = datos._id;
  if (!esIdentificadorValido(id) || !Array.isArray(datos.keywords)) return null;

  const palabrasClave = datos.keywords
    .map((k) => (typeof k === "object" && k !== null ? (k as { keyword?: unknown }).keyword : null))
    .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
    .map((k) => k.trim());
  if (palabrasClave.length === 0) return null;

  const buscada = termino ? normalizarTexto(termino) : "";
  const palabraClave =
    (buscada && palabrasClave.find((p) => normalizarTexto(p) === buscada)) ||
    (buscada && palabrasClave.find((p) => normalizarTexto(p).includes(buscada))) ||
    palabrasClave[0];

  const categorias = Array.isArray(datos.categories)
    ? datos.categories.filter((c): c is string => typeof c === "string")
    : [];

  return {
    id,
    palabraClave,
    palabrasClave,
    urlImagen: urlImagenPictograma(id, tamano),
    descripcion: `Pictograma de ${palabraClave}`,
    categorias,
  };
}

export function crearClienteArasaac(opciones: OpcionesCliente = {}): ClienteArasaac {
  const idioma = opciones.idioma ?? IDIOMA_POR_DEFECTO;
  const tiempoMaxMs = opciones.tiempoMaxMs ?? 8000;
  const ttlCacheMs = opciones.ttlCacheMs ?? 5 * 60 * 1000;
  const ahora = opciones.ahora ?? Date.now;
  const urlApi = opciones.urlApi ?? URL_API_ARASAAC;

  const cache = new Map<string, { caduca: number; datos: PictogramaArasaac[] }>();
  const enCurso = new Map<string, Promise<PictogramaArasaac[]>>();

  async function pedirJson(url: string): Promise<RespuestaJson> {
    const fetchFn = opciones.fetchFn ?? globalThis.fetch;
    const controlador = new AbortController();
    let agotado = false;
    const temporizador = setTimeout(() => {
      agotado = true;
      controlador.abort();
    }, tiempoMaxMs);

    try {
      const respuesta = await fetchFn(url, {
        signal: controlador.signal,
        headers: { Accept: "application/json" },
      });
      if (respuesta.status === 404) return { estado: 404, cuerpo: null };
      if (!respuesta.ok) throw new ErrorArasaac("error_servidor", `HTTP ${respuesta.status}`);
      try {
        return { estado: respuesta.status, cuerpo: await respuesta.json() };
      } catch {
        throw new ErrorArasaac("respuesta_invalida", "La respuesta no es JSON");
      }
    } catch (error) {
      if (error instanceof ErrorArasaac) throw error;
      if (agotado) throw new ErrorArasaac("tiempo_agotado");
      throw new ErrorArasaac("sin_conexion", error instanceof Error ? error.message : undefined);
    } finally {
      clearTimeout(temporizador);
    }
  }

  /** Espera una promesa, pero termina antes con «cancelada» si el llamante cancela. */
  function conSenal<T>(promesa: Promise<T>, senal?: AbortSignal): Promise<T> {
    if (!senal) return promesa;
    if (senal.aborted) return Promise.reject(new ErrorArasaac("cancelada"));
    return new Promise<T>((resolver, rechazar) => {
      const alCancelar = () => rechazar(new ErrorArasaac("cancelada"));
      senal.addEventListener("abort", alCancelar, { once: true });
      promesa.then(
        (valor) => {
          senal.removeEventListener("abort", alCancelar);
          resolver(valor);
        },
        (error) => {
          senal.removeEventListener("abort", alCancelar);
          rechazar(error);
        },
      );
    });
  }

  function descargarBusqueda(terminoLimpio: string): Promise<PictogramaArasaac[]> {
    const url = `${urlApi}/pictograms/${idioma}/search/${encodeURIComponent(terminoLimpio)}`;
    return pedirJson(url).then(({ estado, cuerpo }) => {
      if (estado === 404) return [];
      if (!Array.isArray(cuerpo)) {
        throw new ErrorArasaac("respuesta_invalida", "Se esperaba una lista de pictogramas");
      }
      const vistos = new Set<number>();
      const resultado: PictogramaArasaac[] = [];
      for (const crudo of cuerpo) {
        const pictograma = normalizarPictograma(crudo, terminoLimpio);
        if (pictograma && !vistos.has(pictograma.id)) {
          vistos.add(pictograma.id);
          resultado.push(pictograma);
        }
      }
      if (cuerpo.length > 0 && resultado.length === 0) {
        throw new ErrorArasaac("respuesta_invalida", "Ningún pictograma tiene el formato esperado");
      }
      return resultado;
    });
  }

  return {
    async buscar(termino, opcionesBusqueda = {}) {
      const terminoLimpio = limpiarTermino(termino ?? "");
      if (
        terminoLimpio.length < LONGITUD_MINIMA_TERMINO ||
        terminoLimpio.length > LONGITUD_MAXIMA_TERMINO
      ) {
        throw new ErrorArasaac("termino_invalido");
      }
      const limite = Math.max(1, Math.floor(opcionesBusqueda.limite ?? LIMITE_POR_DEFECTO));
      const clave = `${idioma}:${terminoLimpio.toLowerCase()}`;

      const guardado = cache.get(clave);
      if (guardado && guardado.caduca > ahora()) {
        return guardado.datos.slice(0, limite);
      }

      let peticion = enCurso.get(clave);
      if (!peticion) {
        peticion = descargarBusqueda(terminoLimpio)
          .then((datos) => {
            cache.set(clave, { caduca: ahora() + ttlCacheMs, datos });
            return datos;
          })
          .finally(() => enCurso.delete(clave));
        enCurso.set(clave, peticion);
      }

      const datos = await conSenal(peticion, opcionesBusqueda.senal);
      return datos.slice(0, limite);
    },

    async obtener(id, opcionesObtener = {}) {
      if (!esIdentificadorValido(id)) {
        throw new ErrorArasaac("identificador_invalido");
      }
      const url = `${urlApi}/pictograms/${idioma}/${id}`;
      const { estado, cuerpo } = await conSenal(pedirJson(url), opcionesObtener.senal);
      if (estado === 404) return null;
      const pictograma = normalizarPictograma(cuerpo);
      if (!pictograma) {
        throw new ErrorArasaac("respuesta_invalida", "El pictograma no tiene el formato esperado");
      }
      return pictograma;
    },

    limpiarCache() {
      cache.clear();
    },
  };
}

/** Cliente compartido por toda la app, con la configuración por defecto. */
export const clienteArasaac: ClienteArasaac = crearClienteArasaac();

export function buscarPictogramas(termino: string, opciones?: OpcionesBusqueda) {
  return clienteArasaac.buscar(termino, opciones);
}

export function obtenerPictograma(id: number, opciones?: { senal?: AbortSignal }) {
  return clienteArasaac.obtener(id, opciones);
}
