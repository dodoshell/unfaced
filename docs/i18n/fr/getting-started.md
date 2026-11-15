# Bien démarrer, sans coder

*Ceci est une traduction ; en cas de différence avec [la version anglaise](../../guide/getting-started.md), c'est la version anglaise qui fait foi.*

Ce guide s'adresse aux social media managers et aux créateurs qui n'ont jamais utilisé de terminal. Vous allez discuter avec Claude dans son application de bureau, et unfaced transforme vos demandes en vidéos verticales terminées, directement sur votre ordinateur.

**Autres langues :** [English](../../guide/getting-started.md) · [Italiano](../it/getting-started.md) · [Español](../es/getting-started.md) · Français · [Português (Brasil)](../pt-BR/getting-started.md)

## Ce qu'il vous faut

- Un **abonnement Claude payant** : Pro, Max, Team ou Enterprise (Claude Code n'est pas inclus dans l'offre gratuite). unfaced lui-même est gratuit et ne demande aucun autre compte ni clé API.
- Un **ordinateur Windows ou macOS** avec environ 2 Go d'espace libre. Pas besoin de carte graphique.
- Une connexion Internet. La première vidéo télécharge aussi le moteur vidéo d'unfaced (environ 1 Go).

Réaliser une vidéo représente une longue conversation pour Claude : elle consomme donc davantage les limites de votre abonnement qu'un simple échange. Si vous atteignez une limite, attendez qu'elle se réinitialise et reprenez là où vous en étiez.

## 1. Installez trois programmes

1. **L'application de bureau Claude** : téléchargez-la sur [claude.ai/download](https://claude.ai/download), installez-la et connectez-vous.
2. **Node.js** : téléchargez la version **LTS** sur [nodejs.org](https://nodejs.org) et installez-la avec les options par défaut. Le moteur vidéo d'unfaced fonctionne grâce à lui (version 22 ou plus récente).
3. **Git** :
   - Windows : téléchargez-le sur [git-scm.com](https://git-scm.com/downloads/win) et installez-le avec les options par défaut.
   - macOS : ouvrez l'application Terminal, tapez `git --version` et appuyez sur Entrée. Si git n'est pas installé, macOS vous propose de l'installer : acceptez.

Si l'application Claude était ouverte pendant l'installation de Node.js ou de Git, fermez-la puis rouvrez-la.

## 2. Créez un dossier pour vos pages

Créez un dossier vide, par exemple `Documents/my-pages`. Chaque page que vous gérez, avec ses vidéos, y sera rangée.

## 3. Ouvrez le dossier dans Claude

1. Dans l'application de bureau Claude, ouvrez l'onglet **Code**.
2. Sous la zone de message, choisissez l'environnement **Local** (sous Windows, pas WSL : les plugins ne s'y chargent pas).
3. Cliquez sur le sélecteur de dossier juste à côté, choisissez **Open folder…** et sélectionnez votre dossier `my-pages`.

## 4. Ajoutez unfaced

**Dans l'application :** cliquez sur **+** à côté de la zone de message, puis sur **Plugins**. Si vous pouvez y ajouter une marketplace, ajoutez `dodoshell/unfaced` et installez **unfaced**.

**Si l'application ne le propose pas**, faites-le une seule fois depuis un terminal (l'application lit les mêmes réglages) :

1. Ouvrez **PowerShell** (Windows : menu Démarrer, tapez PowerShell) ou **Terminal** (macOS).
2. Installez la ligne de commande de Claude Code en collant cette ligne puis en appuyant sur Entrée :
   - Windows : `irm https://claude.ai/install.ps1 | iex`
   - macOS : `curl -fsSL https://claude.ai/install.sh | bash`
3. Collez ensuite ces deux lignes, l'une après l'autre :

   ```text
   claude plugin marketplace add dodoshell/unfaced
   claude plugin install unfaced@unfaced
   ```

Démarrez une nouvelle session dans l'onglet Code : unfaced est prêt. Les plugins ajoutés de cette façon ne sont pas vérifiés par Anthropic ; unfaced est open source, donc tout le monde peut lire ce qu'il fait.

## 5. Votre première page

Écrivez à Claude comme vous le feriez à un collègue :

> Crée une page sur des faits étonnants sur les chats, en français. Choisis le style.

La première fois, unfaced installe son moteur vidéo (environ 1 Go). Claude vous prévient avant de commencer ; cela prend plusieurs minutes. Claude vous demande aussi l'autorisation avant de lancer des commandes ou d'écrire des fichiers : autorisez-les pour ce dossier.

Ensuite, étape par étape :

| Vous dites | Vous obtenez |
|---|---|
| « Donne-moi des idées pour la semaine prochaine » | Dix idées vérifiées, quelques séries et un calendrier de publication dans `ideas.md` |
| « Comment je devrais faire la première ? » | Deux ou trois façons de la réaliser, avec un exemple de hook pour chacune |
| « Fais-la » | D'abord un script à valider, puis la vidéo terminée, vérifiée automatiquement et par un agent relecteur indépendant |
| « Prépare-la pour la publication » | Une image de couverture, ainsi que les légendes, hashtags et titres pour chaque plateforme |
| « Voici mes chiffres, qu'est-ce que je devrais changer ? » | Au maximum trois changements, chacun avec les chiffres qui le justifient et une façon de le tester |

Les voix gratuites parlent anglais, italien, espagnol, français, portugais et hindi. Pour les autres langues, les vidéos utilisent uniquement du texte à l'écran, ou une voix payante si vous en avez une.

## Où se trouvent vos vidéos

Tout est sous forme de fichiers dans votre dossier :

```text
my-pages/
  curious-cats/
    page.yaml            les choix de la page : style, voix, hooks...
    ideas.md             les idées et le calendrier
    videos/
      why-cats-purr/
        script.md        le script que vous validez
        video.mp4        la vidéo à publier
        cover.png        la couverture
        post.md          légendes et hashtags
```

unfaced ne publie jamais rien : c'est vous qui mettez la vidéo en ligne, vous-même ou avec votre outil de planification habituel.

## En cas de problème

- **« node » ou « git » introuvable :** installez-le (étape 1), puis fermez et rouvrez l'application Claude.
- **Claude ne semble pas connaître unfaced :** vérifiez que la session est en **Local** et non en WSL, et démarrez une nouvelle session après avoir ajouté le plugin.
- **Tout autre problème :** demandez à Claude de « lancer unfaced doctor ». Il liste ce qui manque à l'installation et comment y remédier.
- Toujours bloqué ? [Ouvrez une issue](https://github.com/dodoshell/unfaced/issues) en décrivant ce que vous avez demandé et ce qui s'est passé.
