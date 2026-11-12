# Auditoría de contraste cromático WCAG 2.1 AA/AAA

**Tarea:** SCRUM-67 · T-04.4 [Accesibilidad] · Historia SCRUM-63 (HU-04)
**Fecha:** 6 de noviembre de 2026 · **Autor:** Javier Miñán Molina (gestor de calidad)
**Alcance:** lo que entrega la HU-04 en la rama `SCRUM-63-hu-04-…`: los temas de color (SCRUM-64), el componente `Pictograma` de ARASAAC (SCRUM-65) y el panel de preferencias (SCRUM-66). Los componentes de otras historias se auditan en su propia historia.

## Actualización del 12 de noviembre de 2026: paleta «Piedra»

Con el rediseño de la interfaz cambia el tema **Claro**, que es el que se ve por defecto. Pasa a grises cálidos y a un solo color de acento, el granate `#7D1D4F` (el del colegio, algo más oscuro para que el texto blanco llegue a AAA). Los temas oscuro, pastel y de alto contraste no cambian. El turquesa del logo (`#76D3D7`) da 1,74:1 sobre blanco y no se usa ni en textos ni en bordes.

Se volvió a pasar la auditoría: **180 de 180 comprobaciones cumplen.** Este es el resultado vigente; el apartado «Resultado» de más abajo es el del 6 de noviembre. Hay 45 comprobaciones más que entonces:

- 15 del reloj visual (HU-09), que ya lee el tema activo (NC-004 resuelta).
- 30 del rediseño, en los cinco temas: el icono del sello de tarea hecha y del de tarea bloqueada, el texto del botón «Ayuda» y las tres formas de clase (triángulo, círculo y cuadrado).

Al añadirlas salieron dos fallos en los temas oscuros, ya corregidos:

- El icono blanco sobre el sello verde de tarea hecha se quedaba en 1,77:1 (Oscuro) y 1,27:1 (Alto contraste oscuro). Ahora el icono es blanco o negro según cuál contraste más con el relleno (`colorSobre`, en `src/ui/apariencia.ts`): queda en 11,86:1 y 16,53:1.
- Las formas de clase se quedaban en 2,44:1 sobre la tarjeta del tema Oscuro. Ahora, en los temas oscuros, van sobre una placa blanca como los pictogramas: 5,90:1 como mínimo.

La tabla de detalle de abajo está regenerada con `informeMarkdown`.

| Tema Claro | Antes | «Piedra» |
|---|---|---|
| Texto sobre el fondo | 15,57:1 | 14,23:1 |
| Texto blanco sobre el botón principal | 5,42:1 | 9,72:1 |
| Texto secundario sobre el fondo | 7,18:1 | 6,87:1 |
| Borde de grupos y opciones sobre el fondo | 3,83:1 | 3,93:1 |
| Anillo de foco sobre la pantalla | 11,58:1 | 6,60:1 |

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
4. Los colores fijos están copiados en la auditoría: el verde de la insignia de `Pictograma` (`COLOR_INSIGNIA_HECHO`, `#005A1E`, que también comprueba un test de `Pictograma`) y, desde el rediseño, los de las formas de clase de `FormaClase` (`#B3261E`, `#2F62B8` y `#2D6A3E`). Si alguien los cambia en el componente, hay que cambiarlos también aquí.

## Resultado

**135 de 135 comprobaciones cumplen** (6 de noviembre; el resultado vigente está en la actualización del principio). Temas (SCRUM-64) y panel de preferencias (SCRUM-66): 115 de 115. `Pictograma` (SCRUM-65): 20 de 20. Las variantes de alto contraste llegan a 7:1 (AAA) en todos sus textos.

Márgenes más ajustados (cumplen, pero conviene no oscurecer ni aclarar más estos colores):

| Tema | Combinación | Contraste | Mínimo |
|---|---|---|---|
| Pastel | Borde de grupos y opciones sobre el fondo | 3,48:1 | 3:1 |
| Claro | Borde de grupos y opciones sobre el fondo | 3,93:1 (antes 3,83:1) | 3:1 |
| Pastel | Borde de tarjetas sobre superficie | 3,84:1 | 3:1 |
| Pastel | Marco del pictograma (borde `#5E8A7F` sobre el relleno blanco) | 3,88:1 | 3:1 |
| Pastel | Marca ✓ de la opción elegida (`primario` sobre `superficieDestacada`) | 4,52:1 | 4,5:1 |

## No conformidades

Ninguna en la HU-04.

## Hallazgo en otra historia

Al probar los temas oscuros se vio un fallo en el reloj visual, que no es de esta historia. Se ha apuntado como **NC-004 (Mayor)** en la hoja `No_conformidades` contra la HU-09 (SCRUM-78/79) para que lo corrija su autor.

**Estado a 12 de noviembre: resuelta.** `RelojVisual` ya toma `texto`, `superficie` y `peligro` del tema activo, y sus combinaciones están en `COMBINACIONES_DE_USO` (`reloj-*`). Lo que se encontró entonces:

`RelojVisual` usaba colores fijos y no leía el tema activo. Su rótulo «Quedan 3 minutos» (tinta `#14213d`) se quedaba en 1,13:1 sobre el fondo del tema oscuro y en 1,31:1 sobre el de alto contraste oscuro. El mínimo es 3:1 y 4,5:1 respectivamente, por ser texto grande. En los temas claros cumple de sobra (más de 14:1).

**Acción propuesta para la HU-09:** que `RelojVisual` tome los colores del tema activo cuando esté dentro de `TemaProvider`: `texto` para la tinta, `superficie` para el disco y `peligro` para el sector. Después, añadir sus combinaciones a `COMBINACIONES_DE_USO`.

## Fuera de alcance

- Componentes de otras historias. El reloj visual (HU-09) se añadió después, al resolver la NC-004.
- Sombras y velos semitransparentes (por ejemplo, el fondo oscurecido del modal de vista). No delimitan ningún componente: la tarjeta del modal tiene su propio borde de 4 px en color `primario`.
- Imágenes de ARASAAC: son PNG con trazo negro sobre fondo blanco, y se muestran siempre sobre la tarjeta blanca.
- Pantallas de demostración (`app/demo-*.tsx`), que se borrarán al integrar las pantallas reales.

## Detalle de las comprobaciones

| Tema | Elemento | Tipo | Colores | Contraste | Mínimo | Resultado |
|---|---|---|---|---|---|---|
| Claro | Títulos y textos sobre el fondo de la pantalla | texto | `#22211F` / `#F1F1EF` | 14,23:1 | 4,50:1 | Cumple |
| Claro | Texto de tarjetas, opciones y modal | texto | `#22211F` / `#FFFFFF` | 16,09:1 | 4,50:1 | Cumple |
| Claro | Texto de la opción elegida y de la tarea «Ahora» | texto | `#22211F` / `#EDE6E9` | 13,10:1 | 4,50:1 | Cumple |
| Claro | Subtítulos y ayudas | texto | `#55524E` / `#F1F1EF` | 6,87:1 | 4,50:1 | Cumple |
| Claro | Texto de apoyo dentro de tarjetas | texto | `#55524E` / `#FFFFFF` | 7,77:1 | 4,50:1 | Cumple |
| Claro | Rótulo «AHORA» y descripción de la tarea | texto | `#55524E` / `#EDE6E9` | 6,32:1 | 4,50:1 | Cumple |
| Claro | Texto de los botones principales | texto | `#FFFFFF` / `#7D1D4F` | 9,72:1 | 4,50:1 | Cumple |
| Claro | Muestra «Aa» de cada tema y enlaces | texto | `#7D1D4F` / `#F1F1EF` | 8,59:1 | 4,50:1 | Cumple |
| Claro | Enlaces y textos de acción en tarjetas | texto | `#7D1D4F` / `#FFFFFF` | 9,72:1 | 4,50:1 | Cumple |
| Claro | Marca ✓ de la opción elegida | texto | `#7D1D4F` / `#EDE6E9` | 7,91:1 | 4,50:1 | Cumple |
| Claro | Mensaje de tarea hecha | texto | `#2D6A3E` / `#FFFFFF` | 6,48:1 | 4,50:1 | Cumple |
| Claro | Mensaje de error | texto | `#B3261E` / `#FFFFFF` | 6,54:1 | 4,50:1 | Cumple |
| Claro | Mensaje de aviso | texto | `#7A5600` / `#FFFFFF` | 6,65:1 | 4,50:1 | Cumple |
| Claro | Mensaje de tarea hecha sobre la pantalla | texto | `#2D6A3E` / `#F1F1EF` | 5,73:1 | 4,50:1 | Cumple |
| Claro | Mensaje de error sobre la pantalla | texto | `#B3261E` / `#F1F1EF` | 5,78:1 | 4,50:1 | Cumple |
| Claro | Mensaje de aviso sobre la pantalla | texto | `#7A5600` / `#F1F1EF` | 5,88:1 | 4,50:1 | Cumple |
| Claro | Borde de grupos y de opciones sin elegir | componente | `#7B7772` / `#F1F1EF` | 3,93:1 | 3,00:1 | Cumple |
| Claro | Borde de tarjetas, chips y botón suave | componente | `#7B7772` / `#FFFFFF` | 4,45:1 | 3,00:1 | Cumple |
| Claro | Borde de la opción elegida, botón principal y botón flotante «Vista» | componente | `#7D1D4F` / `#F1F1EF` | 8,59:1 | 3,00:1 | Cumple |
| Claro | Borde de la tarjeta del modal y del chip elegido | componente | `#7D1D4F` / `#FFFFFF` | 9,72:1 | 3,00:1 | Cumple |
| Claro | Anillo de foco sobre la pantalla | componente | `#155E63` / `#F1F1EF` | 6,60:1 | 3,00:1 | Cumple |
| Claro | Anillo de foco sobre tarjetas | componente | `#155E63` / `#FFFFFF` | 7,46:1 | 3,00:1 | Cumple |
| Claro | Caja blanca del pictograma (borde o relleno frente a la tarea) | componente | `#7B7772` / `#FFFFFF` | 4,45:1 | 3,00:1 | Cumple |
| Claro | Marco del pictograma sobre el fondo de la pantalla | componente | `#7B7772` / `#FFFFFF` | 4,45:1 | 3,00:1 | Cumple |
| Claro | Marco del pictograma sobre tarjetas | componente | `#7B7772` / `#FFFFFF` | 4,45:1 | 3,00:1 | Cumple |
| Claro | Marco del pictograma en la tarea «Ahora» o la opción elegida | componente | `#7B7772` / `#FFFFFF` | 4,45:1 | 3,00:1 | Cumple |
| Claro | Marca ✓ de pictograma hecho | texto | `#FFFFFF` / `#005A1E` | 8,46:1 | 4,50:1 | Cumple |
| Claro | Rótulo «Quedan X minutos» bajo el reloj | texto | `#22211F` / `#F1F1EF` | 14,23:1 | 4,50:1 | Cumple |
| Claro | Sector de tiempo restante sobre el disco | componente | `#B3261E` / `#FFFFFF` | 6,54:1 | 3,00:1 | Cumple |
| Claro | Borde y marcas horarias sobre el disco | componente | `#22211F` / `#FFFFFF` | 16,09:1 | 3,00:1 | Cumple |
| Claro | Marca de tarea hecha sobre el sello verde | texto | `#FFFFFF` / `#2D6A3E` | 6,48:1 | 4,50:1 | Cumple |
| Claro | Candado de tarea bloqueada sobre el sello de aviso | texto | `#FFFFFF` / `#7A5600` | 6,65:1 | 4,50:1 | Cumple |
| Claro | Texto «Ayuda» del botón de necesidades | texto | `#FFFFFF` / `#B3261E` | 6,54:1 | 4,50:1 | Cumple |
| Claro | Forma de la clase Triángulo | componente | `#B3261E` / `#FFFFFF` | 6,54:1 | 3,00:1 | Cumple |
| Claro | Forma de la clase Círculo | componente | `#2F62B8` / `#FFFFFF` | 5,90:1 | 3,00:1 | Cumple |
| Claro | Forma de la clase Cuadrado | componente | `#2D6A3E` / `#FFFFFF` | 6,48:1 | 3,00:1 | Cumple |
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
| Oscuro | Rótulo «Quedan X minutos» bajo el reloj | texto | `#EEF2F8` / `#11161F` | 16,14:1 | 4,50:1 | Cumple |
| Oscuro | Sector de tiempo restante sobre el disco | componente | `#FF8A8A` / `#1B2230` | 7,02:1 | 3,00:1 | Cumple |
| Oscuro | Borde y marcas horarias sobre el disco | componente | `#EEF2F8` / `#1B2230` | 14,18:1 | 3,00:1 | Cumple |
| Oscuro | Marca de tarea hecha sobre el sello verde | texto | `#000000` / `#74D69F` | 11,86:1 | 4,50:1 | Cumple |
| Oscuro | Candado de tarea bloqueada sobre el sello de aviso | texto | `#000000` / `#F0C445` | 12,69:1 | 4,50:1 | Cumple |
| Oscuro | Texto «Ayuda» del botón de necesidades | texto | `#000000` / `#FF8A8A` | 9,25:1 | 4,50:1 | Cumple |
| Oscuro | Forma de la clase Triángulo | componente | `#B3261E` / `#FFFFFF` | 6,54:1 | 3,00:1 | Cumple |
| Oscuro | Forma de la clase Círculo | componente | `#2F62B8` / `#FFFFFF` | 5,90:1 | 3,00:1 | Cumple |
| Oscuro | Forma de la clase Cuadrado | componente | `#2D6A3E` / `#FFFFFF` | 6,48:1 | 3,00:1 | Cumple |
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
| Pastel | Rótulo «Quedan X minutos» bajo el reloj | texto | `#1D3832` / `#EAF5F1` | 11,32:1 | 4,50:1 | Cumple |
| Pastel | Sector de tiempo restante sobre el disco | componente | `#A83A32` / `#FBFFFD` | 6,28:1 | 3,00:1 | Cumple |
| Pastel | Borde y marcas horarias sobre el disco | componente | `#1D3832` / `#FBFFFD` | 12,51:1 | 3,00:1 | Cumple |
| Pastel | Marca de tarea hecha sobre el sello verde | texto | `#FFFFFF` / `#2B6B3F` | 6,41:1 | 4,50:1 | Cumple |
| Pastel | Candado de tarea bloqueada sobre el sello de aviso | texto | `#FFFFFF` / `#7A5A00` | 6,38:1 | 4,50:1 | Cumple |
| Pastel | Texto «Ayuda» del botón de necesidades | texto | `#FFFFFF` / `#A83A32` | 6,33:1 | 4,50:1 | Cumple |
| Pastel | Forma de la clase Triángulo | componente | `#B3261E` / `#FFFFFF` | 6,54:1 | 3,00:1 | Cumple |
| Pastel | Forma de la clase Círculo | componente | `#2F62B8` / `#FFFFFF` | 5,90:1 | 3,00:1 | Cumple |
| Pastel | Forma de la clase Cuadrado | componente | `#2D6A3E` / `#FFFFFF` | 6,48:1 | 3,00:1 | Cumple |
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
| Alto contraste claro | Rótulo «Quedan X minutos» bajo el reloj | texto | `#000000` / `#FFFFFF` | 21,00:1 | 7,00:1 | Cumple |
| Alto contraste claro | Sector de tiempo restante sobre el disco | componente | `#B00000` / `#FFFFFF` | 7,38:1 | 3,00:1 | Cumple |
| Alto contraste claro | Borde y marcas horarias sobre el disco | componente | `#000000` / `#FFFFFF` | 21,00:1 | 3,00:1 | Cumple |
| Alto contraste claro | Marca de tarea hecha sobre el sello verde | texto | `#FFFFFF` / `#005A1E` | 8,46:1 | 7,00:1 | Cumple |
| Alto contraste claro | Candado de tarea bloqueada sobre el sello de aviso | texto | `#FFFFFF` / `#6B4B00` | 7,98:1 | 7,00:1 | Cumple |
| Alto contraste claro | Texto «Ayuda» del botón de necesidades | texto | `#FFFFFF` / `#B00000` | 7,38:1 | 7,00:1 | Cumple |
| Alto contraste claro | Forma de la clase Triángulo | componente | `#B3261E` / `#FFFFFF` | 6,54:1 | 3,00:1 | Cumple |
| Alto contraste claro | Forma de la clase Círculo | componente | `#2F62B8` / `#FFFFFF` | 5,90:1 | 3,00:1 | Cumple |
| Alto contraste claro | Forma de la clase Cuadrado | componente | `#2D6A3E` / `#FFFFFF` | 6,48:1 | 3,00:1 | Cumple |
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
| Alto contraste oscuro | Rótulo «Quedan X minutos» bajo el reloj | texto | `#FFFFFF` / `#000000` | 21,00:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Sector de tiempo restante sobre el disco | componente | `#FF6B6B` / `#0B0B0B` | 7,09:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Borde y marcas horarias sobre el disco | componente | `#FFFFFF` / `#0B0B0B` | 19,68:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Marca de tarea hecha sobre el sello verde | texto | `#000000` / `#7CFF8A` | 16,53:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Candado de tarea bloqueada sobre el sello de aviso | texto | `#000000` / `#FFD400` | 14,67:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Texto «Ayuda» del botón de necesidades | texto | `#000000` / `#FF6B6B` | 7,57:1 | 7,00:1 | Cumple |
| Alto contraste oscuro | Forma de la clase Triángulo | componente | `#B3261E` / `#FFFFFF` | 6,54:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Forma de la clase Círculo | componente | `#2F62B8` / `#FFFFFF` | 5,90:1 | 3,00:1 | Cumple |
| Alto contraste oscuro | Forma de la clase Cuadrado | componente | `#2D6A3E` / `#FFFFFF` | 6,48:1 | 3,00:1 | Cumple |
