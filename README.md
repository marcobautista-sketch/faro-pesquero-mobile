# Faro Pesquero · Chorrillos (app móvil)

Faro Pesquero es una app para celular que **reconoce aves marinas por su sonido** y le dice al pescador qué peces hay debajo. Está pensada para los pescadores artesanales adultos mayores de la Caleta de Chorrillos (Lima, Perú).

La app escucha el mar con el micrófono. Un modelo de inteligencia artificial hecho con Edge Impulse decide si suena un **piquero**, un **pelícano**, una **gaviota** o solo **ruido del mar**. Con eso, la app muestra y lee en voz alta un consejo de pesca. Además usa los sensores del celular para medir el oleaje, anticipar el mal tiempo y orientar al pescador hacia las zonas de pesca.

Es la versión móvil (Expo + React Native) de la [app web Faro Pesquero](https://github.com/nicolasllerenas/faro-pesquero-app). Usa el mismo modelo, los mismos sonidos y los mismos textos.

---

## Contenido

1. [Cómo usarla en el celular](#1-cómo-usarla-en-el-celular)
2. [Guía rápida para la demostración](#2-guía-rápida-para-la-demostración)
3. [Las pantallas de la app](#3-las-pantallas-de-la-app)
4. [Sensores que usa](#4-sensores-que-usa)
5. [Cómo funciona el modelo de IA](#5-cómo-funciona-el-modelo-de-ia)
6. [Accesibilidad para pescadores mayores](#6-accesibilidad-para-pescadores-mayores)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Problemas frecuentes](#8-problemas-frecuentes)
9. [Limitaciones conocidas](#9-limitaciones-conocidas)

---

## 1. Cómo usarla en el celular

La app se abre con **Expo Go**, una aplicación gratuita que ejecuta proyectos de Expo sin instalarlos desde una tienda. La computadora sirve la app y el celular la descarga escaneando un código QR.

### Lo que necesitas

| En la computadora | En el celular |
|---|---|
| [Node.js](https://nodejs.org) 22.13+ o 24.3+ | **Expo Go** del App Store (iPhone) o de Google Play (Android) |
| [Git](https://git-scm.com) | Estar en la **misma red Wi-Fi** que la computadora |

El proyecto usa **Expo SDK 58**. Expo Go de las tiendas siempre corre la versión más reciente de Expo, así que mantén Expo Go actualizado.

### Paso a paso

**1. Descarga el proyecto e instala sus dependencias.** En una terminal (PowerShell en Windows, Terminal en Mac):

```bash
git clone https://github.com/marcobautista-sketch/faro-pesquero-mobile.git
cd faro-pesquero-mobile
npm install
```

Al final, `npm install` empaqueta el modelo de IA. Debe aparecer esta línea:

```
Modelo empaquetado: 10.7 MB de HTML en src/model/generated/
```

**2. Inicia el servidor de desarrollo:**

```bash
npx expo start
```

En la terminal aparece un código QR. En Windows, la primera vez puede salir un aviso del firewall para *Node.js*. Elige **Permitir acceso** en redes privadas.

**3. Abre la app en el celular:**

- **iPhone:** abre la app **Cámara**, apunta al QR y toca el aviso amarillo *"Abrir en Expo Go"*.
- **Android:** abre **Expo Go** y toca *"Scan QR code"*.

La primera carga puede tardar entre 20 y 40 segundos, porque la app lleva dentro el modelo de IA (unos 18 MB). Las siguientes veces es más rápida.

**4. Acepta los permisos** cuando la app los pida:

| Permiso | Para qué |
|---|---|
| Micrófono | Escuchar el mar y reconocer las aves |
| Ubicación | GPS, distancia a las zonas de pesca y brújula |
| Movimiento y actividad física | Barómetro (presión del aire) |

### Si el QR no conecta

Algunas redes, como las de universidades u oficinas, no dejan que los dispositivos se hablen entre sí. Prueba en este orden:

1. **Comparte internet desde el celular** (hotspot), conecta la computadora a esa red y vuelve a ejecutar `npx expo start`.
2. **Modo túnel:** ejecuta `npx expo start --tunnel`. La primera vez pide instalar `@expo/ngrok`: responde `y`.

---

## 2. Guía rápida para la demostración

Recorrido sugerido de unos 3 minutos:

1. **Escuchar → Banco de pruebas → Piquero Peruano.** Suena el canto real, el modelo lo reconoce con 100 % de certeza y aparece la tarjeta verde con el consejo: *"Echar red de cerco o cortina a 2 brazas"*. El celular vibra y la Voz del Faro lee el consejo.
2. Repite con **Pelícano** (ámbar), **Gaviota** (cian) y **Ruido Marino** (gris) para mostrar las 4 clases.
3. **Activar micrófono en vivo.** Desde otra computadora o celular, reproduce uno de los audios de [`assets/audio/`](assets/audio) cerca del micrófono. El radar reacciona al volumen y la app detecta el ave.
4. **Sensores.** Mueve o sacude el celular: el estado del mar cambia de *Mar calmo* a *Marejada* y a *Oleaje fuerte*, con vibración y aviso de voz. Subir o bajar un piso con el celular cambia la presión del barómetro.
5. **Zonas.** Elige *Bajo del Morro Solar*. Gira con el celular: la flecha siempre apunta hacia la zona e indica cuántos grados girar a babor o estribor.
6. **Bitácora.** Aparecen las aves detectadas durante la demo, con hora, lugar y coordenadas GPS.
7. **Perfil → Modo Sol.** Toda la app pasa a negro puro con bordes blancos, para leer bajo el sol.

> Para repetir la demo desde cero: **Perfil → Restablecer datos de demo**.

---

## 3. Las pantallas de la app

La app tiene 5 pestañas en la barra inferior.

### Escuchar (pantalla principal)

- **Radar acústico:** ondas animadas. Con el micrófono abierto, crecen con el volumen del mar.
- **Botón *Activar micrófono en vivo*:** empieza a escuchar. El mismo botón, en rojo, la detiene. Mientras escucha, la pantalla no se apaga.
- **Tarjeta de detección:** ave detectada, nombre científico, porcentaje de certeza, indicación de pesca y consejo para el patrón. El botón *Escuchar consejo con voz* lo lee en voz alta.
- **Banco de pruebas:** 4 botones con el canto real de cada ave. Sirve para mostrar la app aunque no haya aves cerca.
- Botones rápidos arriba: **Voz del Faro** (encender o apagar la voz) y **Modo Sol** (alto contraste).

Qué indica cada ave, según el saber de los pescadores de Chorrillos:

| Ave | Qué indica | Consejo |
|---|---|---|
| Piquero Peruano (*Sula variegata*) | Cardumen denso de anchoveta y pejerrey en superficie | Echar red de cerco o cortina a 2 brazas de inmediato |
| Pelícano Peruano (*Pelecanus thagus*) | Peces mayores de costa: corvina, machete y lisa | Probar con espinel o pinta manual, lejos del oleaje |
| Gaviota Peruana (*Larus belcheri*) | Peces carnada dispersos y lorna en superficie | Curricán o anzuelo número 5 |
| Ruido de fondo | Sin cardumen evidente | Avanzar 500 m hacia el Morro Solar |

### Sensores

Cuatro tarjetas con lo que el celular mide en el bote:

- **Estado del mar:** un horizonte que se queda nivelado mientras el bote se balancea. Muestra el balanceo, la escora (inclinación lateral) y la sacudida, y da un consejo según el oleaje.
- **Presión del aire:** valor en hPa, cambio en los últimos 3 minutos, gráfico de ese periodo y tendencia.
- **Posición GPS:** coordenadas, velocidad en nudos, precisión y zona de pesca más cercana.
- **Brújula:** rumbo en grados y punto cardinal.

### Zonas

Las 4 zonas tradicionales de pesca de Chorrillos, ordenadas de la más cercana a la más lejana:

| Zona | Profundidad | Arte recomendado | Aves frecuentes |
|---|---|---|---|
| Frente al Muelle de Chorrillos | 6 m | Pinta costera / línea de mano | Pelícano, gaviota |
| Bajo del Morro Solar | 18 m | Red de cerco / cortina de 2 brazas | Piquero, pelícano |
| El Salto del Fraile | 12 m | Espinel de fondo / pinta manual | Gaviota, pelícano |
| Bajo de La Herradura | 15 m | Red agallera / trasmallo | Piquero, gaviota |

Al tocar una zona, una **brújula con flecha** apunta hacia ella. Debajo aparecen la distancia (km y millas náuticas), el rumbo y la instrucción de giro: *"Gire 40° a estribor (derecha)"*. Si el bote avanza, también calcula el tiempo de llegada. Sin señal GPS, las distancias se calculan desde el Muelle de Chorrillos.

### Bitácora

Historial de las aves detectadas, guardado en el celular. Cada registro tiene ave, certeza, indicación de pesca, lugar, coordenadas, hora y origen (*Micrófono en vivo* o *Banco de pruebas*). Se puede filtrar por ave y limpiar entera. La primera vez trae 3 registros de ejemplo.

### Perfil

- **Credencial del pescador:** nombre, apodo, embarcación, matrícula DICAPI, experiencia, caleta y asociación. Se puede editar.
- **Preferencias:** Modo Sol, Voz del Faro, Letra grande, Vibración y Guardar en la bitácora.
- **Probar Voz del Faro** e información del modelo.
- **Restablecer datos de demo.**

---

## 4. Sensores que usa

| Sensor | Módulo de Expo | Para qué lo usa la app | Cómo probarlo |
|---|---|---|---|
| Micrófono | `expo-audio` (`useAudioStream`) | Captura el sonido en tiempo real para el modelo | Banco de pruebas o micrófono en vivo |
| Acelerómetro + giroscopio | `expo-sensors` (`DeviceMotion`) | Mide balanceo y sacudidas para estimar el oleaje | Mover o sacudir el celular |
| Barómetro | `expo-sensors` (`Barometer`) | Presión del aire y su tendencia para anticipar mal tiempo | Subir o bajar un piso |
| Magnetómetro (brújula) | `expo-location` (`watchHeadingAsync`) | Rumbo del celular y flecha hacia cada zona | Girar sobre uno mismo |
| GPS | `expo-location` (`watchPositionAsync`) | Posición, velocidad en nudos y lugar de cada detección | Pestaña Sensores |
| Vibración | `expo-haptics` | Avisa una detección o un oleaje fuerte sin mirar la pantalla | Cualquier detección |
| Voz | `expo-speech` | Lee los consejos en voz alta | Perfil → Probar Voz del Faro |
| Pantalla encendida | `expo-keep-awake` | Evita que la pantalla se apague mientras escucha | Micrófono en vivo |

**Reglas de los sensores:**

- **Oleaje** (últimos 4 segundos):
  - *Oleaje fuerte:* balanceo de 25° o más, o sacudida de 2,5 m/s² o más.
  - *Marejada:* balanceo de 10° o más, o sacudida de 0,8 m/s² o más.
  - *Mar calmo:* menos que eso.
  - Al pasar a oleaje fuerte, avisa con vibración y voz, como máximo una vez cada 15 segundos.
- **Presión:** toma una lectura cada 5 segundos y compara contra la más antigua de los últimos 3 minutos.
  - *Bajando:* cae 0,3 hPa o más.
  - *Subiendo:* sube 0,3 hPa o más.
  - *Estable:* cambia menos que eso.
- Los sensores de la pestaña Sensores solo se encienden mientras esa pestaña está a la vista, para ahorrar batería.

---

## 5. Cómo funciona el modelo de IA

- **Modelo:** proyecto de Edge Impulse **#1134969 `Faro_Pesquero_IA`**, versión 3. Es un clasificador de audio con 4 clases: `Gaviota`, `Pelicano`, `Piquero` y `Ruido_Fondo`.
- **Entrada:** 1 segundo de audio a 16 000 Hz, es decir, 16 000 muestras en escala de 16 bits.
- **Funciona sin internet.** El modelo corre dentro del celular, porque a 2 millas del Morro Solar la señal móvil se pierde.

### ¿Por qué corre dentro de un WebView?

Edge Impulse exporta el modelo en **WebAssembly** (`model/ei/*.wasm`). Expo Go ejecuta el código de la app con el motor **Hermes**, y Hermes no ejecuta WebAssembly. La solución:

1. Al hacer `npm install`, el script [`scripts/build-model.mjs`](scripts/build-model.mjs) arma una página HTML que lleva dentro el modelo (en base64), el código de Edge Impulse y un pequeño puente de mensajes. Esa página se guarda en `src/model/generated/`, que no se sube a Git.
2. La app carga esa página en un **WebView invisible**, que usa el mismo motor de Safari o Chrome y sí ejecuta WebAssembly ([`src/context/ClassifierContext.tsx`](src/context/ClassifierContext.tsx)).
3. Para clasificar, la app le envía al WebView 1 segundo de audio. El WebView responde con la probabilidad de cada ave en pocos milisegundos.

### Del micrófono a la alerta

```
Micrófono (16 kHz) → ventanas de 1 s con 50 % de solapamiento → modelo en el WebView
   → ¿ave con 75 % de certeza o más? → tarjeta + vibración + Voz del Faro
   → ¿70 % o más y "Guardar en la bitácora" activo? → se anota con hora y GPS
```

- Se analiza una ventana cada medio segundo, igual que la app web.
- En vivo, la misma ave no se vuelve a anunciar ni a guardar hasta pasados **10 segundos**.
- Mientras habla la Voz del Faro, **el micrófono se pausa** y luego se reanuda solo. En iPhone no se puede grabar y hablar por el parlante a la vez, y así la app tampoco se escucha a sí misma.

---

## 6. Accesibilidad para pescadores mayores

La app sigue el sistema de diseño de la versión web (paleta *Mar de Grau*):

- **Botones de acción grandes**, de 64 px de alto o más, para manos mojadas o con guantes.
- **Ningún texto útil por debajo de 13 px.** El modo *Letra grande* aumenta todos los textos un 12 %.
- **Modo Sol:** fondo negro puro, texto blanco y bordes blancos para el reflejo del sol en el mar.
- **Doble canal:** cada alerta se ve, se siente (vibración) y se escucha (voz), porque el pescador no puede mirar la pantalla mientras cala la red.
- Colores fijos por ave: verde para el piquero, ámbar para el pelícano y cian para la gaviota.

---

## 7. Estructura del proyecto

```
faro-pesquero-mobile/
├── assets/audio/            # Cantos de prueba (WAV, 16 kHz, mono, 1 s)
├── model/ei/                # Modelo de Edge Impulse exportado (WebAssembly + JS)
├── scripts/build-model.mjs  # Empaqueta el modelo y los sonidos para la app
└── src/
    ├── app/                 # Pantallas (Expo Router: cada archivo es una pantalla)
    │   ├── _layout.tsx      # Raíz: estado global, GPS y modelo
    │   └── (tabs)/          # index (Escuchar), mar (Sensores), zonas, bitacora, perfil
    ├── components/          # Radar, tarjeta de detección, banco de pruebas, brújula, botones
    ├── context/             # AppStore (datos), ClassifierContext (modelo), LocationContext (GPS)
    ├── hooks/               # Micrófono en vivo, sensores y manejo de detecciones
    ├── lib/                 # Datos de aves y zonas, cálculos GPS, audio, tema y voz
    └── model/generated/     # (se genera con npm install; no está en Git)
```

### Tecnologías

| | |
|---|---|
| Framework | Expo SDK 58, React Native 0.88, React 19.3, TypeScript |
| Navegación | Expo Router (pestañas) |
| IA | Edge Impulse (WebAssembly) dentro de `react-native-webview` |
| Datos | `@react-native-async-storage/async-storage` (todo queda en el celular, sin servidor) |
| Íconos | `@expo/vector-icons` (Material Community Icons) |

### Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias y empaqueta el modelo |
| `npx expo start` | Inicia el servidor para Expo Go |
| `npm run start:tunnel` | Igual, pero por túnel (redes que bloquean la conexión local) |
| `npm run build:model` | Vuelve a empaquetar el modelo (si cambias algo en `model/ei/` o `assets/audio/`) |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npx expo-doctor` | Revisa la configuración y las versiones del proyecto |

### Actualizar el modelo

1. Exporta el proyecto en Edge Impulse como **WebAssembly**.
2. Reemplaza los 3 archivos de `model/ei/`.
3. Ejecuta `npm run build:model`.

Si cambian las etiquetas del modelo, actualiza también [`src/lib/species.ts`](src/lib/species.ts).

---

## 8. Problemas frecuentes

| Problema | Solución |
|---|---|
| *"Project is incompatible with this version of Expo Go"* | Actualiza Expo Go desde la tienda. El proyecto usa SDK 58. |
| El QR no abre la app o se queda cargando | Revisa que la PC y el celular estén en la misma red. Si no funciona, usa el hotspot del celular o `npx expo start --tunnel`. |
| El botón dice *"Cargando modelo…"* mucho tiempo | Espera unos segundos tras abrir la app. Si sigue igual, agita el celular y toca **Reload** en el menú de Expo Go. |
| `Unable to resolve module ../model/generated/eiHtml` | Falta empaquetar el modelo: ejecuta `npm run build:model`. |
| *"Sin permiso de micrófono"* o de ubicación | En el iPhone: **Ajustes → Expo Go** y activa Micrófono, Ubicación y Movimiento. |
| La brújula dice *"Calibrando…"* | Mueve el celular dibujando un 8 en el aire y aléjate de objetos metálicos. |
| No se oye la voz | Sube el volumen. La app suena aunque el iPhone esté en modo silencio. |
| *"Este celular no tiene barómetro"* | Algunos Android no tienen ese sensor. Los iPhone sí lo tienen. |

---

## 9. Limitaciones conocidas

- El modelo se entrenó con sonidos de prueba (los del banco de pruebas). Con aves reales, o con audio que viaja por el aire desde un parlante, la certeza puede bajar.
- La bitácora y el perfil se guardan solo en ese celular. No se sincronizan con la app web.
- La brújula y el oleaje usan los sensores del teléfono: dentro de un edificio o cerca de metal, la brújula pierde precisión.
- Para usarla fuera de Expo Go (como app instalada), hay que generar una compilación con EAS Build.

---

Modelo acústico: Edge Impulse #1134969 (*Faro_Pesquero_IA*). Desarrollado para la Asociación de Pescadores Artesanales José Olaya Balandra de Chorrillos.
