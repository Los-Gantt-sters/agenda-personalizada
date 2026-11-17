// Pictogramas de ARASAAC que usa la propia interfaz del alumno (no las tareas): estados vacíos,
// refuerzo, pasos del inicio de sesión, ayuda... Sustituyen a los emojis que había antes (RNF4.4:
// el texto siempre va con dibujo). Si la imagen no carga (sin conexión), se ve el emoji de respaldo.
import { PictogramaTarea } from "../componentes/agenda/PictogramaTarea";
import { urlImagenPictograma } from "../arasaac/urls";

export const PICTOGRAMAS_INTERFAZ = {
  colegio: { id: 3082, respaldo: "🏫" },
  tocar: { id: 3293, respaldo: "👆" },
  contrasena: { id: 27691, respaldo: "🔑" },
  esperar: { id: 36914, respaldo: "⏳" },
  terminar: { id: 5358, respaldo: "🏁" },
  celebrar: { id: 16649, respaldo: "🎉" },
  muyBien: { id: 11599, respaldo: "⭐" },
  ayuda: { id: 12252, respaldo: "✋" },
  escuchar: { id: 2381, respaldo: "🔊" },
  mochila: { id: 2475, respaldo: "🎒" },
  profesora: { id: 2456, respaldo: "👩‍🏫" },
  agenda: { id: 5898, respaldo: "📒" },
  // Emociones (misma serie de caras redondas de ARASAAC): «¿Cómo te has sentido?»
  contento: { id: 35547, respaldo: "😀" },
  tranquilo: { id: 31310, respaldo: "😌" },
  cansado: { id: 35537, respaldo: "😩" },
  triste: { id: 35545, respaldo: "😢" },
  enfadado: { id: 35539, respaldo: "😠" },
} as const;

export type NombrePictogramaInterfaz = keyof typeof PICTOGRAMAS_INTERFAZ;

export interface PictogramaInterfazProps {
  nombre: NombrePictogramaInterfaz;
  /** Texto alternativo: qué representa el dibujo en esta pantalla. */
  etiqueta: string;
  tam: number;
}

export function PictogramaInterfaz({ nombre, etiqueta, tam }: PictogramaInterfazProps) {
  const { id, respaldo } = PICTOGRAMAS_INTERFAZ[nombre];
  return (
    <PictogramaTarea
      tarea={{
        titulo: etiqueta,
        emoji: respaldo,
        pictograma_url: urlImagenPictograma(id, tam > 160 ? 500 : 300),
      }}
      tam={tam}
    />
  );
}
