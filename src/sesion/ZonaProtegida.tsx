// Protección de las zonas privadas (HUT-03, T-T03.1): solo entra quien tiene sesión vigente y un
// rol autorizado para esa ruta, según checkRouteAccess (sessionGuard, SCRUM-57). Se usa en el
// _layout.tsx de cada zona (app/admin, app/docente…), no en toda la app, porque checkRouteAccess
// deniega por defecto las rutas que no conoce (y bloquearía, p. ej., el acceso del alumnado).
import { Redirect, usePathname, type Href } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { checkRouteAccess } from "../servicios/sessionGuard";
import type { Paleta } from "../temas";
import { Texto, useEstilos } from "../ui";
import { useSesion } from "./SesionProvider";

export function ZonaProtegida({ children }: { children: ReactNode }) {
  const { sesion, cargando } = useSesion();
  const ruta = usePathname();
  const estilos = useEstilos(crearEstilos);

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <Texto style={estilos.texto} accessibilityLiveRegion="polite">
          Comprobando…
        </Texto>
      </View>
    );
  }

  const decision = checkRouteAccess(sesion, ruta);
  if (!decision.allowed) {
    return <Redirect href={decision.redirectTo as Href} />;
  }
  return <>{children}</>;
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    centro: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      backgroundColor: c.fondo,
    },
    texto: { fontSize: 20, color: c.texto },
  });
