# Estándar Técnico y Stack Oficial de Desarrollo
**Proyecto:** *Agensible* (TuAgendita)  
**Equipo:** Subgrupo 2 — *Los Gantt-sters* (DGP & MDA · UGR)  
**Cliente:** CEE Fundación Purísima Concepción de Granada  
**Fecha de Aprobación:** Noviembre 2026  

---

## 1. Justificación y Decisión del Stack (Vite vs. Expo)

Durante los primeros picos de trabajo convivieron referencias a **Vite** y a **Expo**. Para evitar discrepancias, conflictos de dependencias y asegurar que la integración continua (CI) se mantenga en verde para todos, se fija la siguiente **decisión técnica unánime**:

> **Decisión Oficial:** **Adoptar exclusivamente EXPO + REACT NATIVE WEB (`expo-router`).**  
> Descartamos el uso de Vite en el proyecto.

### ¿Por qué Expo + React Native Web es lo más adecuado para el cliente?
1. **Dispositivo objetivo prioritario:** El colegio utilizará la aplicación **en tablets en formato horizontal**. Expo y React Native están optimizados de forma nativa para interacción táctil (evitar zoom accidental, soporte de botones grandes y accesibilidad).
2. **Multimedia integrada:** Incluye soporte directo para audio (`expo-audio`) y gráficos vectoriales (`react-native-svg`), esenciales para el reloj visual *Time Timer*, sonidos de refuerzo y pictogramas.
3. **Despliegue dual:** Se compila como **Web estática para Vercel** (`npx expo export -p web`) y, si en la fase final de pruebas el colegio necesita instalar la app directamente en las tablets Android sin conexión, Expo permite generar el APK sin reescribir una sola línea de código.
4. **Infraestructura ya validada:** La rama `main` y los workflows de GitHub Actions ya están 100% configurados y pasando en verde con este stack.

---

## 2. Tabla Maestra de Tecnologías

| Ámbito | Tecnología Oficial | Versión / Detalle |
| :--- | :--- | :--- |
| **Entorno de ejecución** | **Node.js** | **v22 LTS** (definido en `.nvmrc` y en GitHub Actions) |
| **Gestor de paquetes** | **npm** | Usar siempre `package-lock.json` |
| **Lenguaje** | **TypeScript** | Modo estricto (`strict: true`) |
| **Framework Frontend** | **Expo + React Native Web** | `expo ~58.0`, `react-native 0.88`, `react-native-web ^0.21` |
| **Enrutamiento** | **Expo Router** | Enrutador basado en la carpeta `/app` |
| **Estilos** | **StyleSheet de React Native** | Alto contraste y diseño adaptado a orientación horizontal |
| **Backend & Base de Datos** | **Supabase (BaaS)** | PostgreSQL con RLS, Supabase Auth (JWT) y Storage |
| **Recurso de Pictogramas** | **API ARASAAC** | Catálogo oficial de comunicación aumentativa |
| **Testing** | **Jest + `jest-expo` + Testing Library** | `@testing-library/react-native` con `userEvent` |
| **Linter y Accesibilidad** | **ESLint 9** | Con `eslint-plugin-jsx-a11y` (WCAG 2.1 AA estricto) |
| **Formateador** | **Prettier** | Formateo automático de código |
| **CI / CD** | **GitHub Actions** | Workflows: `build-and-test.yml` y `ci.yml` |
| **Hosting Web** | **Vercel** | Despliegue continuo desde `main` |

---

## 3. Convención de Variables de Entorno (`.env`)

Para evitar errores en tiempo de compilación con Expo, **todas las variables públicas del cliente deben usar el prefijo `EXPO_PUBLIC_`**:

```env
# Configuración Supabase (BaaS)
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto-purisima.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Entorno y Recursos
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_ARASAAC_API_URL=https://api.arasaac.org/api/pictograms
```

*(El cliente `src/lib/supabaseClient.ts` ya está adaptado para leer tanto `EXPO_PUBLIC_*` como las antiguas `VITE_*` por retrocompatibilidad).*

---

## 4. Flujo de Trabajo Git $\leftrightarrow$ Jira (Obligatorio)

Para mantener la trazabilidad académica exigida en DGP y MDA:

1. **Ramas de Historia de Usuario (Padre):**
   * Nacen siempre de `main`.
   * Formato: `SCRUM-XX-nombre-historia` (ej. `SCRUM-54-hu-02-inicio-de-sesion-supervisores`).
2. **Subramas de Tareas Técnicas:**
   * Nacen de la **rama padre** de la historia, **no de `main`**.
   * Formato: `SCRUM-YY-t-xx-nombre-tarea` (ej. `SCRUM-55-t-02-1-frontend-login`).
3. **Commits y Pull Requests:**
   * Todo commit debe comenzar con la clave de Jira: `SCRUM-YY: Descripción clara...`.
   * El Pull Request de la subtarea se abre y fusiona hacia la rama padre de la historia.
   * Una vez completadas las subtareas y el QA, se abre el Pull Request de la historia padre hacia `main`.

---

## 5. Comandos de Comprobación antes de cada Commit

Antes de hacer `git push` o abrir un PR, **es obligatorio que estos 4 comandos pasen en verde en local**, ya que son exactamente los mismos que ejecuta GitHub Actions:

```bash
# 1. Tests unitarios y de integración
npm test -- --ci

# 2. Chequeo de tipos estricto de TypeScript
npx tsc --noEmit

# 3. Reglas de calidad y accesibilidad ESLint
npm run lint

# 4. Formateo de código Prettier
npm run format:check
```

*(Si `npm run format:check` da aviso, ejecutar `npm run format` para corregirlo automáticamente).*
