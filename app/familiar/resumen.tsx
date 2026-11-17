import React from "react";
import { Stack, useRouter } from "expo-router";
import { useSesion } from "../../src/sesion";
import { PanelAdulto } from "../../src/pantalla";

/**
 * Panel principal de la familia: agenda del alumno, apariencia del perfil y pictogramas.
 */
export default function FamiliarResumenScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Familia" }} />
      <PanelAdulto
        titulo="Espacio de la familia"
        saludo={`Hola, ${sesion?.user?.fullName ?? "familia"}`}
        alCerrarSesion={handleLogout}
        accesos={[
          {
            icono: "casa",
            titulo: "Agenda del día",
            descripcion: "Qué está haciendo ahora y qué ha terminado.",
            etiquetaAccesible: "Ver agenda del estudiante",
            alPulsar: () => router.push("/agenda"),
          },
          {
            icono: "paleta",
            titulo: "Apariencia de la agenda",
            descripcion: "Colores, letra y sonidos adaptados al alumno.",
            etiquetaAccesible: "Ajustar preferencias visuales y sensoriales",
            alPulsar: () => router.push("/preferencias"),
          },
          {
            icono: "imagen",
            titulo: "Buscar pictogramas",
            descripcion: "Apoyos visuales para las rutinas de casa.",
            etiquetaAccesible: "Explorar catálogo de pictogramas ARASAAC",
            alPulsar: () => router.push("/demo-pictogramas"),
          },
        ]}
      />
    </>
  );
}
