import { Stack } from "expo-router";
import { ProveedorNecesidades } from "../src/necesidades";
import { PreferenciasProvider, useFuentesPreferencias } from "../src/preferencias";
import { SesionProvider } from "../src/sesion";
import { TemaProvider } from "../src/temas";

export default function RootLayout() {
  // Las fuentes de Lectura Fácil se cargan al arrancar; si tardan, se ve la fuente del sistema
  useFuentesPreferencias();

  return (
    <TemaProvider>
      <PreferenciasProvider>
        <SesionProvider>
          {/* El botón «Ayuda» ya no flota: va en la barra inferior de cada pantalla (src/pantalla). */}
          <ProveedorNecesidades inicialmenteVisible={false}>
            {/*
              Sin la barra de navegación del sistema: cada pantalla pinta su cabecera y su barra
              inferior (Ayuda, Atrás, Adelante y Accesibilidad) con el componente Pantalla.
              La pestaña del navegador la nombra Pantalla con el título de cada pantalla; estos
              títulos quedan como nombre de cada ruta para la navegación.
            */}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ title: "Agensible" }} />
              <Stack.Screen name="login-estudiantes" options={{ title: "Entrar" }} />
              <Stack.Screen name="login" options={{ title: "Acceso para adultos" }} />
              <Stack.Screen name="agenda" options={{ title: "Mi agenda" }} />
              <Stack.Screen name="preferencias" options={{ title: "Preferencias" }} />
              <Stack.Screen name="demo-pictogramas" options={{ title: "Pictogramas" }} />
              <Stack.Screen name="demo-reloj" options={{ title: "Reloj visual" }} />
              {/* Paneles de los adultos: sin título se vería el nombre de la ruta en la pestaña. */}
              <Stack.Screen name="docente/agenda" options={{ title: "Panel del tutor" }} />
              <Stack.Screen name="familiar/resumen" options={{ title: "Espacio de la familia" }} />
              <Stack.Screen name="especialista/terapias" options={{ title: "Panel del tutor" }} />
              <Stack.Screen name="admin" options={{ title: "Tutores y familias" }} />
            </Stack>
          </ProveedorNecesidades>
        </SesionProvider>
      </PreferenciasProvider>
    </TemaProvider>
  );
}
