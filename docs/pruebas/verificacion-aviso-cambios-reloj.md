# Verificación de disparo puntual del aviso con cambios de reloj

**Tarea:** SCRUM-84 · T-16.3 [Testing] · Historia SCRUM-81 (HU-16)
**Fecha:** 9 de noviembre de 2026 · **Autor:** Javier Miñán Molina (gestor de calidad)
**Alcance:** el aviso de «faltan 5 minutos» de la HU-16: el temporizador `useAvisoAnticipado` y su lógica (SCRUM-82), que usa la ventana emergente (SCRUM-83).

## Qué se ha hecho

Se ha añadido `src/componentes/aviso-anticipado/__tests__/cambiosReloj.test.tsx`, que comprueba que el aviso sale a su hora aunque el reloj del dispositivo cambie mientras la agenda está abierta. Se ejecuta en la integración continua.

```bash
npm test -- cambiosReloj
```

Además, se ha fijado la zona horaria de todas las pruebas en `Europe/Madrid` (`jest.global-setup.js`). Sin esto, las pruebas con fechas daban resultados distintos en un portátil en España y en GitHub Actions, que funciona en UTC.

## Criterios y resultado

**14 de 14 pruebas pasan**, con el ordenador en cualquier zona horaria (probado con Madrid, UTC, Nueva York y Tokio).

| Código | Criterio | Resultado |
|---|---|---|
| CR-01 | Puntualidad: el aviso sale en el segundo exacto (10:40:00 para una tarea a las 10:45), aunque la app se abra con segundos sueltos y en una agenda de 6 tareas | Cumple |
| CR-02 | Reloj adelantado: si salta dentro de los 5 minutos previos, avisa en menos de un minuto; si salta más allá del inicio, no avisa de esa tarea y pasa a la siguiente | Cumple |
| CR-03 | Reloj atrasado: no avisa antes de tiempo ni repite un aviso ya dado | Cumple |
| CR-04 | Cambio de hora oficial (29/03 y 25/10): avisa a las 08:55 de la hora nueva y la antelación son 5 minutos reales | Cumple |
| CR-05 | Temporizadores retrasados (pestaña en segundo plano): al volver a la app avisa al momento; si los temporizadores llegan tarde, como mucho tarda un minuto | Cumple |
| CR-06 | Cambio de día: una tarea de mañana no se avisa hoy, y con la app abierta toda la noche se avisa a su hora | Cumple |

Para comprobar que las pruebas detectan fallos de verdad, se introdujeron a propósito 6 errores en el temporizador (revisar cada 15 minutos en vez de cada minuto, no escuchar la vuelta a la app, no recordar los avisos dados, calcular la hora en UTC, avisar de tareas ya empezadas y no mirar la fecha). Las pruebas los detectaron todos.

## No conformidades

Ninguna.
