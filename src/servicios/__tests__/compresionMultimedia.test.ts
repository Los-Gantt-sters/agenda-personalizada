import {
  LADO_MAX_FOTO,
  extensionDe,
  medidasReducidas,
  mimeBase,
  prepararMultimedia,
  textoTamano,
  validarMultimedia,
} from "../compresionMultimedia";

const MB = 1024 * 1024;

describe("compresionMultimedia (SCRUM-96: T-10.3 compresión y validación)", () => {
  describe("medidasReducidas", () => {
    it("reduce el lado largo a 1280 px sin deformar la foto", () => {
      expect(medidasReducidas(4000, 3000)).toEqual({ ancho: LADO_MAX_FOTO, alto: 960 });
      expect(medidasReducidas(3000, 4000)).toEqual({ ancho: 960, alto: LADO_MAX_FOTO });
    });

    it("deja como están las fotos que ya son pequeñas", () => {
      expect(medidasReducidas(800, 600)).toEqual({ ancho: 800, alto: 600 });
      expect(medidasReducidas(1280, 720)).toEqual({ ancho: 1280, alto: 720 });
    });
  });

  it("saca la extensión y el tipo base del MIME", () => {
    expect(extensionDe("image/jpeg")).toBe("jpg");
    expect(extensionDe("audio/webm;codecs=opus")).toBe("webm");
    expect(extensionDe("application/pdf")).toBe("bin");
    expect(mimeBase("Audio/WEBM; codecs=opus")).toBe("audio/webm");
  });

  it("escribe los tamaños para el tutor", () => {
    expect(textoTamano(350 * 1024)).toBe("350 KB");
    expect(textoTamano(12.5 * MB)).toBe("12,5 MB");
  });

  describe("validarMultimedia", () => {
    it("acepta una foto, un vídeo corto y un audio dentro de los límites", () => {
      expect(
        validarMultimedia("foto", { tipoMime: "image/jpeg", tamanoBytes: 300_000 }),
      ).toBeNull();
      expect(
        validarMultimedia("video", {
          tipoMime: "video/mp4",
          tamanoBytes: 8 * MB,
          duracionSegundos: 12,
        }),
      ).toBeNull();
      expect(
        validarMultimedia("audio", {
          tipoMime: "audio/webm;codecs=opus",
          tamanoBytes: 80_000,
          duracionSegundos: 5,
        }),
      ).toBeNull();
    });

    it("rechaza tipos que no son del formato", () => {
      expect(validarMultimedia("foto", { tipoMime: "video/mp4", tamanoBytes: 10 })).toMatch(
        /JPG, PNG o WEBP/,
      );
      expect(validarMultimedia("video", { tipoMime: "application/pdf", tamanoBytes: 10 })).toMatch(
        /MP4/,
      );
    });

    it("rechaza archivos vacíos, demasiado grandes o demasiado largos", () => {
      expect(validarMultimedia("foto", { tipoMime: "image/png", tamanoBytes: 0 })).toMatch(/vacío/);
      expect(validarMultimedia("foto", { tipoMime: "image/png", tamanoBytes: 6 * MB })).toMatch(
        /demasiado grande .*Máximo 5,0 MB/,
      );
      expect(
        validarMultimedia("video", {
          tipoMime: "video/mp4",
          tamanoBytes: MB,
          duracionSegundos: 90,
        }),
      ).toMatch(/demasiado largo \(90 s\)\. Máximo 60 s/);
    });
  });

  describe("prepararMultimedia", () => {
    it("deja pasar un audio válido (fuera del navegador no se mide la duración)", async () => {
      const blob = new Blob(["a".repeat(2000)], { type: "audio/mpeg" });
      const r = await prepararMultimedia("audio", blob);
      expect(r).toEqual({
        ok: true,
        archivo: { blob, tipoMime: "audio/mpeg", tamanoBytes: 2000, duracionSegundos: null },
      });
    });

    it("no deja subir como foto un archivo que no es imagen", async () => {
      const r = await prepararMultimedia("foto", new Blob(["x"], { type: "text/plain" }));
      expect(r).toEqual({ ok: false, error: expect.stringMatching(/La foto tiene que ser/) });
    });
  });
});
