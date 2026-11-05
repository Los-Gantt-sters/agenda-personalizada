import {
  emitirAlertaNecesidad,
  suscribirAlertasTutor,
  marcarAlertaAtendida,
  getTextoNecesidad,
} from "../realtimeAlertService";
import { supabase } from "../../lib/supabaseClient";
import { reproducirSonido } from "../../servicios/sonidos";
import { AlertaNecesidad } from "../../types/necesidades";

jest.mock("../../lib/supabaseClient", () => {
  const mockSend = jest.fn().mockResolvedValue("ok");
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn().mockReturnThis();
  const mockChannel = {
    send: mockSend,
    on: mockOn,
    subscribe: mockSubscribe,
  };

  return {
    supabase: {
      channel: jest.fn(() => mockChannel),
    },
  };
});

jest.mock("../../servicios/sonidos", () => ({
  reproducirSonido: jest.fn(),
}));

describe("realtimeAlertService - SCRUM-88 (Supabase Realtime Alertas)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTextoNecesidad", () => {
    it("retorna las etiquetas textuales accesibles correctas", () => {
      expect(getTextoNecesidad("bano")).toBe("Quiero ir al baño");
      expect(getTextoNecesidad("agua")).toBe("Quiero agua");
      expect(getTextoNecesidad("descanso")).toBe("Necesito descanso");
    });
  });

  describe("emitirAlertaNecesidad", () => {
    it("emite una alerta en broadcast por el canal Realtime con payload completo", async () => {
      const payload = {
        estudianteId: "est-1",
        estudianteNombre: "Carlos",
        tutorId: "tutor-docente-1",
        tipo: "bano" as const,
        aula: "Aula 3 - Transición",
      };

      const result = await emitirAlertaNecesidad(payload);

      expect(result.success).toBe(true);
      expect(result.alerta).toBeDefined();
      expect(result.alerta?.tipo).toBe("bano");
      expect(result.alerta?.estudianteNombre).toBe("Carlos");
      expect(result.alerta?.estado).toBe("pendiente");

      const channel = supabase.channel("necesidades_fisiologicas_channel");
      expect(channel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "nueva_alerta_necesidad",
        payload: expect.objectContaining({
          estudianteNombre: "Carlos",
          tipo: "bano",
        }),
      });
    });

    it("captura errores si falla el canal de Supabase", async () => {
      const channel = supabase.channel("necesidades_fisiologicas_channel");
      (channel.send as jest.Mock).mockRejectedValueOnce(new Error("Error de conexión WebSocket"));

      const result = await emitirAlertaNecesidad({
        estudianteId: "est-1",
        estudianteNombre: "Carlos",
        tutorId: "tutor-1",
        tipo: "agua",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Error de conexión");
    });
  });

  describe("suscribirAlertasTutor", () => {
    it("suscribe el callback del tutor y reproduce aviso sonoro ante nueva alerta", () => {
      const onNuevaAlerta = jest.fn();
      const channel = supabase.channel("necesidades_fisiologicas_channel");

      // Extraer el handler registrado en channel.on
      let nuevaAlertaHandler: (data: { payload: AlertaNecesidad }) => void = () => {};
      (channel.on as jest.Mock).mockImplementation(
        (type: string, filter: { event: string }, handler: any) => {
          if (filter.event === "nueva_alerta_necesidad") {
            nuevaAlertaHandler = handler;
          }
          return channel;
        },
      );

      suscribirAlertasTutor({
        tutorId: "tutor-1",
        onNuevaAlerta,
        reproducirAudio: true,
      });

      expect(channel.subscribe).toHaveBeenCalled();

      // Simular recepción de mensaje Realtime
      const alertaRecibida: AlertaNecesidad = {
        id: "alerta-100",
        estudianteId: "est-2",
        estudianteNombre: "Lucía",
        tutorId: "tutor-1",
        tipo: "descanso",
        estado: "pendiente",
        creadoEn: new Date().toISOString(),
      };

      nuevaAlertaHandler({ payload: alertaRecibida });

      expect(onNuevaAlerta).toHaveBeenCalledWith(alertaRecibida);
      expect(reproducirSonido).toHaveBeenCalledWith("finTiempo", 0.8);
    });

    it("ignora alertas destinadas a otro tutor", () => {
      const onNuevaAlerta = jest.fn();
      const channel = supabase.channel("necesidades_fisiologicas_channel");

      let nuevaAlertaHandler: (data: { payload: AlertaNecesidad }) => void = () => {};
      (channel.on as jest.Mock).mockImplementation(
        (type: string, filter: { event: string }, handler: any) => {
          if (filter.event === "nueva_alerta_necesidad") {
            nuevaAlertaHandler = handler;
          }
          return channel;
        },
      );

      suscribirAlertasTutor({
        tutorId: "tutor-1",
        onNuevaAlerta,
      });

      nuevaAlertaHandler({
        payload: {
          id: "alerta-200",
          estudianteId: "est-3",
          estudianteNombre: "Marcos",
          tutorId: "tutor-DISTINTO",
          tipo: "agua",
          estado: "pendiente",
          creadoEn: new Date().toISOString(),
        },
      });

      expect(onNuevaAlerta).not.toHaveBeenCalled();
      expect(reproducirSonido).not.toHaveBeenCalled();
    });
  });

  describe("marcarAlertaAtendida", () => {
    it("envía evento de alerta atendida por broadcast", async () => {
      const channel = supabase.channel("necesidades_fisiologicas_channel");

      const result = await marcarAlertaAtendida("alerta-123");

      expect(result.success).toBe(true);
      expect(channel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "alerta_necesidad_atendida",
        payload: expect.objectContaining({
          alertaId: "alerta-123",
        }),
      });
    });
  });
});
