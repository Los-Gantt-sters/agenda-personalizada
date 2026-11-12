// Pantalla de preferencias de apariencia (T-04.3) en /preferencias. Se abre desde el panel del tutor
// y desde el de la familia. Primero un menú; cada apartado se cambia en su propia pantalla, sin
// scroll (mejoras de la profesora, noviembre de 2026).
import { PanelPreferencias } from "../src/preferencias";

export default function PreferenciasScreen() {
  return <PanelPreferencias />;
}
