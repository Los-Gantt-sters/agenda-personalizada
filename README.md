# Agensible

Aplicación web de agenda personalizada y accesible para estudiantes con discapacidad intelectual, desarrollada para el Colegio de Educación Especial Fundación Purísima Concepción de Granada. Está pensada para usarse principalmente en tablets en formato horizontal.

## Contexto del proyecto

Este proyecto se desarrolla en las prácticas de las asignaturas **Dirección y Gestión de Proyectos (DGP)** y **Metodologías de Desarrollo Ágil (MDA)** del Grado en Ingeniería Informática de la Universidad de Granada, durante el curso 2026-2027.

Forma parte del proyecto de innovación docente *26-175. Aprendizaje-servicio y Software Accesible para la Autonomía y la Transición a la Vida Adulta en Estudiantes NEAE (AUTOVIDA)*, en el que se trabaja con y para un cliente real: la dirección del colegio.

## Objetivo

Facilitar la organización y estructuración del tiempo de los estudiantes del Programa de Transición a la Vida Adulta (PTVAL) mediante una agenda que permita:

- Personalizar la lista de tareas y avisar del tiempo.
- Asignar tareas del centro (reprografía, comedor, menú mensual y guía de visitas) y crear tareas personales con imagen, horario y descripción en un formato accesible.
- Adaptar la interfaz a cada estudiante mediante perfiles (colores, tipografía, pictogramas de ARASAAC).
- Distinguir tres tipos de usuario: administrador, tutor y estudiante.

La aplicación debe cumplir la normativa de accesibilidad y la ley de protección de datos.

## Equipo: Los Gantt-sters

Grupo de 6 personas con el siguiente reparto inicial de roles:

| Miembro | Rol |
|---|---|
| Juan Luis Jiménez Urbano | Coordinador |
| Germán Delgado Fernández | Catalogador |
| Jaime Montávez Ruiz | Moderador |
| Ana Meca Cano | Presentador |
| Javier Miñán Molina | Gestor de calidad |
| Álvaro Sanabria Díaz | Gestor de usabilidad y accesibilidad |

Los roles pueden rotar entre iteraciones, salvo el de gestor de calidad y el de gestor de usabilidad y accesibilidad.

## Metodología

El proyecto sigue un desarrollo iterativo en tres iteraciones, con gestión ágil del proyecto (Scrum), historias de usuario, prototipado y evaluación con usuarios siguiendo un diseño centrado en el usuario. Los sprints, el Product Backlog y las tareas se gestionan en Jira.

## Tecnologías

| Ámbito | Herramienta |
|---|---|
| Aplicación | Aplicación web (webapp), con prioridad para tablets en formato horizontal |
| Front-end | Native |
| Backend y base de datos | Supabase (base de datos PostgreSQL, autenticación, almacenamiento y tiempo real) |
| Despliegue | Vercel |
| Control de versiones | Git y GitHub, con `master` como rama del trabajo definitivo y una rama paralela por tarea |
| Calidad de código | ESLint y Prettier |
| Integración continua | GitHub Actions: compila, ejecuta las pruebas y comprueba ESLint y Prettier en cada pull request |
| Editor | Visual Studio Code |
| Pictogramas | ARASAAC |
| Gestión del proyecto | Jira (Scrum) |
| Documentación | LaTeX (Overleaf) y Google Drive |
| Comunicación | WhatsApp, videollamadas y reuniones periódicas |

La aplicación debe funcionar en Chrome, Edge, Firefox y Safari, y cumplir WCAG 2.1 nivel AA.

## Estructura del repositorio

El repositorio está en fase inicial. Esta es la estructura prevista y se actualizará a medida que se añadan carpetas:

```
.
├── .github/workflows/   # Flujo de integración continua (compilación, pruebas, ESLint y Prettier)
├── .vscode/             # Ajustes y extensiones recomendadas de Visual Studio Code
├── docs/                # Documentación en PDF (dgp/, mda/) y prototipo HTML; índice en docs/README.md
├── app/                 # Pantallas (Expo Router: cada archivo es una ruta)
│   └── __tests__/       # Pruebas de las pantallas
├── assets/              # Iconos, imágenes y sonidos
├── src/                 # Código de la aplicación
│   ├── componentes/     # Componentes reutilizables, cada uno con su carpeta __tests__/
│   └── servicios/        # Capa de acceso a Supabase (back-end), con su carpeta __tests__/
└── README.md
```

### Dónde van las pruebas

Cada prueba va en una carpeta `__tests__/` **junto al código que prueba**:

| Qué se prueba | Dónde | Ejemplo |
|---|---|---|
| Una pantalla (integración de varios componentes) | `app/__tests__/` | `app/__tests__/login.test.tsx` |
| Un componente y su lógica (unitarias) | `src/componentes/<componente>/__tests__/` | `src/componentes/reloj-visual/__tests__/RelojVisual.test.tsx` |
| Un servicio del back-end (acceso a Supabase) | `src/servicios/__tests__/` | `src/servicios/__tests__/authService.test.ts` |

Así nunca hay dudas de dónde va una prueba, los `import` son cortos (`../RelojVisual`) y la capa de back-end queda separada como pide el Plan de calidad (RNF16.6). Jest encuentra cualquier `*.test.ts(x)` dentro de una carpeta `__tests__`; se ejecutan todas con `npm test`.

## Documentación

| Recurso | Dónde |
|---|---|
| Tablero y Product Backlog en Jira | [Backlog](https://gantt-sters.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog) y [tablero de trabajo](https://gantt-sters.atlassian.net/jira/software/projects/SCRUM/boards/1) |
| Documentación compartida del equipo | [Carpeta DGP-MDA en Google Drive](https://drive.google.com/drive/folders/1pVqvauxM2EXDeXHBzrr1V0hjfa7VoFjG) (acceso restringido al equipo y al profesorado) |
| Propuestas, manual de coordinación, plan de calidad, accesibilidad, prácticas y planificación (PDF) | [`docs/`](docs/README.md) |
| Fuentes LaTeX, actas de reunión y hojas de cálculo | Carpeta DGP-MDA de Drive |

## Licencia

Pendiente de definir, tras consultarlo con el profesorado.
