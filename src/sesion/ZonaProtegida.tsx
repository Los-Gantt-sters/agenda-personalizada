// Protección de las zonas privadas (HUT-03, T-T03.1): solo entra quien tiene sesión vigente y un
// rol autorizado para esa ruta, según checkRouteAccess (sessionGuard, SCRUM-57). Se usa en el
// _layout.tsx de cada zona (app/admin, app/docente…), no en toda la app, porque checkRouteAccess
// deniega por defecto las rutas que no conoce (y bloquearía, p. ej., el acceso del alumnado).
import { Redirect, usePathname, type Href } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { checkRouteAccess } from "../servicios/sessionGuard";
import { useSesion } from "./SesionProvider";

export function ZonaProtegida({ children }: { children: ReactNode }) {
  const { sesion, cargando } = useSesion();
  const ruta = usePathname();

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.texto} accessibilityLiveRegion="polite">
          Comprobando…
        </Text>
      </View>
    );
  }

  const decision = checkRouteAccess(sesion, ruta);
  if (!decision.allowed) {
    return <Redirect href={decision.redirectTo as Href} />;
  }
  return <>{children}</>;
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  // 15,97:1 sobre blanco
  texto: { fontSize: 20, color: "#14213d" },
});
