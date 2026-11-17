import React from "react";
import { Stack, useRouter } from "expo-router";
import { useSesion } from "../../src/sesion";
import { PanelAdulto } from "../../src/pantalla";

/**
 * Panel principal del tutor docente: agenda del alumno, prueba del aviso de 5 minutos,
 * apariencia del perfil, buscador de pictogramas y reloj visual.
 */
export default function DocenteAgendaScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Tutor" }} />
      <PanelAdulto
        titulo="Panel del tutor"
        saludo={`Hola, ${sesion?.user?.fullName ?? "tutor"}`}
        alCerrarSesion={handleLogout}
        etiquetaCerrarSesion="Cerrar sesión y volver al inicio"
        accesos={[
          {
            icono: "calendario",
            titulo: "Agenda del día",
            descripcion: "La misma agenda que ve el alumno: hecho, ahora y después.",
            etiquetaAccesible: "Abrir agenda estructurada del estudiante",
            alPulsar: () => router.push("/agenda"),
          },
          {
            icono: "campana",
            titulo: "Probar el aviso de 5 minutos",
            descripcion: "El aviso de cambio de tarea sale en unos segundos.",
            etiquetaAccesible: "Probar notificación anticipatoria de cambio de actividad",
            alPulsar: () => router.push("/agenda?aviso=prueba"),
          },
          {
            icono: "paleta",
            titulo: "Apariencia del alumno",
            descripcion: "Colores, letra, tamaño de los botones y alto contraste.",
            etiquetaAccesible: "Configurar preferencias sensoriales y temas visuales",
            alPulsar: () => router.push("/preferencias"),
          },
          {
            icono: "imagen",
            titulo: "Buscar pictogramas",
            descripcion: "Pictogramas de ARASAAC para las tareas.",
            etiquetaAccesible: "Abrir buscador de pictogramas ARASAAC",
            alPulsar: () => router.push("/demo-pictogramas"),
          },
          {
            icono: "cronometro",
            titulo: "Reloj visual",
            descripcion: "El tiempo que queda, como un disco que se va vaciando.",
            etiquetaAccesible: "Abrir demostración de reloj visual Time Timer",
            alPulsar: () => router.push("/demo-reloj"),
          },
        ]}
      />
    </>
  );
}
