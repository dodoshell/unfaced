# Getting started, no coding needed

This guide is for social media managers and creators who have never used a terminal. You will talk to Claude in its desktop app, and unfaced turns what you ask into finished vertical videos, and carousels and other posts, on your computer.

**Read this in:** English · [Italiano](../i18n/it/getting-started.md) · [Español](../i18n/es/getting-started.md) · [Français](../i18n/fr/getting-started.md) · [Português (Brasil)](../i18n/pt-BR/getting-started.md)

## What you need

- A **paid Claude plan**: Pro, Max, Team or Enterprise (Claude Code is not in the free plan). unfaced itself is free and needs no other account or API key.
- A **Windows or macOS computer** with about 2 GB free. No graphics card needed.
- An internet connection. The first video also downloads unfaced's video engine (about 1 GB).

Making a video is a long conversation for Claude, so it uses more of your plan's limits than a chat does. When you hit a limit, wait for it to reset and continue where you were.

## 1. Install three programs

1. **The Claude desktop app**: download it from [claude.ai/download](https://claude.ai/download), install it and sign in.
2. **Node.js**: download the **LTS** version from [nodejs.org](https://nodejs.org) and install it with the default options. unfaced's video engine runs on it (version 22 or newer).
3. **Git**:
   - Windows: download it from [git-scm.com](https://git-scm.com/downloads/win) and install it with the default options.
   - macOS: open the Terminal app, type `git --version` and press Enter. If git is missing, macOS offers to install it: accept.

If the Claude app was open while you installed Node.js or Git, close it and open it again.

## 2. Make a folder for your pages

Create an empty folder, for example `Documents/my-pages`. Every page you run, with its videos, will live inside it.

## 3. Open the folder in Claude

1. In the Claude desktop app, open the **Code** tab.
2. Under the message box, choose the **Local** environment (on Windows, not WSL: plugins don't load there).
3. Click the folder selector next to it, choose **Open folder…** and pick your `my-pages` folder.

## 4. Add unfaced

1. Click **+** next to the message box, then **Plugins** → **Browse plugins**.
2. Click the arrow next to **+ Add** (top right) and choose **Add marketplace**.
3. Type `dodoshell/unfaced` and confirm.
4. **unfaced** appears in the list: click **Add to this computer**.

**If your app has no Add marketplace**, do it once from a terminal instead (the app reads the same settings):

1. Open **PowerShell** (Windows: Start menu, type PowerShell) or **Terminal** (macOS).
2. Install Claude Code's command line by pasting this line and pressing Enter:
   - Windows: `irm https://claude.ai/install.ps1 | iex`
   - macOS: `curl -fsSL https://claude.ai/install.sh | bash`
3. Then paste these two lines, one at a time:

   ```text
   claude plugin marketplace add dodoshell/unfaced
   claude plugin install unfaced@unfaced
   ```

Start a new session in the Code tab: unfaced is ready. Plugins added this way are not reviewed by Anthropic; unfaced is open source, so anyone can read what it does.

## 5. Your first page

Write to Claude as you would to a colleague:

> Start a faceless TikTok page about surprising cat facts, in English. You choose the style.

The first time, unfaced installs its video engine (about 1 GB). Claude tells you before it starts; it takes several minutes. Claude also asks your permission before running commands or writing files: allow them for this folder.

Then, one step at a time:

| You say | You get |
|---|---|
| "Give me ideas for next week" | Ten checked ideas, a few series and a posting calendar in `ideas.md` |
| "How should I make the first one?" | Two or three ways to make it, with a sample hook for each |
| "Make it" | A script to approve first, then the finished video, checked automatically and by an independent reviewer agent |
| "Get it ready to post" | A cover image and the captions, hashtags and titles for each platform |
| "Here are my numbers, what should I change?" | At most three changes, each with the numbers behind it and a way to test it |

### Your first carousel

If the page is for a business or a brand, ask for a post instead:

> Make a carousel about our three services, in a direct, friendly tone.

The first time, Claude asks for the page's handle and tone (or reads them from screenshots of your profile, if you share some), writes the text slide by slide and **stops for your approval**. Then you get one image per slide, a `grid.png` to see them side by side and, for LinkedIn, a PDF. Say what the post is for and Claude picks the format: a swipeable Instagram post, a single image, a LinkedIn PDF or a story. Posts use style 13 Night tech for now; the other styles make videos only.

Free voices speak English, Italian, Spanish, French, Portuguese and Hindi. For other languages the videos use on-screen text only, or a paid voice if you have one.

## Where your videos are

Everything is a file in your folder:

```text
my-pages/
  curious-cats/
    page.yaml            the page's choices: style, voice, hooks...
    ideas.md             ideas and the calendar
    videos/
      why-cats-purr/
        script.md        the script you approve
        video.mp4        the video to post
        cover.png        the cover
        post.md          captions and hashtags
    posts/
      our-services/
        slides.md        the text you approve
        slide-01.png ... the slides to post (post.pdf for LinkedIn)
        grid.png         all the slides side by side
        post.md          captions, hashtags and alt text
```

unfaced never posts anything: you upload the video or the slides yourself, or with your usual scheduling tool.

## If something goes wrong

- **"node" or "git" not found:** install it (step 1), then close and reopen the Claude app.
- **Claude doesn't seem to know unfaced:** check that the session is **Local** and not WSL, and start a new session after adding the plugin.
- **Anything else:** ask Claude to "run unfaced doctor". It lists what is missing from the install and how to fix it.
- Still stuck? [Open an issue](https://github.com/dodoshell/unfaced/issues) and describe what you asked and what happened.
