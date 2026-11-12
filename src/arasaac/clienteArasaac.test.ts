import { describe, expect, it, jest } from "@jest/globals";

import { crearClienteArasaac, normalizarPictograma } from "./clienteArasaac";
import { ErrorArasaac } from "./tipos";

const CASA = {
  _id: 6964,
  keywords: [{ keyword: "casa", type: 2, plural: "casas" }],
  categories: ["residential building"],
};
const BANO = {
  _id: 6929,
  keywords: [{ keyword: "cuarto de baño" }, { keyword: "baño" }],
  categories: [],
};

function respuesta(cuerpo: unknown, estado = 200) {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  } as unknown as Response;
}

function fetchSimulado(...respuestas: (Response | Error)[]) {
  const mock = jest.fn(async (_url: unknown, _init?: unknown) => {
    const siguiente = respuestas.length > 1 ? respuestas.shift()! : respuestas[0];
    if (siguiente instanceof Error) throw siguiente;
    return siguiente;
  });
  return mock;
}

const comoFetch = (m: ReturnType<typeof fetchSimulado>) => m as unknown as typeof fetch;

async function capturarError(promesa: Promise<unknown>): Promise<ErrorArasaac> {
  try {
    await promesa;
  } catch (error) {
    return error as ErrorArasaac;
  }
  throw new Error("Se esperaba un error y no se produjo");
}

describe("normalizarPictograma", () => {
  it("convierte la respuesta de la API al formato del catálogo", () => {
    expect(normalizarPictograma(CASA)).toEqual({
      id: 6964,
      palabraClave: "casa",
      palabrasClave: ["casa"],
      urlImagen: "https://static.arasaac.org/pictograms/6964/6964_500.png",
      descripcion: "Pictograma de casa",
      categorias: ["residential building"],
    });
  });

  it("elige como palabra clave la que coincide con lo buscado", () => {
    expect(normalizarPictograma(BANO, "baño")?.palabraClave).toBe("baño");
    expect(normalizarPictograma(BANO, "cuarto")?.palabraClave).toBe("cuarto de baño");
    expect(normalizarPictograma(BANO)?.palabraClave).toBe("cuarto de baño");
  });

  it("descarta datos sin identificador válido o sin palabras clave", () => {
    expect(normalizarPictograma(null)).toBeNull();
    expect(normalizarPictograma({ keywords: [{ keyword: "x" }] })).toBeNull();
    expect(normalizarPictograma({ _id: "7", keywords: [{ keyword: "x" }] })).toBeNull();
    expect(normalizarPictograma({ _id: 7, keywords: [] })).toBeNull();
    expect(normalizarPictograma({ _id: 7, keywords: [{ keyword: "  " }] })).toBeNull();
    expect(normalizarPictograma({ _id: 7 })).toBeNull();
  });
});

describe("buscar", () => {
  it("pide la búsqueda a la API pública en español y codifica el texto", async () => {
    const f = fetchSimulado(respuesta([CASA]));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    const resultado = await cliente.buscar("  cuarto de baño ");
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe(
      "https://api.arasaac.org/v1/pictograms/es/search/cuarto%20de%20ba%C3%B1o",
    );
    expect(resultado[0].id).toBe(6964);
  });

  it("sin resultados (404 de ARASAAC) devuelve una lista vacía, no un error", async () => {
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(fetchSimulado(respuesta([], 404))) });
    await expect(cliente.buscar("xqzwvk")).resolves.toEqual([]);
  });

  it("quita pictogramas repetidos y los que llegan con formato roto", async () => {
    const f = fetchSimulado(respuesta([CASA, CASA, { _id: 1 }, BANO]));
    const resultado = await crearClienteArasaac({ fetchFn: comoFetch(f) }).buscar("casa");
    expect(resultado.map((p) => p.id)).toEqual([6964, 6929]);
  });

  it("respeta el límite de resultados", async () => {
    const f = fetchSimulado(respuesta([CASA, BANO]));
    const resultado = await crearClienteArasaac({ fetchFn: comoFetch(f) }).buscar("casa", {
      limite: 1,
    });
    expect(resultado).toHaveLength(1);
  });

  it("rechaza textos demasiado cortos o largos sin llamar a la red", async () => {
    const f = fetchSimulado(respuesta([CASA]));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    const errorCorto = await capturarError(cliente.buscar("a"));
    const errorVacio = await capturarError(cliente.buscar("   "));
    const errorLargo = await capturarError(cliente.buscar("x".repeat(61)));
    expect(errorCorto.codigo).toBe("termino_invalido");
    expect(errorVacio.codigo).toBe("termino_invalido");
    expect(errorLargo.codigo).toBe("termino_invalido");
    expect(errorCorto.mensajeUsuario).toBe("Escribe entre 2 y 60 letras para buscar.");
    expect(errorLargo.mensajeUsuario).toBe("Escribe entre 2 y 60 letras para buscar.");
    expect(f).not.toHaveBeenCalled();
  });

  it("un fallo del servidor da error_servidor con mensaje en Lectura Fácil", async () => {
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(fetchSimulado(respuesta({}, 500))) });
    const error = await capturarError(cliente.buscar("casa"));
    expect(error.codigo).toBe("error_servidor");
    expect(error.mensajeUsuario).toMatch(/más tarde/);
  });

  it("sin internet da sin_conexion", async () => {
    const f = fetchSimulado(new TypeError("Network request failed"));
    const error = await capturarError(
      crearClienteArasaac({ fetchFn: comoFetch(f) }).buscar("casa"),
    );
    expect(error.codigo).toBe("sin_conexion");
  });

  it("una respuesta que no es una lista da respuesta_invalida", async () => {
    const f = fetchSimulado(respuesta({ mensaje: "hola" }));
    const error = await capturarError(
      crearClienteArasaac({ fetchFn: comoFetch(f) }).buscar("casa"),
    );
    expect(error.codigo).toBe("respuesta_invalida");
  });

  it("una lista con todos los elementos rotos da respuesta_invalida", async () => {
    const f = fetchSimulado(respuesta([{ foo: 1 }, { bar: 2 }]));
    const error = await capturarError(
      crearClienteArasaac({ fetchFn: comoFetch(f) }).buscar("casa"),
    );
    expect(error.codigo).toBe("respuesta_invalida");
  });

  it("un JSON ilegible da respuesta_invalida", async () => {
    const rota = {
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response;
    const error = await capturarError(
      crearClienteArasaac({ fetchFn: comoFetch(fetchSimulado(rota)) }).buscar("casa"),
    );
    expect(error.codigo).toBe("respuesta_invalida");
  });

  it("si la API tarda más del tiempo máximo da tiempo_agotado", async () => {
    const lento = jest.fn(
      (_url: unknown, init?: { signal?: AbortSignal }) =>
        new Promise<Response>((_resolver, rechazar) => {
          init?.signal?.addEventListener("abort", () => rechazar(new Error("abortado")));
        }),
    );
    const cliente = crearClienteArasaac({
      fetchFn: lento as unknown as typeof fetch,
      tiempoMaxMs: 20,
    });
    expect((await capturarError(cliente.buscar("casa"))).codigo).toBe("tiempo_agotado");
  });

  it("se puede cancelar la búsqueda", async () => {
    const f = fetchSimulado(respuesta([CASA]));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    const controlador = new AbortController();
    const promesa = cliente.buscar("casa", { senal: controlador.signal });
    controlador.abort();
    expect((await capturarError(promesa)).codigo).toBe("cancelada");
  });

  it("una señal ya cancelada falla enseguida", async () => {
    const f = fetchSimulado(respuesta([CASA]));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    const controlador = new AbortController();
    controlador.abort();
    expect(
      (await capturarError(cliente.buscar("casa", { senal: controlador.signal }))).codigo,
    ).toBe("cancelada");
  });
});

describe("caché y peticiones repetidas", () => {
  it("la misma búsqueda no vuelve a pedirse a ARASAAC (ni con otras mayúsculas)", async () => {
    const f = fetchSimulado(respuesta([CASA]));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    await cliente.buscar("casa");
    await cliente.buscar("CASA");
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("dos búsquedas a la vez comparten una sola petición", async () => {
    const f = fetchSimulado(respuesta([CASA]));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    await Promise.all([cliente.buscar("casa"), cliente.buscar("casa")]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("la caché caduca pasado el tiempo configurado", async () => {
    let t = 0;
    const f = fetchSimulado(respuesta([CASA]));
    const cliente = crearClienteArasaac({
      fetchFn: comoFetch(f),
      ttlCacheMs: 1000,
      ahora: () => t,
    });
    await cliente.buscar("casa");
    t = 999;
    await cliente.buscar("casa");
    expect(f).toHaveBeenCalledTimes(1);
    t = 1001;
    await cliente.buscar("casa");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("los errores no se guardan: al reintentar se vuelve a pedir", async () => {
    const f = fetchSimulado(respuesta({}, 500), respuesta([CASA]));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    await capturarError(cliente.buscar("casa"));
    await expect(cliente.buscar("casa")).resolves.toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("limpiarCache fuerza una petición nueva", async () => {
    const f = fetchSimulado(respuesta([CASA]));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    await cliente.buscar("casa");
    cliente.limpiarCache();
    await cliente.buscar("casa");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("cancelar un llamante no estropea la petición compartida de otro", async () => {
    const f = fetchSimulado(respuesta([CASA]));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    const controlador = new AbortController();
    const cancelada = cliente.buscar("casa", { senal: controlador.signal });
    const normal = cliente.buscar("casa");
    controlador.abort();
    expect((await capturarError(cancelada)).codigo).toBe("cancelada");
    await expect(normal).resolves.toHaveLength(1);
  });
});

describe("obtener", () => {
  it("devuelve un pictograma por identificador", async () => {
    const f = fetchSimulado(respuesta(CASA));
    const p = await crearClienteArasaac({ fetchFn: comoFetch(f) }).obtener(6964);
    expect(f.mock.calls[0][0]).toBe("https://api.arasaac.org/v1/pictograms/es/6964");
    expect(p?.palabraClave).toBe("casa");
  });

  it("devuelve null si no existe (404)", async () => {
    const f = fetchSimulado(respuesta({}, 404));
    await expect(
      crearClienteArasaac({ fetchFn: comoFetch(f) }).obtener(99999999),
    ).resolves.toBeNull();
  });

  it("rechaza identificadores no válidos sin llamar a la red", async () => {
    const f = fetchSimulado(respuesta(CASA));
    const cliente = crearClienteArasaac({ fetchFn: comoFetch(f) });
    expect((await capturarError(cliente.obtener(0))).codigo).toBe("identificador_invalido");
    expect((await capturarError(cliente.obtener(1.2))).codigo).toBe("identificador_invalido");
    expect(f).not.toHaveBeenCalled();
  });

  it("una respuesta con formato roto da respuesta_invalida", async () => {
    const f = fetchSimulado(respuesta({ algo: 1 }));
    const error = await capturarError(crearClienteArasaac({ fetchFn: comoFetch(f) }).obtener(6964));
    expect(error.codigo).toBe("respuesta_invalida");
  });
});
