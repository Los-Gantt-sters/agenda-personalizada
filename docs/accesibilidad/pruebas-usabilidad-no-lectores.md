# Pruebas de usabilidad cognitiva con perfiles no lectores

**Tarea:** SCRUM-53 · T-01.4 [Testing] · Historia SCRUM-49 (HU-01)
**Fecha:** 9 de noviembre de 2026 · **Autor:** Javier Miñán Molina (gestor de calidad)
**Alcance:** el inicio de sesión del alumnado (`app/login-estudiantes.tsx`) de la HU-01, en tableta horizontal y ordenador.

## Qué se ha hecho

Se ha añadido `src/componentes/autenticacion/__tests__/UsabilidadNoLectores.test.tsx`, que simula a un alumno que no sabe leer recorriendo las tres pantallas del inicio de sesión (clase → foto → 3 dibujos) y comprueba que nada imprescindible depende de leer. Se ejecuta en la integración continua, así que si un cambio rompe un criterio, la pull request falla.

```bash
npm test -- UsabilidadNoLectores
```

## Criterios y resultado

**14 de 14 pruebas pasan.**

| Código | Criterio | Resultado |
|---|---|---|
| NL-01 | Todo botón tiene rol y etiqueta accesible (lo anuncia la ayuda de voz) | Cumple |
| NL-02 | Todo botón lleva símbolo, emoji o foto, y cada paso su pictograma | Cumple |
| NL-03 | Clases y fotos ≥ 120 dp, dibujos ≥ 96 dp, resto ≥ 44 dp (WCAG 2.5.5 AAA) | Cumple |
| NL-04 | Si la pantalla es estrecha, las fotos bajan de fila en vez de encogerse | Cumple |
| NL-05 | Los 5 toques del recorrido suenan | Cumple |
| NL-06 | Se entra sin escribir y con 5 toques | Cumple |
| NL-07 | Los errores se pueden deshacer y los avisos llevan icono | Cumple |

## No conformidades

- **NC-005 (Menor).** «Cambiar de clase», «No soy yo» y «Volver» no suenan, y el resto del recorrido sí. **Acción propuesta:** añadirles el sonido «toque».

## Decisiones del equipo

- Los móviles quedan fuera de alcance: la aplicación es para tabletas y ordenadores.
- Los botones secundarios basta con que midan al menos 44 dp. Los 64 dp se reservan para EMPEZAR y TERMINAR.
- Las pruebas manuales con participantes no se hacen por ahora.
