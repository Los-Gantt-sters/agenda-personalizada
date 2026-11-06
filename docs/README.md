# Documentación del proyecto

Versiones finales en PDF de los documentos de **TuAgendita**: una agenda visual y accesible para el alumnado del PTVAL del Colegio de Educación Especial Fundación Purísima Concepción (Granada). Los fuentes LaTeX, las actas, las hojas de cálculo y los recursos de trabajo siguen en la [carpeta DGP-MDA de Drive](https://drive.google.com/drive/folders/1pVqvauxM2EXDeXHBzrr1V0hjfa7VoFjG).

## Por dónde empezar

| Quiero saber... | Documento |
|---|---|
| Qué es el producto, para quién es y su alcance | [`dgp/propuesta-solucion.pdf`](dgp/propuesta-solucion.pdf) |
| Requisitos (RF, RNF, RI), arquitectura y tecnologías | [`dgp/propuesta-tecnica.pdf`](dgp/propuesta-tecnica.pdf) |
| Reglas de accesibilidad que tiene que cumplir cada pantalla | [`dgp/informe-accesibilidad.pdf`](dgp/informe-accesibilidad.pdf) |
| Historias de usuario, prioridades y estimaciones | [`mda/practica-2.pdf`](mda/practica-2.pdf) |
| Qué toca en cada sprint | [`cronograma.pdf`](cronograma.pdf) y [`mda/planificacion-estimada.pdf`](mda/planificacion-estimada.pdf) |
| Cómo es cada pantalla | [`prototipo/`](prototipo/) |

## Contenido

### General

- [`cronograma.pdf`](cronograma.pdf): fase inicial y tres sprints (v0.1, v0.2 y v1.0), con los hitos y entregables de cada iteración.

### DGP (Dirección y Gestión de Proyectos)

- [`propuesta-solucion.pdf`](dgp/propuesta-solucion.pdf): visión del producto, destinatarios, objetivos (OE1–OE16), alcance e hitos.
- [`propuesta-tecnica.pdf`](dgp/propuesta-tecnica.pdf): catálogo completo de requisitos funcionales, no funcionales y de información, arquitectura (front-end con React Native, Supabase y Vercel), pictogramas de ARASAAC y normativa (WCAG 2.1 AA, EN 301 549, RGPD, LOPDGDD).
- [`manual-coordinacion.pdf`](dgp/manual-coordinacion.pdf): metodología, herramientas, comunicación y forma de trabajar del equipo.
- [`plan-calidad.pdf`](dgp/plan-calidad.pdf): estándares, revisiones, criterios de entrega y métricas de calidad.
- [`informe-accesibilidad.pdf`](dgp/informe-accesibilidad.pdf): checklist de accesibilidad por sprint (lectura fácil, tamaños mínimos de los elementos táctiles, contraste, uso con pulsador...).

### Accesibilidad

- [`auditoria-contraste-wcag.md`](accesibilidad/auditoria-contraste-wcag.md): auditoría de contraste WCAG 2.1 AA/AAA de los temas de color y de los componentes (SCRUM-67), con las no conformidades encontradas.

### MDA (Metodologías de Desarrollo Ágil)

- [`practica-0.pdf`](mda/practica-0.pdf): descripción del problema y roles del equipo.
- [`practica-1.pdf`](mda/practica-1.pdf): personas de usuario, escenarios y visión del producto.
- [`practica-2.pdf`](mda/practica-2.pdf): Product Backlog, épicas, priorización MoSCoW, Planning Poker y velocidad del equipo.
- [`planificacion-estimada.pdf`](mda/planificacion-estimada.pdf): planificación semana a semana de los tres sprints, organizada en el tablero de Jira.
- [`planificacion-real.pdf`](mda/planificacion-real.pdf): seguimiento real de hitos, horas y riesgos.

### Prototipo

- [`prototipo/`](prototipo/): pantallas HTML del prototipo, numeradas por flujo (estudiante, tutora, familia, administración, cocina).
