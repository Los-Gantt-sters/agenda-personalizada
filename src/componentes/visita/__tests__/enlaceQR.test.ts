// HU-15 · SCRUM-114 (T-15.2): qué códigos QR se pueden abrir y cómo.
import { Linking, Platform } from "react-native";

import {
  LONGITUD_MAXIMA_QR,
  abrirEnlaceExterno,
  sitiosPermitidos,
  validarEnlaceQR,
} from "../enlaceQR";

describe("validarEnlaceQR", () => {
  it("acepta enlaces https y devuelve el sitio sin www", () => {
    expect(validarEnlaceQR("  https://www.centro.es/biblioteca?sala=2 ", ["centro.es"])).toEqual({
      valido: true,
      url: "https://www.centro.es/biblioteca?sala=2",
      sitio: "centro.es",
    });
  });

  it.each([
    ["", "vacio"],
    [null, "vacio"],
    ["Biblioteca", "no-es-enlace"],
    ["http://centro.es", "protocolo"], // en claro: no
    ["javascript:alert(1)", "protocolo"],
    ["data:text/html,<script>alert(1)</script>", "protocolo"],
    ["file:///etc/passwd", "protocolo"],
    ["intent://scan#Intent;scheme=zxing;end", "protocolo"],
    ["https://usuario:clave@centro.es", "credenciales"],
    [`https://centro.es/${"a".repeat(LONGITUD_MAXIMA_QR)}`, "largo"],
  ])("no deja abrir «%s» (%s)", (texto, motivo) => {
    expect(validarEnlaceQR(texto as string | null, [])).toEqual({ valido: false, motivo });
  });

  it("sin lista de sitios permitidos no deja abrir ninguno, aunque sea https", () => {
    expect(validarEnlaceQR("https://centro.es/biblioteca", [])).toEqual({
      valido: false,
      motivo: "sitio",
    });
    expect(validarEnlaceQR("https://centro.es/biblioteca", sitiosPermitidos(""))).toEqual({
      valido: false,
      motivo: "sitio",
    });
  });

  it("con lista de sitios permitidos, solo esos y sus subdominios", () => {
    const permitidos = ["centro.es"];
    expect(validarEnlaceQR("https://centro.es/x", permitidos)).toMatchObject({ valido: true });
    expect(validarEnlaceQR("https://biblioteca.centro.es", permitidos)).toMatchObject({
      valido: true,
      sitio: "biblioteca.centro.es",
    });
    // Ni otros sitios ni los que solo se le parecen
    expect(validarEnlaceQR("https://otro.com", permitidos)).toEqual({
      valido: false,
      motivo: "sitio",
    });
    expect(validarEnlaceQR("https://falsocentro.es", permitidos)).toEqual({
      valido: false,
      motivo: "sitio",
    });
    expect(validarEnlaceQR("https://centro.es.trampa.com", permitidos)).toEqual({
      valido: false,
      motivo: "sitio",
    });
  });

  it("lee la lista de sitios de la configuración", () => {
    expect(sitiosPermitidos(" www.Centro.es, ugr.es ,,")).toEqual(["centro.es", "ugr.es"]);
    expect(sitiosPermitidos(undefined)).toEqual([]);
  });
});

describe("abrirEnlaceExterno", () => {
  const plataforma = Platform.OS;
  afterEach(() => {
    Platform.OS = plataforma;
    jest.restoreAllMocks();
    delete (globalThis as { open?: unknown }).open;
  });

  it("en la web abre otra ventana y le corta el acceso a la app", async () => {
    Platform.OS = "web";
    const ventana: { opener: unknown } = { opener: "la app" };
    const abrir = jest.fn().mockReturnValue(ventana);
    (globalThis as { open?: unknown }).open = abrir;

    await expect(abrirEnlaceExterno("https://centro.es")).resolves.toBe(true);
    expect(abrir).toHaveBeenCalledWith("https://centro.es", "_blank");
    expect(ventana.opener).toBeNull();
  });

  it("en la web, si el navegador bloquea la ventana, lo dice (false)", async () => {
    Platform.OS = "web";
    (globalThis as { open?: unknown }).open = jest.fn().mockReturnValue(null);
    await expect(abrirEnlaceExterno("https://centro.es")).resolves.toBe(false);
  });

  it("en la tableta lo abre con el navegador del sistema", async () => {
    Platform.OS = "android";
    const abrir = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    await expect(abrirEnlaceExterno("https://centro.es")).resolves.toBe(true);
    expect(abrir).toHaveBeenCalledWith("https://centro.es");
  });

  it("si falla, devuelve false en vez de lanzar el error", async () => {
    Platform.OS = "android";
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("sin navegador"));
    await expect(abrirEnlaceExterno("https://centro.es")).resolves.toBe(false);
  });
});
