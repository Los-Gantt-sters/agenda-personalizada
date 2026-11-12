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
| NL-02 | Todo botón lleva pictograma de ARASAAC, icono dibujado o foto, y cada paso su pictograma | Cumple |
| NL-03 | Clases y fotos ≥ 120 dp, dibujos ≥ 96 dp, resto ≥ 44 dp (WCAG 2.5.5 AAA) | Cumple |
| NL-04 | Si la pantalla es estrecha, las fotos bajan de fila en vez de encogerse | Cumple |
| NL-05 | Los 6 toques del recorrido suenan | Cumple |
| NL-06 | Se entra sin escribir y con 6 toques (clase, foto, 3 dibujos y «Entrar») | Cumple |
| NL-07 | Los errores se pueden deshacer y los avisos llevan icono | Cumple |

## No conformidades

- **NC-005 (Menor), resuelta en noviembre de 2026.** «Cambiar de clase», «No soy yo» y «Volver» no sonaban. Con las mejoras de la profesora esos botones pasan a ser «Atrás» en la barra de abajo, que en las pantallas del alumno suena con «toque».

## Cambios de noviembre de 2026 (mejoras de la profesora)

- Ya no hay pantalla de bienvenida: la app empieza en «¿Cuál es tu clase?». Los adultos entran desde ahí.
- La contraseña de 3 dibujos ocupa toda la pantalla y, tras tocar el tercero, hay que pulsar «Entrar» (o «Adelante» en la barra). Por eso el recorrido pasa de 5 a 6 toques: es un toque más, pero el alumno comprueba sus dibujos antes de entrar.
- Todas las pantallas tienen cabecera con su nombre y una barra abajo con «Ayuda», «Atrás», «Adelante» y «Accesibilidad», siempre en el mismo sitio.

## Decisiones del equipo

- Los móviles quedan fuera de alcance: la aplicación es para tabletas y ordenadores.
- Los botones secundarios basta con que midan al menos 44 dp. Los 64 dp se reservan para EMPEZAR y TERMINAR.
- Las pruebas manuales con participantes no se hacen por ahora.
