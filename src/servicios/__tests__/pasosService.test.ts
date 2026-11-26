import {
  BUCKET_MULTIMEDIA_PASOS,
  borrarMultimedia,
  SEGUNDOS_URL_FIRMADA,
  firmarMultimediaPasos,
  guardarPasos,
  limpiarMultimediaHuerfana,
  obtenerPasos,
  pasoParaGuardar,
  rutaMultimedia,
  subirMultimedia,
} from "../pasosService";
import { supabase } from "../../lib/supabaseClient";
import type { PasoTarea } from "../../componentes/agenda/tipos";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { rpc: jest.fn(), from: jest.fn(), storage: { from: jest.fn() } },
}));

const sb = supabase as unknown as {
  rpc: jest.Mock;
  from: jest.Mock;
  storage: { from: jest.Mock };
};
const TAREA = "00000000-0000-0000-0000-0000000000e1";

function bucketFalso() {
  const b = {
    createSignedUrls: jest.fn(async (rutas: string[]) => ({
      data: rutas.map((path) => ({ path, signedUrl: `https://firmada/${path}` })),
      error: null,
    })),
    createSignedUrl: jest.fn(async (path: string) => ({
      data: { signedUrl: `https://firmada/${path}` },
      error: null,
    })),
    upload: jest.fn(async () => ({ data: {}, error: null })),
    remove: jest.fn(async () => ({ data: [], error: null })),
  };
  sb.storage.from.mockReturnValue(b);
  return b;
}

const paso = (extra: Partial<PasoTarea> = {}): PasoTarea => ({
  id: "p1",
  orden: 1,
  titulo: "Abre el grifo",
  texto: "Gira el grifo despacio.",
  ...extra,
});

describe("pasosService (SCRUM-96: T-10.3 almacenamiento seguro)", () => {
  afterEach(() => jest.clearAllMocks());

  it("pone las rutas en la carpeta de la tarea y el formato, con nombre aleatorio", () => {
    const a = rutaMultimedia(TAREA, "foto", "image/jpeg");
    const b = rutaMultimedia(TAREA, "foto", "image/jpeg");
    expect(a).toMatch(new RegExp(`^${TAREA}/foto/[\\w-]+\\.jpg$`));
    expect(a).not.toBe(b);
    expect(rutaMultimedia(TAREA, "audio", "audio/webm;codecs=opus")).toMatch(/\/audio\/.+\.webm$/);
  });

  it("firma las rutas del bucket privado con URLs que caducan en 1 hora", async () => {
    const b = bucketFalso();
    const [p] = await firmarMultimediaPasos([
      paso({ foto: { ruta: `${TAREA}/foto/a.jpg` }, video: { url: "https://externo/v.mp4" } }),
    ]);
    expect(sb.storage.from).toHaveBeenCalledWith(BUCKET_MULTIMEDIA_PASOS);
    expect(b.createSignedUrls).toHaveBeenCalledWith([`${TAREA}/foto/a.jpg`], SEGUNDOS_URL_FIRMADA);
    expect(p.foto?.url).toBe(`https://firmada/${TAREA}/foto/a.jpg`);
    expect(p.video?.url).toBe("https://externo/v.mp4"); // las externas no se tocan
  });

  it("sin archivos subidos no llama a Storage", async () => {
    const pasos = [paso()];
    expect(await firmarMultimediaPasos(pasos)).toBe(pasos);
    expect(sb.storage.from).not.toHaveBeenCalled();
  });

  it("si no se puede firmar, deja el recurso sin URL (no se enseña) pero conserva su ruta", async () => {
    const b = bucketFalso();
    b.createSignedUrls.mockResolvedValueOnce({ data: null, error: new Error("sin red") } as never);
    const [p] = await firmarMultimediaPasos([paso({ audio: { ruta: `${TAREA}/audio/a.m4a` } })]);
    expect(p.audio).toEqual({ ruta: `${TAREA}/audio/a.m4a`, url: null });
  });

  it("revisión de Jaime: si falló la firma y el tutor solo cambia el título, no se pierde la foto", async () => {
    const b = bucketFalso();
    const foto = `${TAREA}/foto/a.jpg`;
    // El editor se abre con la wifi del cole caída: la foto llega sin URL
    b.createSignedUrls.mockResolvedValueOnce({ data: null, error: new Error("sin red") } as never);
    sb.rpc.mockResolvedValueOnce({ data: [paso({ foto: { ruta: foto } })], error: null });
    const [abierto] = await obtenerPasos(TAREA);

    sb.rpc
      .mockResolvedValueOnce({ data: [paso({ foto: { ruta: foto } })], error: null }) // antes
      .mockResolvedValueOnce({ data: [], error: null }) // guardar_pasos
      .mockResolvedValueOnce({ data: [paso({ foto: { ruta: foto } })], error: null }); // después
    await guardarPasos(TAREA, [{ ...abierto, titulo: "Abre el grifo despacio" }]);

    expect(sb.rpc).toHaveBeenNthCalledWith(3, "guardar_pasos", {
      p_tarea: TAREA,
      p_pasos: [expect.objectContaining({ foto: expect.objectContaining({ ruta: foto }) })],
    });
    expect(b.remove).not.toHaveBeenCalled();
  });

  it("no guarda en la base de datos las URLs firmadas (caducan), solo la ruta", () => {
    const g = pasoParaGuardar(
      paso({
        foto: { ruta: `${TAREA}/foto/a.jpg`, url: "https://firmada/x", tipo_mime: "image/jpeg" },
        video: null,
      }),
    );
    expect(g).toMatchObject({
      id: "p1",
      titulo: "Abre el grifo",
      texto: "Gira el grifo despacio.",
      foto: { ruta: `${TAREA}/foto/a.jpg`, url: null, tipo_mime: "image/jpeg" },
      video: null,
      audio: null,
    });
  });

  it("lee los pasos con pasos_de_tarea", async () => {
    bucketFalso();
    sb.rpc.mockResolvedValueOnce({ data: [paso()], error: null });
    expect(await obtenerPasos(TAREA)).toEqual([paso()]);
    expect(sb.rpc).toHaveBeenCalledWith("pasos_de_tarea", { p_tarea: TAREA });
  });

  it("guarda con guardar_pasos y borra del bucket la foto que se ha cambiado", async () => {
    const b = bucketFalso();
    const vieja = `${TAREA}/foto/vieja.jpg`;
    const nueva = `${TAREA}/foto/nueva.jpg`;
    sb.rpc
      .mockResolvedValueOnce({ data: [paso({ foto: { ruta: vieja } })], error: null }) // antes
      .mockResolvedValueOnce({ data: [], error: null }) // guardar_pasos
      .mockResolvedValueOnce({ data: [paso({ foto: { ruta: nueva } })], error: null }); // después

    const r = await guardarPasos(TAREA, [paso({ foto: { ruta: nueva } })]);

    expect(sb.rpc).toHaveBeenNthCalledWith(2, "guardar_pasos", {
      p_tarea: TAREA,
      p_pasos: [
        expect.objectContaining({ id: "p1", foto: expect.objectContaining({ ruta: nueva }) }),
      ],
    });
    expect(b.remove).toHaveBeenCalledWith([vieja]);
    expect(r[0].foto?.url).toBe(`https://firmada/${nueva}`);
  });

  it("si guardar_pasos falla (sin permiso), no borra nada y avisa", async () => {
    const b = bucketFalso();
    sb.rpc
      .mockResolvedValueOnce({
        data: [paso({ foto: { ruta: `${TAREA}/foto/a.jpg` } })],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: new Error("No tienes permiso") });
    await expect(guardarPasos(TAREA, [])).rejects.toThrow("No tienes permiso");
    expect(b.remove).not.toHaveBeenCalled();
  });

  it("borra del bucket los archivos huérfanos y no llama a Storage si no hay ninguno", async () => {
    const b = bucketFalso();
    await borrarMultimedia([]);
    expect(b.remove).not.toHaveBeenCalled();
    await borrarMultimedia([`${TAREA}/foto/sin-usar.jpg`]);
    expect(b.remove).toHaveBeenCalledWith([`${TAREA}/foto/sin-usar.jpg`]);
  });

  it("sube al bucket privado con su tipo y devuelve el recurso con URL firmada", async () => {
    const b = bucketFalso();
    const blob = new Blob(["x"], { type: "image/jpeg" });
    const r = await subirMultimedia(TAREA, "foto", {
      blob,
      tipoMime: "image/jpeg",
      tamanoBytes: 1,
      duracionSegundos: null,
    });
    expect(b.upload).toHaveBeenCalledWith(r.ruta, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });
    expect(r).toMatchObject({ tipo_mime: "image/jpeg", tamano_bytes: 1 });
    expect(r.url).toBe(`https://firmada/${r.ruta}`);
  });

  describe("limpiarMultimediaHuerfana (revisión de Jaime: archivos de tareas borradas)", () => {
    it("borra del bucket lo que la base de datos ha apuntado y lo quita de la lista", async () => {
      const b = bucketFalso();
      const rutas = [`${TAREA}/foto/a.jpg`, `${TAREA}/video/b.mp4`];
      sb.rpc.mockResolvedValueOnce({ data: rutas, error: null });
      const quitar = { in: jest.fn(async () => ({ error: null })) };
      sb.from.mockReturnValue({ delete: jest.fn(() => quitar) });

      await expect(limpiarMultimediaHuerfana()).resolves.toBe(2);
      expect(sb.rpc).toHaveBeenCalledWith("multimedia_huerfana");
      expect(b.remove).toHaveBeenCalledWith(rutas);
      expect(sb.from).toHaveBeenCalledWith("multimedia_por_borrar");
      expect(quitar.in).toHaveBeenCalledWith("ruta", rutas);
    });

    it("si no se pueden borrar del bucket, las deja apuntadas para la próxima vez", async () => {
      const b = bucketFalso();
      b.remove.mockResolvedValueOnce({ data: null, error: new Error("sin red") } as never);
      sb.rpc.mockResolvedValueOnce({ data: [`${TAREA}/foto/a.jpg`], error: null });
      await expect(limpiarMultimediaHuerfana()).resolves.toBe(0);
      expect(sb.from).not.toHaveBeenCalled();
    });

    it("quien no es de administración no recibe nada y no borra nada", async () => {
      const b = bucketFalso();
      sb.rpc.mockResolvedValueOnce({ data: [], error: null });
      await expect(limpiarMultimediaHuerfana()).resolves.toBe(0);
      expect(b.remove).not.toHaveBeenCalled();
    });
  });
});
