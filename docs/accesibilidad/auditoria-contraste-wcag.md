# Auditoría de contraste cromático WCAG 2.1 AA/AAA

**Tarea:** SCRUM-67 · T-04.4 [Accesibilidad] · Historia SCRUM-63 (HU-04)
**Fecha:** 6 de noviembre de 2026 · **Autor:** Javier Miñán Molina (gestor de calidad)
**Alcance:** lo que entrega la HU-04 en la rama `SCRUM-63-hu-04-…`: los temas de color (SCRUM-64), el componente `Pictograma` de ARASAAC (SCRUM-65) y el panel de preferencias (SCRUM-66). Los componentes de otras historias se auditan en su propia historia.

## Criterios

| Elemento | Mínimo | Criterio WCAG 2.1 | Requisito |
|---|---|---|---|
| Texto (temas claro, oscuro y pastel) | 4,5:1 | 1.4.3 Contraste mínimo (AA) | RNF3.2, RNF14.1 |
| Texto (temas de alto contraste) | 7:1 | 1.4.6 Contraste mejorado (AAA) | RNF3.2 |
| Componentes de interfaz y gráficos | 3:1 | 1.4.11 Contraste no textual (AA) | RNF14.2 |

El contraste se calcula con la fórmula de luminancia relativa de WCAG 2.1 (`src/temas/contraste.ts`). Todos los textos se comprueban como texto normal, que es el caso más exigente, aunque algunos sean texto grande. Un componente se considera bien delimitado si su borde contrasta con su relleno o si su relleno contrasta con lo que lo rodea.

## Método

1. Se recorrieron las pantallas y componentes de la HU-04, apuntando cada combinación de color de texto y de fondo y cada borde que identifica un componente. `Pictograma` todavía solo aparece en la demo, pero usa colores fijos, así que se mide contra el fondo, las tarjetas y la superficie destacada de cada tema, que es donde irá en las pantallas reales.
2. Cada combinación está declarada en `COMBINACIONES_DE_USO` (`src/temas/auditoriaContraste.ts`), con el componente donde se usa.
3. `src/temas/auditoriaContraste.test.ts` comprueba cada combinación en los cinco temas dentro del flujo de integración continua. Si alguien cambia un color de la paleta y deja de llegar al mínimo, la pull request falla.
4. El único color fijo que queda (el verde de la insignia de `Pictograma`, `COLOR_INSIGNIA_HECHO`) está copiado en la auditoría. Si alguien lo cambia en el componente, hay que cambiarlo también aquí; un test de `Pictograma` comprueba que sigue siendo `#005A1E`.

## Resultado

**135 de 135 comprobaciones cumplen.** Temas (SCRUM-64) y panel de preferencias (SCRUM-66): 115 de 115. `Pictograma` (SCRUM-65): 20 de 20. Las variantes de alto contraste llegan a 7:1 (AAA) en todos sus textos.

Márgenes más ajustados (cumplen, pero conviene no oscurecer ni aclarar más estos colores):

| Tema | Combinación | Contraste | Mínimo |
|---|---|---|---|
| Pastel | Borde de grupos y opciones sobre el fondo | 3,48:1 | 3:1 |
| Claro | Borde de grupos y opciones sobre el fondo | 3,83:1 | 3:1 |
| Pastel | Borde de tarjetas sobre superficie | 3,84:1 | 3:1 |
| Pastel | Marco del pictograma (borde `#5E8A7F` sobre el relleno blanco) | 3,88:1 | 3:1 |
| Pastel | Marca ✓ de la opción elegida (`primario` sobre `superficieDestacada`) | 4,52:1 | 4,5:1 |

## No conformidades

Ninguna en la HU-04.

## Hallazgo en otra historia

Al probar los temas oscuros se vio un fallo en el reloj visual, que no es de esta historia. Se ha apuntado como **NC-004 (Mayor)** en la hoja `No_conformidades` contra la HU-09 (SCRUM-78/79) para que lo corrija su autor.

`RelojVisual` usa colores fijos y no lee el tema activo. Su rótulo «Quedan 3 minutos» (tinta `#14213d`) se queda en 1,13:1 sobre el fondo del tema oscuro y en 1,31:1 sobre el de alto contraste oscuro. El mínimo es 3:1 y 4,5:1 respectivamente, por ser texto grande. En los temas claros cumple de sobra (más de 14:1).

**Acción propuesta para la HU-09:** que `RelojVisual` tome los colores del tema activo cuando esté dentro de `TemaProvider`: `texto` para la tinta, `superficie` para el disco y `peligro` para el sector. Después, añadir sus combinaciones a `COMBINACIONES_DE_USO`.

## Fuera de alcance

- Componentes de otras historias, como el reloj visual (HU-09).
- Sombras y velos semitransparentes (por ejemplo, el fondo oscurecido del modal de vista). No delimitan ningún componente: la tarjeta del modal tiene su propio borde de 4 px en color `primario`.
- Imágenes de ARASAAC: son PNG con trazo negro sobre fondo blanco, y se muestran siempre sobre la tarjeta blanca.
- Pantallas de demostración (`app/demo-*.tsx`), que se borrarán al integrar las pantallas reales.

## Detalle de las comprobaciones

| Tema | Elemento | Tipo | Colores | Contraste | Mínimo | Resultado |
|---|---|---|---|---|---|---|
| Claro | Títulos y textos sobre el fondo de la pantalla | texto | `#1A202C` / `#F7FAFC` | 15,57:1 | 4,50:1 | Cumple |
| Claro | Texto de tarjetas, opciones y modal | texto | `#1A202C` / `#FFFFFF` | 16,32:1 | 4,50:1 | Cumple |
| Claro | Texto de la opción elegida y de la tarea «Ahora» | texto | `#1A202C` / `#E3EDFB` | 13,81:1 | 4,50:1 | Cumple |
| Claro | Subtítulos y ayudas | texto | `#4A5568` / `#F7FAFC` | 7,18:1 | 4,50:1 | Cumple |
| Claro | Texto de apoyo dentro de tarjetas | texto | `#4A5568` / `#FFFFFF` | 7,53:1 | 4,50:1 | Cumple |
| Claro | Rótulo «AHORA» y descripción de la tarea | texto | `#4A5568` / `#E3EDFB` | 6,37:1 | 4,50:1 | Cumple |
| Claro | Texto de los botones principales | texto | `#FFFFFF` / `#2B6CB0` | 5,42:1 | 4,50:1 | Cumple |
| Claro | Muestra «Aa» de cada tema y enlaces | texto | `#2B6CB0` / `#F7FAFC` | 5,17:1 | 4,50:1 | Cumple |
| Claro | Enlaces y textos de acción en tarjetas | texto | `#2B6CB0` / `#FFFFFF` | 5,42:1 | 4,50:1 | Cumple |
| Claro | Marca ✓ de la opción elegida | texto | `#2B6CB0` / `#E3EDFB` | 4,59:1 | 4,50:1 | Cumple |
| Claro | Mensaje de tarea hecha | texto | `#276749` / `#FFFFFF` | 6,73:1 | 4,50:1 | Cumple |
| Claro | Mensaje de error | texto | `#C53030` / `#FFFFFF` | 5,47:1 | 4,50:1 | Cumple |
| Claro | Mensaje de aviso | texto | `#8A5A00` / `#FFFFFF` | 5,93:1 | 4,50:1 | Cumple |
| Claro | Mensaje de tarea hecha sobre la pantalla | texto | `#276749` / `#F7FAFC` | 6,42:1 | 4,50:1 | Cumple |
| Claro | Mensaje de error sobre la pantalla | texto | `#C53030` / `#F7FAFC` | 5,22:1 | 4,50:1 | Cumple |
| Claro | Mensaje de aviso sobre la pantalla | texto | `#8A5A00` / `#F7FAFC` | 5,65:1 | 4,50:1 | Cumple |
| Claro | Borde de grupos y de opciones sin elegir | componente | `#718096` / `#F7FAFC` | 3,83:1 | 3,00:1 | Cumple |
| Claro | Borde de tarjetas, chips y botón suave | componente | `#718096` / `#FFFFFF` | 4,02:1 | 3,00:1 | Cumple |
| Claro | Borde de la opción elegida, botón principal y botón flotante «Vista» | componente | `#2B6CB0` / `#F7FAFC` | 5,17:1 | 3,00:1 | Cumple |
| Claro | Borde de la tarjeta del modal y del chip elegido | componente | `#2B6CB0` / `#FFFFFF` | 5,42:1 | 3,00:1 | Cumple |
| Claro | Anillo de foco sobre la pantalla | componente | `#1A365D` / `#F7FAFC` | 11,58:1 | 3,00:1 | Cumple |
| Claro | Anillo de foco sobre tarjetas | componente | `#1A365D` / `#FFFFFF` | 12,14:1 | 3,00:1 | Cumple |
| Claro | Caja blanca del pictograma (borde o relleno frente a la tarea) | componente | `#718096` / `#FFFFFF` | 4,02:1 | 3,00:1 | Cumple |
| Claro | Marco del pictograma sobre el fondo de la pantalla | componente | `#718096` / `#FFFFFF` | 4,02:1 | 3,00:1 | Cumple |
| Claro | Marco del pictograma sobre tarjetas | componente | `#718096` / `#FFFFFF` | 4,02:1 | 3,00:1 | Cumple |
| Claro | Marco del pictograma en la tarea «Ahora» o la opción elegida | componente | `#718096` / `#FFFFFF` | 4,02:1 | 3,00:1 | Cumple |
| Claro | Marca ✓ de pictograma hecho | texto | `#FFFFFF` / `#005A1E` | 8,46:1 | 4,50:1 | Cumple |
| Oscuro | Títulos y textos sobre el fondo de la pantalla | texto | `#EEF2F8` / `#11161F` | 16,14:1 | 4,50:1 | Cumple |
| Oscuro | Texto de tarjetas, opciones y modal | texto | `#EEF2F8` / `#1B2230` | 14,18:1 | 4,50:1 | Cumple |
| Oscuro | Texto de la opción elegida y de la tarea «Ahora» | texto | `#EEF2F8` / `#23314B` | 11,59:1 | 4,50:1 | Cumple |
| Oscuro | Subtítulos y ayudas | texto | `#B8C2D6` / `#11161F` | 10,12:1 | 4,50:1 | Cumple |
| Oscuro | Texto de apoyo dentro de tarjetas | texto | `#B8C2D6` / `#1B2230` | 8,90:1 | 4,50:1 | Cumple |
| Oscuro | Rótulo «AHORA» y descripción de la tarea | texto | `#B8C2D6` / `#23314B` | 7,27:1 | 4,50:1 | Cumple |
| Oscuro | Texto de los botones principales | texto | `#0B1220` / `#86B7FF` | 9,12:1 | 4,50:1 | Cumple |
| Oscuro | Muestra «Aa» de cada tema y enlaces | texto | `#86B7FF` / `#11161F` | 8,83:1 | 4,50:1 | Cumple |
| Oscuro | Enlaces y textos de acción en tarjetas | texto | `#86B7FF` / `#1B2230` | 7,76:1 | 4,50:1 | Cumple |
| Oscuro | Marca ✓ de la opción elegida | texto | `#86B7FF` / `#23314B` | 6,35:1 | 4,50:1 | Cumple |
| Oscuro | Mensaje de tarea hecha | texto | `#74D69F` / `#1B2230` | 9,00:1 | 4,50:1 | Cumple |
| Oscuro | Mensaje de error | texto | `#FF8A8A` / `#1B2230` | 7,02:1 | 4,50:1 | Cumple |
| Oscuro | Mensaje de aviso | texto | `#F0C445` / `#1B2230` | 9,63:1 | 4,50:1 | Cumple |
| Oscuro | Mensaje de tarea hecha sobre la pantalla | texto | `#74D69F` / `#11161F` | 10,24:1 | 4,50:1 | Cumple |
| Oscuro | Mensaje de error sobre la pantalla | texto | `#FF8A8A` / `#11161F` | 7,99:1 | 4,50:1 | Cumple |
| Oscuro | Mensaje de aviso sobre la pantalla | texto | `#F0C445` / `#11161F` | 10,95:1 | 4,50:1 | Cumple |
| Oscuro | Borde de grupos y de opciones sin elegir | componente | `#7F8CA6` / `#11161F` | 5,36:1 | 3,00:1 | Cumple |
| Oscuro | Borde de tarjetas, chips y botón suave | componente | `#7F8CA6` / `#1B2230` | 4,71:1 | 3,00:1 | Cumple |
| Oscuro | Borde de la opción elegida, botón principal y botón flotante «Vista» | componente | `#86B7FF` / `#11161F` | 8,83:1 | 3,00:1 | Cumple |
| Oscuro | Borde de la tarjeta del modal y del chip elegido | componente | `#86B7FF` / `#1B2230` | 7,76:1 | 3,00:1 | Cumple |
| Oscuro | Anillo de foco sobre la pantalla | componente | `#FFFFFF` / `#11161F` | 18,13:1 | 3,00:1 | Cumple |
| Oscuro | Anillo de foco sobre tarjetas | componente | `#FFFFFF` / `#1B2230` | 15,93:1 | 3,00:1 | Cumple |
| Oscuro | Caja blanca del pictograma (borde o relleno frente a la tarea) | componente | `#FFFFFF` / `#23314B` | 13,02:1 | 3,00:1 | Cumple |
| Oscuro | Marco del pictograma sobre el fondo de la pantalla | componente | `#FFFFFF` / `#11161F` | 18,13:1 | 3,00:1 | Cumple |
| Oscuro | Marco del pictograma sobre tarjetas | componente | `#FFFFFF` / `#1B2230` | 15,93:1 | 3,00:1 | Cumple |
| Oscuro | Marco del pictograma en la tarea «Ahora» o la opción elegida | componente | `#FFFFFF` / `#23314B` | 13,02:1 | 3,00:1 | Cumple |
| Oscuro | Marca ✓ de pictograma hecho | texto | `#FFFFFF` / `#005A1E` | 8,46:1 | 4,50:1 | Cumple |
| Pastel | Títulos y textos sobre el fondo de la pantalla | texto | `#1D3832` / `#EAF5F1` | 11,32:1 | 4,50:1 | Cumple |
| Pastel | Texto de tarjetas, opciones y modal | texto | `#1D3832` / `#FBFFFD` | 12,51:1 | 4,50:1 | Cumple |
| Pastel | Texto de la opción elegida y de la tarea «Ahora» | texto | `#1D3832` / `#D3ECE4` | 10,15:1 | 4,50:1 | Cumple |
| Pastel | Subtítulos y ayudas | texto | `#3F5A53` / `#EAF5F1` | 6,73:1 | 4,50:1 | Cumple |
| Pastel | Texto de apoyo dentro de tarjetas | texto | `#3F5A53` / `#FBFFFD` | 7,44:1 | 4,50:1 | Cumple |
| Pastel | Rótulo «AHORA» y descripción de la tarea | texto | `#3F5A53` / `#D3ECE4` | 6,03:1 | 4,50:1 | Cumple |
| Pastel | Texto de los botones principales | texto | `#FFFFFF` / `#2C7363` | 5,62:1 | 4,50:1 | Cumple |
| Pastel | Muestra «Aa» de cada tema y enlaces | texto | `#2C7363` / `#EAF5F1` | 5,04:1 | 4,50:1 | Cumple |
| Pastel | Enlaces y textos de acción en tarjetas | texto | `#2C7363` / `#FBFFFD` | 5,57:1 | 4,50:1 | Cumple |
| Pastel | Marca ✓ de la opción elegida | texto | `#2C7363` / `#D3ECE4` | 4,52:1 | 4,50:1 | Cumple |
| Pastel | Mensaje de tarea hecha | texto | `#2B6B3F` / `#FBFFFD` | 6,35:1 | 4,50:1 | Cumple |
| Pastel | Mensaje de error | texto | `#A83A32` / `#FBFFFD` | 6,28:1 | 4,50:1 | Cumple |
| Pastel | Mensaje de aviso | texto | `#7A5A00` / `#FBFFFD` | 6,33:1 | 4,50:1 | Cumple |
| Pastel | Mensaje de tarea hecha sobre la pantalla | texto | `#2B6B3F` / `#EAF5F1` | 5,74:1 | 4,50:1 | Cumple |
| Pastel | Mensaje de error sobre la pantalla | texto | `#A83A32` / `#EAF5F1` | 5,68:1 | 4,50:1 | Cumple |
| Pastel | Mensaje de aviso sobre la pantalla | texto | `#7A5A00` / `#EAF5F1` | 5,72:1 | 4,50:1 | Cumple |
| Pastel | Borde de grupos y de opciones sin elegir | componente | `#5E8A7F` / `#EAF5F1` | 3,48:1 | 3,00:1 | Cumple |
| Pastel | Borde de tarjetas, chips y botón suave | componente | `#5E8A7F` / `#FBFFFD` | 3,84:1 | 3,00:1 | Cumple |
| Pastel | Borde de la opción elegida, botón principal y botón flotante «Vista» | componente | `#2C7363` / `#EAF5F1` | 5,04:1 | 3,00:1 | Cumple |
| Pastel | Borde de la tarjeta del modal y del chip elegido | componente | `#2C7363` / `#FBFFFD` | 5,57:1 | 3,00:1 | Cumple |
| Pastel | Anillo de foco sobre la pantalla | componente | `#14423A` / `#EAF5F1` | 10,07:1 | 3,00:1 | Cumple |
| Pastel | Anillo de foco sobre tarjetas | componente | `#14423A` / `#FBFFFD` | 11,14:1 | 3,00:1 | Cumple |
| Pastel | Caja blanca del pictograma (borde o relleno frente a la tarea) | componente | `#5E8A7F` / `#FFFFFF` | 3,88:1 | 3,00:1 | Cumple |
| Pastel | Marco del pictograma sobre el fondo de la pantalla | componente | `#5E8A7F` / `#FFFFFF` | 3,88:1 | 3,00:1 | Cumple |
| Pastel | Marco del pictograma sobre tarjetas | componente | `#5E8A7F` / `#FFFFFF` | 3,88:1 | 3,00:1 | Cumple |
| Pastel | Marco del pictograma en la tarea «Ahora» o la opción elegida | componente | `#5E8A7F` / `#FFFFFF` | 3,88:1 | 3,00:1 | Cumple |
| Pastel | Marca ✓ de pictograma hecho | texto | `#FFFFFF` / `#005A1E` | 8,46:1 | 4,50:1 | Cumple |
| Alto contraste claro | Títulos y textos sobre el fondo de la pantalla | texto | `#000000` / `#FFFFFF` | 21,00:1 | 7,00:1 | Cumple |
| Alto contraste claro | Texto de tarjetas, opciones y modal | texto | `#000000` / `#FFFFFF` | 21,00:1 | 7,00:1 | Cumple |
| Alto contraste claro | Texto de la opción elegida y de la tarea «Ahora» | texto | `#000000` / `#E6E6FF` | 17,13:1 | 7,00:1 | Cumple |
| Alto contraste claro | Subtítulos y ayudas | texto | `#1A1A1A` / `#FFFFFF` | 17,40:1 | 7,00:1 | Cumple |
| Alto contraste claro | Texto de apoyo dentro de tarjetas | texto | `#1A1A1A` / `#FFFFFF` | 17,40:1 | 7,00:1 | Cumple |
| Alto contraste claro | Rótulo «AHORA» y descripción de la tarea | texto | `#1A1A1A` / `#E6E6FF` | 14,19:1 | 7,00:1 | Cumple |
| Alto contraste claro | Texto de los botones principales | texto | `#FFFFFF` / `#0000CC` | 11,22:1 | 7,00:1 | Cumple |
| Alto contraste claro | Muestra «Aa» de cada tema y enlaces | texto | `#0000CC` / `#FFFFFF` | 11,22:1 | 7,00:1 | Cumple |
| Alto contraste claro | Enlaces y textos de acción en tarjetas | texto | `#0000CC` / `#FFFFFF` | 11,22:1 | 7,00:1 | Cumple |
| Alto contraste claro | Marca ✓ de la opción elegida | texto | `#0000CC` / `#E6E6FF` | 9,15:1 | 7,00:1 | Cumple |
| Alto contraste claro | Mensaje de tarea hecha | texto | `#005A1E` / `#FFFFFF` | 8,46:1 | 7,00:1 | Cumple |
| Alto contraste claro | Mensaje de error | texto | `#B00000` / `#FFFFFF` | 7,38:1 | 7,00:1 | Cumple |
| Alto contraste claro | Mensaje de aviso | texto | `#6B4B00` / `#FFFFFF` | 7,98:1 | 7,00:1 | Cumple |
| Alto contraste claro | Mensaje de tarea hecha sobre la pantalla | texto | `#005A1E` / `#FFFFFF` | 8,46:1 | 7,00:1 | Cumple |
| Alto contraste claro | Mensaje de error sobre la pantalla | texto | `#B00000` / `#FFFFFF` | 7,38:1 | 7,00:1 | Cumple |
| Alto contraste claro | Mensaje de aviso sobre la pantalla | texto | `#6B4B00` / `#FFFFFF` | 7,98:1 | 7,00:1 | Cumple |
| Alto contraste claro | Borde de grupos y de opciones sin elegir | componente | `#000000` / `#FFFFFF` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste claro | Borde de tarjetas, chips y botón suave | componente | `#000000` / `#FFFFFF` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste claro | Borde de la opción elegida, botón principal y botón flotante «Vista» | componente | `#0000CC` / `#FFFFFF` | 11,22:1 | 3,00:1 | Cumple |
| Alto contraste claro | Borde de la tarjeta del modal y del chip elegido | componente | `#0000CC` / `#FFFFFF` | 11,22:1 | 3,00:1 | Cumple |
| Alto contraste claro | Anillo de foco sobre la pantalla | componente | `#000000` / `#FFFFFF` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste claro | Anillo de foco sobre tarjetas | componente | `#000000` / `#FFFFFF` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste claro | Caja blanca del pictograma (borde o relleno frente a la tarea) | componente | `#000000` / `#FFFFFF` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste claro | Marco del pictograma sobre el fondo de la pantalla | componente | `#000000` / `#FFFFFF` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste claro | Marco del pictograma sobre tarjetas | componente | `#000000` / `#FFFFFF` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste claro | Marco del pictograma en la tarea «Ahora» o la opción elegida | componente | `#000000` / `#FFFFFF` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste claro | Marca ✓ de pictograma hecho | texto | `#FFFFFF` / `#005A1E` | 8,46:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Títulos y textos sobre el fondo de la pantalla | texto | `#FFFFFF` / `#000000` | 21,00:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Texto de tarjetas, opciones y modal | texto | `#FFFFFF` / `#0B0B0B` | 19,68:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Texto de la opción elegida y de la tarea «Ahora» | texto | `#FFFFFF` / `#1B1900` | 17,71:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Subtítulos y ayudas | texto | `#F2F2F2` / `#000000` | 18,76:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Texto de apoyo dentro de tarjetas | texto | `#F2F2F2` / `#0B0B0B` | 17,58:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Rótulo «AHORA» y descripción de la tarea | texto | `#F2F2F2` / `#1B1900` | 15,82:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Texto de los botones principales | texto | `#000000` / `#FFD400` | 14,67:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Muestra «Aa» de cada tema y enlaces | texto | `#FFD400` / `#000000` | 14,67:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Enlaces y textos de acción en tarjetas | texto | `#FFD400` / `#0B0B0B` | 13,75:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Marca ✓ de la opción elegida | texto | `#FFD400` / `#1B1900` | 12,37:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Mensaje de tarea hecha | texto | `#7CFF8A` / `#0B0B0B` | 15,49:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Mensaje de error | texto | `#FF6B6B` / `#0B0B0B` | 7,09:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Mensaje de aviso | texto | `#FFD400` / `#0B0B0B` | 13,75:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Mensaje de tarea hecha sobre la pantalla | texto | `#7CFF8A` / `#000000` | 16,53:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Mensaje de error sobre la pantalla | texto | `#FF6B6B` / `#000000` | 7,57:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Mensaje de aviso sobre la pantalla | texto | `#FFD400` / `#000000` | 14,67:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Borde de grupos y de opciones sin elegir | componente | `#FFFFFF` / `#000000` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Borde de tarjetas, chips y botón suave | componente | `#FFFFFF` / `#0B0B0B` | 19,68:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Borde de la opción elegida, botón principal y botón flotante «Vista» | componente | `#FFD400` / `#000000` | 14,67:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Borde de la tarjeta del modal y del chip elegido | componente | `#FFD400` / `#0B0B0B` | 13,75:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Anillo de foco sobre la pantalla | componente | `#FFD400` / `#000000` | 14,67:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Anillo de foco sobre tarjetas | componente | `#FFD400` / `#0B0B0B` | 13,75:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Caja blanca del pictograma (borde o relleno frente a la tarea) | componente | `#FFFFFF` / `#1B1900` | 17,71:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Marco del pictograma sobre el fondo de la pantalla | componente | `#FFFFFF` / `#000000` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Marco del pictograma sobre tarjetas | componente | `#FFFFFF` / `#0B0B0B` | 19,68:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Marco del pictograma en la tarea «Ahora» o la opción elegida | componente | `#FFFFFF` / `#1B1900` | 17,71:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Marca ✓ de pictograma hecho | texto | `#FFFFFF` / `#005A1E` | 8,46:1 | 7,00:1 | Cumple |
