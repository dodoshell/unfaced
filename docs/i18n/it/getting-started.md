# Per iniziare, senza scrivere codice

*Questa è una traduzione: se è diversa dalla [versione inglese](../../guide/getting-started.md), fa fede quella inglese.*

Questa guida è per social media manager e creator che non hanno mai usato un terminale. Parlerai con Claude nella sua app desktop e unfaced trasformerà quello che chiedi in video verticali finiti, direttamente sul tuo computer.

**In altre lingue:** [English](../../guide/getting-started.md) · Italiano · [Español](../es/getting-started.md) · [Français](../fr/getting-started.md) · [Português (Brasil)](../pt-BR/getting-started.md)

## Cosa ti serve

- Un **piano Claude a pagamento**: Pro, Max, Team o Enterprise (Claude Code non è incluso nel piano gratuito). unfaced in sé è gratis e non richiede altri account né API key.
- Un **computer Windows o macOS** con circa 2 GB liberi. Non serve una scheda grafica.
- Una connessione a internet. Il primo video scarica anche il motore video di unfaced (circa 1 GB).

Per Claude creare un video è una conversazione lunga, quindi consuma più limiti del tuo piano rispetto a una normale chat. Se raggiungi un limite, aspetta che si azzeri e riprendi da dove eri rimasto.

## 1. Installa tre programmi

1. **L'app desktop di Claude**: scaricala da [claude.ai/download](https://claude.ai/download), installala e accedi.
2. **Node.js**: scarica la versione **LTS** da [nodejs.org](https://nodejs.org) e installala con le opzioni predefinite. Il motore video di unfaced gira su Node.js (versione 22 o successiva).
3. **Git**:
   - Windows: scaricalo da [git-scm.com](https://git-scm.com/downloads/win) e installalo con le opzioni predefinite.
   - macOS: apri l'app Terminale, scrivi `git --version` e premi Invio. Se git manca, macOS ti propone di installarlo: accetta.

Se l'app di Claude era aperta mentre installavi Node.js o Git, chiudila e riaprila.

## 2. Crea una cartella per le tue pagine

Crea una cartella vuota, per esempio `Documents/my-pages`. Ogni pagina che gestisci, con i suoi video, starà lì dentro.

## 3. Apri la cartella in Claude

1. Nell'app desktop di Claude, apri la scheda **Code**.
2. Sotto la casella dei messaggi, scegli l'ambiente **Local** (su Windows, non WSL: lì i plugin non si caricano).
3. Clicca sul selettore di cartelle lì accanto, scegli **Open folder…** e seleziona la cartella `my-pages`.

## 4. Aggiungi unfaced

**Dall'app:** clicca **+** accanto alla casella dei messaggi, poi **Plugins**. Se lì puoi aggiungere un marketplace, aggiungi `dodoshell/unfaced` e installa **unfaced**.

**Se l'app non te lo permette**, fallo una volta sola da un terminale (l'app legge le stesse impostazioni):

1. Apri **PowerShell** (Windows: menu Start, scrivi PowerShell) o **Terminale** (macOS).
2. Installa la riga di comando di Claude Code incollando questa riga e premendo Invio:
   - Windows: `irm https://claude.ai/install.ps1 | iex`
   - macOS: `curl -fsSL https://claude.ai/install.sh | bash`
3. Poi incolla queste due righe, una alla volta:

   ```text
   claude plugin marketplace add dodoshell/unfaced
   claude plugin install unfaced@unfaced
   ```

Avvia una nuova sessione nella scheda Code: unfaced è pronto. I plugin aggiunti in questo modo non sono verificati da Anthropic; unfaced è open source, quindi chiunque può leggere cosa fa.

## 5. La tua prima pagina

Scrivi a Claude come scriveresti a un collega:

> Apri una pagina di curiosità sorprendenti sui gatti, in italiano. Lo stile sceglilo tu.

La prima volta unfaced installa il suo motore video (circa 1 GB). Claude te lo dice prima di iniziare; ci vogliono diversi minuti. Claude ti chiede anche il permesso prima di eseguire comandi o scrivere file: consentili per questa cartella.

Poi, un passo alla volta:

| Tu dici | Ottieni |
|---|---|
| "Dammi idee per la prossima settimana" | Dieci idee verificate, qualche serie e un calendario di pubblicazione in `ideas.md` |
| "Come faccio la prima?" | Due o tre modi per realizzarla, con un hook d'esempio per ciascuno |
| "Fallo" | Prima uno script da approvare, poi il video finito, controllato in automatico e da un agente revisore indipendente |
| "Preparalo per la pubblicazione" | Un'immagine di copertina più didascalie, hashtag e titoli per ogni piattaforma |
| "Ecco i miei numeri, cosa dovrei cambiare?" | Al massimo tre modifiche, ognuna con i numeri che la motivano e un modo per testarla |

Le voci gratuite parlano inglese, italiano, spagnolo, francese, portoghese e hindi. Per le altre lingue i video usano solo testo a schermo, oppure una voce a pagamento se ne hai una.

## Dove trovi i tuoi video

Tutto è un file nella tua cartella:

```text
my-pages/
  curious-cats/
    page.yaml            le scelte della pagina: stile, voce, hook...
    ideas.md             idee e calendario
    videos/
      why-cats-purr/
        script.md        lo script che approvi
        video.mp4        il video da pubblicare
        cover.png        la copertina
        post.md          didascalie e hashtag
```

unfaced non pubblica mai nulla: il video lo carichi tu, a mano o con il tuo solito strumento di programmazione dei post.

## Se qualcosa va storto

- **"node" o "git" non trovato:** installalo (passo 1), poi chiudi e riapri l'app di Claude.
- **Claude sembra non conoscere unfaced:** controlla che la sessione sia **Local** e non WSL, e avvia una nuova sessione dopo aver aggiunto il plugin.
- **Qualsiasi altra cosa:** chiedi a Claude di "eseguire unfaced doctor". Ti elenca cosa manca nell'installazione e come sistemarlo.
- Ancora bloccato? [Apri una issue](https://github.com/dodoshell/unfaced/issues) e descrivi cosa hai chiesto e cosa è successo.
