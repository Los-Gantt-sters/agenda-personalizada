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
              El título solo da nombre a la pestaña del navegador.
            */}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ title: "Agensible" }} />
              <Stack.Screen name="login-estudiantes" options={{ title: "Entrar" }} />
              <Stack.Screen name="login" options={{ title: "Acceso para adultos" }} />
              <Stack.Screen name="agenda" options={{ title: "Mi agenda" }} />
              <Stack.Screen name="preferencias" options={{ title: "Preferencias" }} />
              <Stack.Screen name="demo-pictogramas" options={{ title: "Pictogramas" }} />
              <Stack.Screen name="demo-reloj" options={{ title: "Reloj visual" }} />
            </Stack>
          </ProveedorNecesidades>
        </SesionProvider>
      </PreferenciasProvider>
    </TemaProvider>
  );
}
