// Estado global de la sesión (HUT-03, T-T03.1): quién ha entrado y con qué rol, para toda la app.
// Se actualiza solo al iniciar o cerrar sesión (supervisores y alumnado), escuchando a Supabase Auth.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "../lib/supabaseClient";
import { getCurrentSession, signOutSupervisor } from "../servicios/authService";
import type { AuthSession } from "../tipos/auth";

interface ValorSesion {
  /** Sesión activa, o null si nadie ha entrado. */
  sesion: AuthSession | null;
  /** true mientras se comprueba si hay sesión al arrancar. */
  cargando: boolean;
  cerrarSesion: () => Promise<void>;
}

const SesionContext = createContext<ValorSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<AuthSession | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let montado = true;
    // getCurrentSession además renueva el token si ha caducado (o devuelve null si no puede)
    const actualizar = () =>
      getCurrentSession().then((actual) => {
        if (!montado) return;
        setSesion(actual);
        setCargando(false);
      });

    void actualizar();
    // Supabase recomienda no llamar a sus funciones dentro de este aviso: se hace justo después
    const { data } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void actualizar(), 0);
    });

    return () => {
      montado = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function cerrarSesion() {
    await signOutSupervisor();
    setSesion(null);
  }

  return (
    <SesionContext.Provider value={{ sesion, cargando, cerrarSesion }}>
      {children}
    </SesionContext.Provider>
  );
}

/** Sesión activa. Debe usarse dentro de <SesionProvider> (está en app/_layout.tsx). */
export function useSesion(): ValorSesion {
  const valor = useContext(SesionContext);
  if (!valor) {
    throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  }
  return valor;
}

/** Igual que useSesion, pero devuelve null fuera de <SesionProvider> (pruebas, componentes sueltos). */
export function useSesionOpcional(): ValorSesion | null {
  return useContext(SesionContext);
}
