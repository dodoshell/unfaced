# unfaced

*Questa è una traduzione: se è diversa dalla [versione inglese](../../../README.md), fa fede quella inglese.*

**Crea e gestisci pagine social faceless con il tuo coding agent.**

**Leggi in:** [English](../../../README.md) · Italiano · [Español](../es/README.md) · [Français](../fr/README.md) · [Português (Brasil)](../pt-BR/README.md)

Scegli stili, tipi di script, hook e voci numerati, salvali in un profilo della pagina e trasforma idee di una riga in video verticali finiti per Reels, TikTok e Shorts, o in post statici (caroselli, immagini singole, PDF per LinkedIn, storie) con lo stile di un brand. Gratis di base; i servizi a pagamento sono facoltativi.

![La stessa scena in tutti e dodici gli stili](../../media/styles-grid.gif)

## Cosa puoi fare

Chiedilo al tuo agent, con parole tue:

| Tu dici | Cosa succede |
|---|---|
| "Apri una pagina TikTok faceless di curiosità sorprendenti sui gatti, in italiano" | **page-setup** ti fa qualche domanda (o sceglie tutto lui se dici "scegli tu"), scrive `page.yaml` partendo dai cataloghi numerati e può creare una mascotte che resta identica in ogni video. |
| "Dammi idee per la prossima settimana" | **video-ideas** scrive in `ideas.md` dieci idee verificate, due o tre serie ricorrenti e un calendario. Ogni idea dice se è un reel, un carosello o una storia, e perché. |
| "Come faccio quello sull'impastare?" | **video-recommend** ti propone 2–3 combinazioni (tipo di script, hook, finale, durata...) con un hook d'esempio per ciascuna. |
| "Fallo" | **video-make** fa le ricerche e scrive lo script, **si ferma per la tua approvazione**, poi registra la voce, disegna le scene, fa il render, lancia i controlli automatici e fa guardare ogni frame a un agent revisore indipendente prima di consegnarti `video.mp4`. |
| "Fai un carosello sui nostri tre servizi" | **post-make** scrive il testo slide per slide, **si ferma per la tua approvazione**, poi crea le slide (e un PDF per LinkedIn), lancia i controlli e fa guardare ogni slide a un agent revisore indipendente. |
| "Ecco gli screenshot del nostro profilo" | **page-setup** li legge e prepara una bozza del profilo della pagina, brand compreso (handle, colori, font, tono), poi ti chiede quello che non riesce a stabilire da solo. Non salva nulla finché non sei d'accordo. |
| "Preparalo per la pubblicazione" | **video-package** genera `cover.png` e scrive `post.md`: didascalie, hashtag e un titolo per ogni piattaforma. |
| "Ecco i miei numeri, cosa dovrei cambiare?" | **page-results** confronta i video in `results.md` per piattaforma e per ogni scelta fatta, e ti suggerisce al massimo tre modifiche, ognuna con un modo per testarla. |

unfaced non pubblica mai nulla. Crea dei file; a pubblicarli sei tu, o il tuo strumento di programmazione dei post.

## Installazione

**Non hai mai usato un terminale?** Segui [Per iniziare, senza scrivere codice](getting-started.md): l'app desktop di Claude, una cartella e qualche frase da scrivere a Claude.

**Claude Code** (supporto completo):

```text
/plugin marketplace add dodoshell/unfaced
/plugin install unfaced@unfaced
```

Il primo comando che ha bisogno del motore lo installa in `~/.unfaced/` (servono git, Node 22+ e circa 1 GB per il modello vocale, whisper e il browser di render).

**Altri agent** (al meglio delle possibilità): `npx skills add dodoshell/unfaced`. Le skill sono semplici istruzioni più un launcher Node; se un agent non ha i subagent, la revisione gira invece in una sessione nuova.

**Da un clone**: `npm run setup`, poi usa direttamente la CLI (vedi sotto). Le skill dentro il clone la usano già; per far puntare un plugin installato al tuo clone, imposta `UNFACED_LIB` sulla sua cartella.

## Cataloghi

Ogni voce è pronta all'uso. `unfaced list <kind>` elenca un catalogo, `unfaced show <kind> <number>` mostra la guida di una voce e `unfaced gallery` crea una pagina che le mostra tutte, con un poster per ogni stile.

| Catalogo | Voci |
|---|---|
| Stili (13) | 3D morbido, low poly anni '90, cartoon flat, line art, silhouette a inchiostro, lavagna, carta ritagliata, fumetto vintage, pixel art 16-bit, neon synthwave, acquerello, tipografia cinetica; più il 13 Night tech, che disegna i post (i video sono in arrivo) |
| Tipi di post (6) | consigli ed errori, come funziona, chi siamo, servizi e prezzi, prima e dopo, annuncio |
| Tipi di script (10) | costruiscilo, classifica top N, mito o realtà, e se..., una storia in 60 secondi, risposta sorprendente, come funziona, X contro Y, lo sapevi che, mini storia |
| Hook (15) | domanda scioccante, numero assurdo, "lo stai facendo male", immagine impossibile, POV, parti dal climax... ognuno con regole e tre esempi |
| Voci (8) | documentario calmo, energica, narratore, sussurro, impassibile, calda e amichevole, conduttore del TG, nessuna (solo testo) |
| Sottotitoli (6) | karaoke parola per parola, grassetto al centro, macchina da scrivere, sottopancia minimale, contorno pop, parola chiave evidenziata |
| Musica (8) | suspense, epica, lo-fi, allegra, giocosa, emozionante, mistero (tutte generate via codice, MIT), nessuna |
| Finali (6) | loop senza stacchi, cliffhanger, domanda nei commenti, segui per la parte 2, battuta finale, ritorno all'hook |
| Durate (4) | 15, 30, 45 e 60 secondi, con regole sul ritmo |

## Post

Un post è una cartella con un `slides.md`: il testo, slide per slide. unfaced lo impagina con lo stile e il brand della pagina e crea le slide in PNG, più un PDF per LinkedIn e una `grid.png` per vederle tutte affiancate.

![Un carosello nello stile 13 Night tech, slide per slide](../../media/posts-grid.png)

Indica il formato in base a cosa serve il post; la dimensione la conosce unfaced:

| Formato | Dimensione | Slide | Ottieni |
|---|---|---|---|
| `instagram-carousel` | 1080×1350 | da 2 a 10 | PNG |
| `instagram-post` | 1080×1350 (1080×1080 con `square: true`) | 1 | un PNG |
| `linkedin-carousel` | 1080×1350 | da 2 a 12 | un PDF, più i PNG |
| `story` | 1080×1920 | da 1 a 10 | PNG |

Lo stesso `slides.md` si può creare in più formati: l'impaginazione si adatta, il testo resta. Il brand della pagina (handle, sito, logo, font, tono, parole da usare e da evitare) compare nelle slide e guida ogni testo scritto dagli agent. Tipi di slide: cover, point, list, steps, compare, stat, quote, image, cta e custom, per una slide che ha bisogno di codice proprio. Vedi `unfaced docs slides` e `unfaced docs brand`.

Il 13 Night tech è il primo stile che disegna i post, con elementi grafici già pronti: chip, un flusso a passi, un telefono, una notifica e una piccola serie di icone. Gli stili da 1 a 12 per ora fanno solo video. Una pagina completa con un carosello: [`examples/pages/studio-nord/`](../../../examples/pages/studio-nord/).

## Esempi

- [`examples/pages/`](../../../examples/pages/): quattro pagine da copiare. *Studio Nord* (night tech, un piccolo studio web) ha un blocco brand e un carosello "chi siamo" in `posts/about-us/`. *Curious Cats* (cartoon flat, curiosità sui gatti) con due video già fatti: script, tempi delle parole, piani e risultati dei controlli, pronti per un nuovo render con `unfaced make`; *Space in 60* (neon synthwave, una grande idea sullo spazio al minuto, cliffhanger) e *Piccola Storia* (acquerello, in italiano: le piccole storie dietro parole e oggetti di tutti i giorni), ognuna con mascotte, idee e calendario.
- [`examples/combos/`](../../../examples/combos/): cinque video d'esempio di circa 30 secondi; nessuna coppia condivide stile, tipo di script, hook, voce, stile dei sottotitoli, mood musicale o finale. Script, piani e controlli sono qui; gli MP4 sono allegati a ogni release.
- [`examples/scripts/`](../../../examples/scripts/): uno `script.md` completo per ogni tipo di script.
- [`examples/hooks/`](../../../examples/hooks/): ogni hook con tre esempi da nicchie diverse. Il reel degli hook, con ogni hook recitato sopra lo stile successivo, è allegato a ogni release.

## Come funziona

- **Gratis e in locale**: `script.md` → voce (Kokoro, offline; inglese e italiano con supporto completo) → tempi delle parole (whisper.cpp) → scene precise al frame → musica mixata sotto la voce → un MP4 1080×1920 a 30 fps renderizzato con Remotion. Niente API key, niente GPU.
- **A pagamento solo se vuoi**: ElevenLabs per la voce, Pexels (con una chiave gratuita) per le foto stock, Replicate per immagini e clip generate (`unfaced generate`). Le chiavi vanno in `.env`, mai in `page.yaml`; senza chiave si usa la strada gratuita e unfaced te lo dice.
- **Un sistema di personaggi**: otto specie e dieci pose, con gli stessi movimenti in ogni stile, così la mascotte della pagina resta sempre coerente.
- **Scene su misura per il video**: quando un passaggio ha bisogno di un diagramma o di un momento preciso, l'agent scrive una piccola scena React apposta (`docs/formats/scenes.md`); per tutto il resto si usano le scene dello stile.
- **Due revisioni**: controlli automatici (testo sovrapposto, safe zone delle piattaforme, sottotitoli in sync con la voce entro 2 frame, frame neri o bloccati, volume, parole tagliate) e un agent revisore indipendente che vede solo i file, mai la conversazione che ha prodotto il video.

## La CLI

```bash
npm run unfaced -- page examples/pages/curious-cats            # check a page profile
npm run unfaced -- make examples/pages/curious-cats/videos/why-cats-purr
npm run unfaced -- frames examples/pages/curious-cats/videos/why-cats-purr --every 1s
npm run unfaced -- cover examples/pages/curious-cats/videos/why-cats-purr
npm run unfaced -- post examples/pages/studio-nord/posts/about-us      # render a carousel (--format <name> for one format)
npm run unfaced -- demo 13 --post                              # the sample post in a style
npm run unfaced -- results my-page                             # compare the posted videos' numbers (results.md)
npm run unfaced -- docs slides                                 # file formats: page, brand, script, slides, mascot, scenes, review, post, results
npm run unfaced -- list post-type                              # the post types
npm run unfaced -- doctor                                      # what is missing from the install
npm run unfaced -- help                                        # every command
```

Le skill e l'agent revisore hanno degli eval in [`evals/`](../../../evals/README.md), da lanciare con `claude plugin eval`.

## Una pagina sul disco

```text
my-page/
  page.yaml              the profile: language, niche, style, script types, voice, ...
  brand/                 optional: logo, fonts, and mascot/ (mascot.json, mascot.md, reference.png)
  ideas.md               ideas, series and the calendar
  results.md             how the posted videos did
  videos/
    why-cats-purr/
      script.md          hook, body beats, ending (docs/formats/script.md)
      scenes/            optional scene code for this video
      inbox/             optional images, clips or a voice-over you hand off
      video.mp4          made by unfaced make
      check.json         the automatic checks
      review.md          the independent review
      cover.png, post.md ready to post
  posts/
    about-us/
      slides.md          the text, slide by slide (docs/formats/slides.md)
      custom/, inbox/   optional slide code and photos
      slide-01.png ...   made by unfaced post (post.pdf for LinkedIn, grid.png, check.json)
      review.md, post.md the independent review; captions, hashtags and alt text
```

## Contribuire

Nuovi stili, tipi di script, tipi di post, tipi di slide e hook sono i benvenuti: leggi [`CONTRIBUTING.md`](../../../CONTRIBUTING.md).

## Licenza

MIT. Gli asset di terze parti mantengono le proprie licenze, elencate in [`LICENSES/`](../../../LICENSES/README.md).
Il render usa [Remotion](https://www.remotion.dev), gratuito per privati e aziende fino a tre persone; le aziende più grandi hanno bisogno di una [licenza Remotion](https://www.remotion.dev/license).
