# Primeros pasos, sin programar

*Esta es una traducción; si difiere de la [versión en inglés](../../guide/getting-started.md), la versión en inglés es la que está al día.*

Esta guía es para social media managers y creadores que nunca han usado una terminal. Vas a hablar con Claude en su app de escritorio, y unfaced convierte lo que le pides en videos verticales terminados, carruseles y otras publicaciones, en tu computadora.

**Otros idiomas:** [English](../../guide/getting-started.md) · [Italiano](../it/getting-started.md) · Español · [Français](../fr/getting-started.md) · [Português (Brasil)](../pt-BR/getting-started.md)

## Qué necesitas

- Un **plan de pago de Claude**: Pro, Max, Team o Enterprise (Claude Code no está incluido en el plan gratuito). unfaced en sí es gratis y no necesita ninguna otra cuenta ni API key.
- Una **computadora con Windows o macOS** con unos 2 GB libres. No hace falta tarjeta gráfica.
- Conexión a internet. El primer video también descarga el motor de video de unfaced (alrededor de 1 GB).

Hacer un video es una conversación larga para Claude, así que consume más de los límites de tu plan que un chat normal. Si llegas a un límite, espera a que se restablezca y sigue donde lo dejaste.

## 1. Instala tres programas

1. **La app de escritorio de Claude**: descárgala desde [claude.ai/download](https://claude.ai/download), instálala e inicia sesión.
2. **Node.js**: descarga la versión **LTS** desde [nodejs.org](https://nodejs.org) e instálala con las opciones predeterminadas. El motor de video de unfaced funciona sobre Node.js (versión 22 o posterior).
3. **Git**:
   - Windows: descárgalo desde [git-scm.com](https://git-scm.com/downloads/win) e instálalo con las opciones predeterminadas.
   - macOS: abre la app Terminal, escribe `git --version` y pulsa Enter. Si falta git, macOS te ofrece instalarlo: acepta.

Si la app de Claude estaba abierta mientras instalabas Node.js o Git, ciérrala y vuelve a abrirla.

## 2. Crea una carpeta para tus páginas

Crea una carpeta vacía, por ejemplo `Documents/my-pages`. Todas las páginas que gestiones, con sus videos, vivirán dentro de ella.

## 3. Abre la carpeta en Claude

1. En la app de escritorio de Claude, abre la pestaña **Code**.
2. Debajo del cuadro de mensajes, elige el entorno **Local** (en Windows, no WSL: ahí los plugins no se cargan).
3. Haz clic en el selector de carpetas que está al lado, elige **Open folder…** y selecciona tu carpeta `my-pages`.

## 4. Añade unfaced

1. Haz clic en **+** junto al cuadro de mensajes y luego en **Plugins** → **Browse plugins**.
2. Haz clic en la flecha junto a **+ Add** (arriba a la derecha) y elige **Add marketplace**.
3. Escribe `dodoshell/unfaced` y confirma.
4. **unfaced** aparece en la lista: haz clic en **Add to this computer**.

**Si tu app no tiene Add marketplace**, hazlo en su lugar una sola vez desde una terminal (la app lee la misma configuración):

1. Abre **PowerShell** (Windows: menú Inicio, escribe PowerShell) o **Terminal** (macOS).
2. Instala la línea de comandos de Claude Code pegando esta línea y pulsando Enter:
   - Windows: `irm https://claude.ai/install.ps1 | iex`
   - macOS: `curl -fsSL https://claude.ai/install.sh | bash`
3. Después pega estas dos líneas, una por una:

   ```text
   claude plugin marketplace add dodoshell/unfaced
   claude plugin install unfaced@unfaced
   ```

Inicia una sesión nueva en la pestaña Code: unfaced ya está listo. Anthropic no revisa los plugins que se añaden de esta forma; unfaced es open source, así que cualquiera puede leer lo que hace.

## 5. Tu primera página

Escríbele a Claude como le escribirías a un compañero de trabajo:

> Crea una página faceless de TikTok sobre datos sorprendentes de gatos, en español. Elige tú el estilo.

La primera vez, unfaced instala su motor de video (alrededor de 1 GB). Claude te avisa antes de empezar; tarda varios minutos. Claude también te pide permiso antes de ejecutar comandos o escribir archivos: permítelo para esta carpeta.

Después, paso a paso:

| Tú dices | Obtienes |
|---|---|
| "Dame ideas para la próxima semana" | Diez ideas verificadas, algunas series y un calendario de publicación en `ideas.md` |
| "¿Cómo debería hacer la primera?" | Dos o tres formas de hacerla, con un gancho de ejemplo para cada una |
| "Hazlo" | Primero un guion para aprobar y luego el video terminado, revisado automáticamente y por un agente revisor independiente |
| "Déjalo listo para publicar" | Una imagen de portada y los textos, hashtags y títulos para cada plataforma |
| "Aquí tienes mis números, ¿qué debería cambiar?" | Como máximo tres cambios, cada uno con los números que lo respaldan y una forma de ponerlo a prueba |

### Tu primer carrusel

Si la página es de un negocio o una marca, pide una publicación:

> Haz un carrusel sobre nuestros tres servicios, con un tono directo y cercano.

La primera vez, Claude te pregunta el handle y el tono de la página (o los saca de capturas de tu perfil, si compartes algunas), escribe el texto diapositiva por diapositiva y **se detiene para que lo apruebes**. Después recibes una imagen por diapositiva, una `grid.png` para verlas todas juntas y, para LinkedIn, un PDF. Basta con decir para qué sirve la publicación y Claude elige el formato: una publicación de Instagram para deslizar, una imagen suelta, un PDF para LinkedIn o una historia. Por ahora las publicaciones usan el estilo 13 Night tech; los demás estilos solo hacen videos.

Las voces gratuitas hablan inglés, italiano, español, francés, portugués e hindi. Para otros idiomas, los videos usan solo texto en pantalla, o una voz de pago si tienes una.

## Dónde están tus videos

Todo es un archivo dentro de tu carpeta:

```text
my-pages/
  curious-cats/
    page.yaml            las opciones de la página: estilo, voz, ganchos...
    ideas.md             las ideas y el calendario
    videos/
      why-cats-purr/
        script.md        el guion que apruebas
        video.mp4        el video para publicar
        cover.png        la portada
        post.md          textos y hashtags
    posts/
      nuestros-servicios/
        slides.md        el texto que apruebas
        slide-01.png ... las diapositivas para publicar (post.pdf para LinkedIn)
        grid.png         todas las diapositivas juntas
        post.md          textos, hashtags y textos alternativos
```

unfaced nunca publica nada: tú subes el video o las diapositivas, o lo haces con tu herramienta habitual de programación de publicaciones.

## Si algo sale mal

- **No se encuentra "node" o "git":** instálalo (paso 1) y luego cierra y vuelve a abrir la app de Claude.
- **Claude no parece conocer unfaced:** comprueba que la sesión sea **Local** y no WSL, e inicia una sesión nueva después de añadir el plugin.
- **Cualquier otra cosa:** pídele a Claude que "ejecute unfaced doctor". Te dice qué falta en la instalación y cómo arreglarlo.
- ¿Sigues atascado? [Abre un issue](https://github.com/dodoshell/unfaced/issues) y describe qué pediste y qué pasó.
