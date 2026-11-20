# Primeiros passos, sem programar

*Esta é uma tradução; se ela for diferente da [versão em inglês](../../guide/getting-started.md), vale a versão em inglês, que está sempre atualizada.*

Este guia é para social media managers e criadores de conteúdo que nunca usaram um terminal. Você vai conversar com o Claude no app para desktop, e o unfaced transforma o que você pede em vídeos verticais prontos, carrosséis e outros posts, direto no seu computador.

**Outros idiomas:** [English](../../guide/getting-started.md) · [Italiano](../it/getting-started.md) · [Español](../es/getting-started.md) · [Français](../fr/getting-started.md) · Português (Brasil)

## Do que você precisa

- Um **plano pago do Claude**: Pro, Max, Team ou Enterprise (o Claude Code não está no plano gratuito). O unfaced em si é gratuito e não precisa de nenhuma outra conta nem chave de API.
- Um **computador com Windows ou macOS** com cerca de 2 GB livres. Não precisa de placa de vídeo.
- Conexão com a internet. O primeiro vídeo também baixa o motor de vídeo do unfaced (cerca de 1 GB).

Fazer um vídeo é uma conversa longa para o Claude, então ela consome mais dos limites do seu plano do que um chat comum. Quando você atingir um limite, espere ele ser renovado e continue de onde parou.

## 1. Instale três programas

1. **O app do Claude para desktop**: baixe em [claude.ai/download](https://claude.ai/download), instale e faça login.
2. **Node.js**: baixe a versão **LTS** em [nodejs.org](https://nodejs.org) e instale com as opções padrão. O motor de vídeo do unfaced roda nele (versão 22 ou mais recente).
3. **Git**:
   - Windows: baixe em [git-scm.com](https://git-scm.com/downloads/win) e instale com as opções padrão.
   - macOS: abra o app Terminal, digite `git --version` e aperte Enter. Se o git não estiver instalado, o macOS oferece a instalação: aceite.

Se o app do Claude estava aberto enquanto você instalava o Node.js ou o Git, feche e abra de novo.

## 2. Crie uma pasta para as suas páginas

Crie uma pasta vazia, por exemplo `Documents/my-pages`. Todas as páginas que você gerenciar, com os vídeos delas, vão ficar ali dentro.

## 3. Abra a pasta no Claude

1. No app do Claude para desktop, abra a aba **Code**.
2. Embaixo da caixa de mensagem, escolha o ambiente **Local** (no Windows, não use WSL: os plugins não carregam lá).
3. Clique no seletor de pasta ao lado, escolha **Open folder…** e selecione a sua pasta `my-pages`.

## 4. Adicione o unfaced

1. Clique no **+** ao lado da caixa de mensagem e depois em **Plugins** → **Browse plugins**.
2. Clique na seta ao lado de **+ Add** (no canto superior direito) e escolha **Add marketplace**.
3. Digite `dodoshell/unfaced` e confirme.
4. O **unfaced** aparece na lista: clique em **Add to this computer**.

**Se o seu app não tiver Add marketplace**, faça isso uma vez pelo terminal, em vez disso (o app lê as mesmas configurações):

1. Abra o **PowerShell** (Windows: menu Iniciar, digite PowerShell) ou o **Terminal** (macOS).
2. Instale a linha de comando do Claude Code colando esta linha e apertando Enter:
   - Windows: `irm https://claude.ai/install.ps1 | iex`
   - macOS: `curl -fsSL https://claude.ai/install.sh | bash`
3. Depois cole estas duas linhas, uma de cada vez:

   ```text
   claude plugin marketplace add dodoshell/unfaced
   claude plugin install unfaced@unfaced
   ```

Comece uma nova sessão na aba Code: o unfaced está pronto. Plugins adicionados desse jeito não são revisados pela Anthropic; o unfaced é open source, então qualquer pessoa pode ler o que ele faz.

## 5. A sua primeira página

Escreva para o Claude como você escreveria para um colega:

> Comece uma página faceless no TikTok sobre curiosidades surpreendentes de gatos, em português. Você escolhe o estilo.

Na primeira vez, o unfaced instala o motor de vídeo (cerca de 1 GB). O Claude avisa antes de começar; leva alguns minutos. O Claude também pede a sua permissão antes de rodar comandos ou escrever arquivos: autorize para esta pasta.

Depois, um passo de cada vez:

| Você diz | Você recebe |
|---|---|
| "Me dá ideias para a semana que vem" | Dez ideias verificadas, algumas séries e um calendário de postagens no `ideas.md` |
| "Como eu faço a primeira?" | Duas ou três formas de fazer, com um exemplo de gancho para cada uma |
| "Pode fazer" | Primeiro um roteiro para você aprovar, depois o vídeo pronto, verificado automaticamente e por um agente revisor independente |
| "Deixa pronto para postar" | Uma imagem de capa e as legendas, hashtags e títulos para cada plataforma |
| "Aqui estão os meus números, o que eu devo mudar?" | No máximo três mudanças, cada uma com os números que a justificam e um jeito de testar |

### Seu primeiro carrossel

Se a página é de uma empresa ou de uma marca, peça um post:

> Faça um carrossel sobre os nossos três serviços, num tom direto e simpático.

Na primeira vez, o Claude pergunta o handle e o tom da página (ou tira os dois de prints do seu perfil, se você compartilhar alguns), escreve o texto slide por slide e **para e espera a sua aprovação**. Depois você recebe uma imagem por slide, uma `grid.png` para ver todos lado a lado e, para o LinkedIn, um PDF. Diga para que serve o post e o Claude escolhe o formato: um post de Instagram de deslizar, uma imagem única, um PDF para o LinkedIn ou um story. Por enquanto os posts usam o estilo 13 Night tech; os outros estilos só fazem vídeos.

As vozes gratuitas falam inglês, italiano, espanhol, francês, português e hindi. Para outros idiomas, os vídeos usam só texto na tela, ou uma voz paga se você tiver uma.

## Onde ficam os seus vídeos

Tudo é um arquivo na sua pasta:

```text
my-pages/
  curious-cats/
    page.yaml            as escolhas da página: estilo, voz, ganchos...
    ideas.md             as ideias e o calendário
    videos/
      why-cats-purr/
        script.md        o roteiro que você aprova
        video.mp4        o vídeo para postar
        cover.png        a capa
        post.md          legendas e hashtags
    posts/
      nossos-servicos/
        slides.md        o texto que você aprova
        slide-01.png ... os slides para postar (post.pdf para o LinkedIn)
        grid.png         todos os slides lado a lado
        post.md          legendas, hashtags e textos alternativos
```

O unfaced nunca posta nada: você sobe o vídeo ou os slides por conta própria, ou com a sua ferramenta de agendamento de sempre.

## Se algo der errado

- **"node" ou "git" não encontrado:** instale (passo 1) e depois feche e abra de novo o app do Claude.
- **O Claude parece não conhecer o unfaced:** confira se a sessão está em **Local** e não em WSL, e comece uma nova sessão depois de adicionar o plugin.
- **Qualquer outra coisa:** peça para o Claude "rodar o unfaced doctor". Ele lista o que está faltando na instalação e como resolver.
- Ainda travado? [Abra uma issue](https://github.com/dodoshell/unfaced/issues) e descreva o que você pediu e o que aconteceu.
