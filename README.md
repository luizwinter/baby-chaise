# A Aventura do Baby Chá - Karina & Junior

Jogo web estilo 16-bit para o chá de bebê. Roda em qualquer navegador de
celular, sem instalar nada. Registro com nome + foto, 8 fases contando a
história do casal, ranking geral em tempo real via Firebase.

## 1. Testar localmente (opcional)

Não dá pra abrir `index.html` direto clicando duas vezes (o navegador
bloqueia alguns recursos). Rode um servidor simples:

```
cd babyshower-game
python3 -m http.server 8080
```

Depois abra `http://localhost:8080` no navegador. Sem configurar o
Firebase (passo 2), o jogo funciona normalmente, só o envio pro ranking
vai falhar (aparece uma mensagem de erro na tela de resultado, sem
travar o jogo).

## 2. Configurar o Firebase (ranking em tempo real - grátis)

1. Acesse https://console.firebase.google.com e crie um projeto novo
   (pode ser qualquer nome, ex: "cha-de-bebe-karina-junior").
2. No menu lateral, vá em **Build > Firestore Database** e clique em
   **Criar banco de dados**. Escolha qualquer região próxima (ex:
   `southamerica-east1`) e modo de **produção**.
3. Vá na aba **Regras** do Firestore e substitua tudo por:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /players/{playerId} {
         allow read, write: if true;
       }
       match /config/{doc} {
         allow read, write: if true;
       }
     }
   }
   ```

   > Isso deixa o banco aberto para simplificar, já que é um uso único
   > e privado (o link só vai para os convidados). Depois do evento,
   > você pode apagar o projeto inteiro no Firebase.

4. Clique em **Publicar** nas regras.
5. Vá em **Configurações do projeto** (ícone de engrenagem, canto
   superior esquerdo) > role até **Seus apps** > clique no ícone
   `</>` (Web) para registrar um app.
6. Copie o objeto `firebaseConfig` que aparece.
7. Abra o arquivo `firebase-config.js` neste projeto e substitua o
   objeto de exemplo pelo que você copiou.

## 3. Subir no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser público).
2. Suba todos os arquivos desta pasta (`index.html`, `style.css`,
   `game.js`, `firebase-config.js`) na raiz do repositório.
3. Vá em **Settings > Pages** do repositório.
4. Em "Source", escolha a branch `main` e a pasta `/ (root)`. Salve.
5. Em alguns minutos, o GitHub mostra o link do site, algo como:
   `https://seu-usuario.github.io/nome-do-repo/`

## 4. Gerar o QR Code

Com o link do GitHub Pages em mãos, gere um QR code gratuito em:
`https://www.qrserver.com/` (ou qualquer gerador de QR code) colando
a URL do passo anterior. Imprima ou mostre na tela do evento.

## 5. No dia do evento

- Os convidados escaneiam o QR code, se registram com nome + foto, e
  jogam as 8 fases (leva de 5 a 10 minutos).
- No final, cada um vê sua pontuação e pode abrir o ranking geral.
- **Painel do anfitrião**: acesse o mesmo link adicionando
  `?admin=1` no final (ex: `https://seu-link/?admin=1`). Lá você
  define se é Timothy ou Luna assim que revelar o sexo do bebê, e o
  ranking passa a mostrar 🎉 do lado de quem acertou.
- Para não conflitar com os jogadores, acesse o painel admin só na
  hora da revelação (ou use o celular do anfitrião separadamente).

## Estrutura de arquivos

```
index.html          -> telas do jogo (registro, fases, resultado, ranking, admin)
style.css            -> visual 16-bit / SNES
game.js              -> toda a lógica das 8 fases + Firebase
firebase-config.js   -> suas chaves do Firebase (editar aqui)
```

## Ajustando depois

- **Pontuação**: os valores de pontos de cada fase estão nas funções
  `runPhase1` a `runPhase7` dentro de `game.js` (procure por
  `addScore(...)`). Fácil de calibrar depois de testar com o grupo.
- **Textos da história**: estão todos juntos no array `PHASES`, perto
  do final do `game.js`.
- **Cores/fontes**: tudo centralizado em `style.css`, no topo (bloco
  `:root`).
