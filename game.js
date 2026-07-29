/* ============================================================
   A AVENTURA DO BABY CHÁ - Karina & Junior
   Motor principal do jogo
   ============================================================ */

/* ---------------- ESTADO GLOBAL ---------------- */
const player = { name: '', photo: null, score: 0, guess: null };
let phaseIndex = 0;
let cleanupCurrentPhase = null;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas(){
  const hud = document.querySelector('.hud');
  const hudH = hud ? hud.offsetHeight : 0;
  canvas.style.top = hudH + 'px';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - hudH;
}
window.addEventListener('resize', resizeCanvas);

/* ---------------- HELPERS ---------------- */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function getPos(evt){
  const rect = canvas.getBoundingClientRect();
  const t = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

function addTap(handler){
  const wrapped = (e) => { e.preventDefault(); handler(getPos(e)); };
  canvas.addEventListener('mousedown', wrapped);
  canvas.addEventListener('touchstart', wrapped, { passive:false });
  return () => {
    canvas.removeEventListener('mousedown', wrapped);
    canvas.removeEventListener('touchstart', wrapped);
  };
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function clearBg(color){
  ctx.fillStyle = color || '#10101f';
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function updateHud(instructions){
  document.getElementById('hud-phase').textContent = (phaseIndex+1);
  document.getElementById('hud-score').textContent = player.score;
  if (instructions) document.getElementById('hud-instructions').textContent = instructions;
}

function addScore(n){
  player.score = Math.max(0, player.score + n);
  document.getElementById('hud-score').textContent = player.score;
}

/* ---------------- IMAGENS (assets/) ---------------- */
const ASSET_PATHS = {
  icon_camisa: 'assets/icon_camisa.png',
  icon_billy: 'assets/icon_billy.png',
  icon_moto: 'assets/icon_moto.png',
  icon_alvo: 'assets/icon_alvo.png',
  icon_salao: 'assets/icon_salao.png',
  icon_coracao: 'assets/icon_coracao.png',
  sprite_alvo: 'assets/sprite_alvo.png',
  sprite_billy: 'assets/sprite_billy.png',
  sprite_moto: 'assets/sprite_moto.png',
  top_moto: 'assets/top_moto.png',
  top_buraco: 'assets/top_buraco.png',
  top_billy: 'assets/top_billy.png',
  top_rato_branco: 'assets/top_rato_branco.png',
  top_rato_cinza: 'assets/top_rato_cinza.png',
  top_dinheiro: 'assets/top_dinheiro.png',
  top_gasolina: 'assets/top_gasolina.png',
  sprite_cliente: 'assets/sprite_cliente.png',
  sprite_barbara: 'assets/sprite_barbara.png',
  sprite_arao: 'assets/sprite_arao.png',
  cena_carro: 'assets/cena_carro.png',
  cena_castelo: 'assets/cena_castelo.png',
  cena_anel: 'assets/cena_anel.png',
  cena_cerejeira: 'assets/cena_cerejeira.png',
  cena_casal_beijo: 'assets/cena_casal_beijo.png'
};
const IMAGES = {};
function preloadImages(){
  Object.keys(ASSET_PATHS).forEach(key=>{
    const img = new Image();
    img.src = ASSET_PATHS[key];
    IMAGES[key] = img;
  });
}
preloadImages();

// desenha uma imagem (sprite quadrado) centralizada em cx,cy com o tamanho "size"
function drawSprite(key, cx, cy, size){
  const img = IMAGES[key];
  if (img && img.complete && img.naturalWidth){
    ctx.drawImage(img, cx - size/2, cy - size/2, size, size);
  }
}

// desenha uma imagem "cobrindo" todo o canvas (como background-size:cover)
function drawCover(img, cw, ch){
  const ir = img.width / img.height, cr = cw / ch;
  let sw, sh, sx, sy;
  if (ir > cr){ sh = img.height; sw = sh*cr; sx = (img.width-sw)/2; sy = 0; }
  else { sw = img.width; sh = sw/cr; sx = 0; sy = (img.height-sh)/2; }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

// desenha uma cena de fundo em tela cheia + legenda na base (usado na cutscene da Fase 7)
function drawSceneImage(key, caption){
  const img = IMAGES[key];
  if (img && img.complete && img.naturalWidth){
    drawCover(img, canvas.width, canvas.height);
  } else {
    clearBg('#1a1a2e');
  }
  ctx.fillStyle = 'rgba(15,15,30,0.75)';
  ctx.fillRect(0, canvas.height-70, canvas.width, 70);
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffd460';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(caption, canvas.width/2, canvas.height-35);
  ctx.textBaseline = 'alphabetic';
}

/* ============================================================
   FASE 1 - IPNET: QUEM FAZIA O QUE
   ============================================================ */
const CARGO_CERTOS = [
  { id:'karina', label:'Analista de Marketing (Conteúdo)', pts:20 },
  { id:'junior', label:'Gerente de Projetos', pts:20 }
];
const CARGO_DECOYS = [
  'Analista de Cloud Infrastructure', 'Coordenador de RH', 'Engenheiro de DevOps',
  'Analista Financeiro', 'Product Owner', 'Consultor Google Workspace',
  'Técnico de Suporte N2', 'Analista de Marketing Performance',
  'Gerente de Contas Cloud', 'Recepcionista'
];

function shuffle(arr){ return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]); }

function runPhase1(done){
  updateHud('Toque nos 2 cargos certos!');
  let round = 0, totalRounds = 3, roundTimer = 0, badges = [], foundThisRound = 0;

  function newRound(){
    round++;
    foundThisRound = 0;
    const decoys = shuffle(CARGO_DECOYS).slice(0,4);
    const items = shuffle([...CARGO_CERTOS.map(c=>({...c,correct:true})), ...decoys.map(d=>({id:d,label:d,pts:-8,correct:false}))]);
    const cols = 2, rows = 3, padX = 20, padY = 16;
    const cellW = (canvas.width - padX*2) / cols;
    const cellH = (canvas.height - padY*2) / rows;
    badges = items.map((it,i)=>({
      ...it,
      x: padX + (i%cols)*cellW + 10,
      y: padY + Math.floor(i/cols)*cellH + 10,
      w: cellW - 20, h: cellH - 20,
      alive: true, bob: Math.random()*Math.PI*2
    }));
    roundTimer = 8000;
  }

  newRound();
  let last = performance.now();
  let raf;
  function loop(now){
    const dt = now - last; last = now;
    roundTimer -= dt;
    clearBg('#10101f');
    badges.forEach(b=>{
      if (!b.alive) return;
      b.bob += dt*0.003;
      const yOff = Math.sin(b.bob)*4;
      ctx.fillStyle = b.correct ? '#2e4a3a' : '#3a2e4a';
      roundRect(ctx, b.x, b.y+yOff, b.w, b.h, 8);
      ctx.fill();
      ctx.strokeStyle = b.correct ? '#4ecdc4' : '#ff6b9d';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#f4f1de';
      ctx.font = '14px VT323, monospace';
      ctx.textAlign = 'center';
      wrapText(b.label, b.x + b.w/2, b.y + b.h/2 + yOff, b.w - 16, 16);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd460';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('Rodada ' + round + '/' + totalRounds, 14, canvas.height - 14);

    if (roundTimer <= 0 || foundThisRound >= 2){
      if (round >= totalRounds){
        cancelAnimationFrame(raf);
        removeTap();
        done();
        return;
      } else {
        newRound();
      }
    }
    raf = requestAnimationFrame(loop);
  }

  function wrapText(text, cx, cy, maxWidth, lineHeight){
    const words = text.split(' ');
    let lines = [''];
    words.forEach(w=>{
      const test = (lines[lines.length-1] + ' ' + w).trim();
      if (ctx.measureText(test).width > maxWidth && lines[lines.length-1] !== ''){
        lines.push(w);
      } else {
        lines[lines.length-1] = test;
      }
    });
    const startY = cy - ((lines.length-1)*lineHeight)/2;
    lines.forEach((l,i)=> ctx.fillText(l, cx, startY + i*lineHeight));
  }

  const removeTap = addTap((pos)=>{
    for (const b of badges){
      if (!b.alive) continue;
      if (pos.x>=b.x && pos.x<=b.x+b.w && pos.y>=b.y && pos.y<=b.y+b.h){
        b.alive = false;
        addScore(b.pts);
        if (b.correct) foundThisRound++;
        break;
      }
    }
  });

  raf = requestAnimationFrame(loop);
  cleanupCurrentPhase = ()=>{ cancelAnimationFrame(raf); removeTap(); };
}

/* ============================================================
   FASE 2 - INSTAGRAM: MEMORY MATCH
   ============================================================ */
const MEMORY_ICONS = [
  {key:'icon_camisa', story:'Foi essa foto da camisa marrom que fez o Junior comentar!'},
  {key:'icon_billy', story:'Billy, o companheiro fiel da Karina, vai pra todo lugar com ela.'},
  {key:'icon_moto', story:'A Harley preta do Junior - paixão de duas rodas.'},
  {key:'icon_alvo', story:'O primeiro encontro foi em um stand de tiro esportivo!'},
  {key:'icon_salao', story:'Karina trabalha no salão cuidando de tudo na recepção.'},
  {key:'icon_coracao', story:'E assim começou uma história de amor.'}
];

function runPhase2(done){
  updateHud('Ache os pares!');
  const cards = shuffle([...MEMORY_ICONS, ...MEMORY_ICONS].map((c,i)=>({...c, uid:i})));
  const cols = 3, rows = 4, pad = 16;
  const cellW = (canvas.width - pad*2) / cols;
  const cellH = (canvas.height - pad*2) / rows;
  const grid = cards.map((c,i)=>({
    ...c, flipped:false, matched:false,
    x: pad + (i%cols)*cellW, y: pad + Math.floor(i/cols)*cellH,
    w: cellW - 10, h: cellH - 10
  }));
  let selected = [];
  let lock = false;
  let storyMsg = '', storyTimer = 0;

  function draw(){
    clearBg('#10101f');
    grid.forEach(c=>{
      ctx.fillStyle = c.matched ? '#1e3a2e' : '#2a2a45';
      roundRect(ctx, c.x, c.y, c.w, c.h, 8);
      ctx.fill();
      ctx.strokeStyle = c.matched ? '#4ecdc4' : '#6c5b9e';
      ctx.lineWidth = 3;
      ctx.stroke();
      if (c.flipped || c.matched){
        drawSprite(c.key, c.x + c.w/2, c.y + c.h/2, Math.min(c.w, c.h)*0.8);
      } else {
        ctx.fillStyle = '#ffd460';
        ctx.font = '20px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', c.x + c.w/2, c.y + c.h/2);
      }
    });
    ctx.textBaseline = 'alphabetic';
    if (storyTimer > 0){
      ctx.fillStyle = 'rgba(15,15,30,0.9)';
      ctx.fillRect(0, canvas.height-60, canvas.width, 60);
      ctx.fillStyle = '#f4f1de';
      ctx.font = '18px VT323, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(storyMsg, canvas.width/2, canvas.height-28);
      storyTimer -= 16;
    }
    raf = requestAnimationFrame(draw);
  }

  const removeTap = addTap((pos)=>{
    if (lock) return;
    for (const c of grid){
      if (c.matched || c.flipped) continue;
      if (pos.x>=c.x && pos.x<=c.x+c.w && pos.y>=c.y && pos.y<=c.y+c.h){
        c.flipped = true;
        selected.push(c);
        if (selected.length === 2){
          lock = true;
          setTimeout(()=>{
            const [a,b] = selected;
            if (a.key === b.key){
              a.matched = b.matched = true;
              addScore(15);
              storyMsg = MEMORY_ICONS.find(m=>m.key===a.key).story;
              storyTimer = 2600;
            } else {
              a.flipped = b.flipped = false;
              addScore(-3);
            }
            selected = [];
            lock = false;
            if (grid.every(g=>g.matched)){
              cancelAnimationFrame(raf);
              removeTap();
              done();
            }
          }, 700);
        }
        break;
      }
    }
  });

  let raf = requestAnimationFrame(draw);
  cleanupCurrentPhase = ()=>{ cancelAnimationFrame(raf); removeTap(); };
}

/* ============================================================
   FASE 3 - STAND DE TIRO
   ============================================================ */
function runPhase3(done){
  updateHud('Atire nos alvos, não no Billy nem na moto!');
  let timeLeft = 25000;
  let target = null;
  let effect = null; // {type, x, y, timer}
  let spawnTimer = 0;

  function spawnTarget(){
    const r = Math.random();
    const type = r < 0.7 ? 'target' : (r < 0.85 ? 'billy' : 'moto');
    target = {
      type,
      x: 40 + Math.random()*(canvas.width-80),
      y: 60 + Math.random()*(canvas.height-160),
      life: 1000
    };
  }

  let last = performance.now(), raf;
  function loop(now){
    const dt = now - last; last = now;
    timeLeft -= dt;
    spawnTimer -= dt;
    clearBg('#0d1420');

    if (!target && spawnTimer <= 0){ spawnTarget(); spawnTimer = 300; }
    if (target){
      target.life -= dt;
      const key = target.type === 'target' ? 'sprite_alvo' : (target.type === 'billy' ? 'sprite_billy' : 'sprite_moto');
      drawSprite(key, target.x, target.y, 76);
      if (target.life <= 0) target = null;
    }

    if (effect){
      effect.timer -= dt;
      ctx.font = '16px VT323, monospace';
      ctx.fillStyle = '#ff6b9d';
      ctx.textAlign='center';
      ctx.fillText(effect.msg, effect.x, effect.y - 30);
      if (effect.timer <= 0) effect = null;
    }

    ctx.fillStyle = '#ffd460';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Tempo: ' + Math.ceil(timeLeft/1000) + 's', 14, 30);

    if (timeLeft <= 0){
      cancelAnimationFrame(raf);
      removeTap();
      done();
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  const removeTap = addTap((pos)=>{
    if (!target) return;
    const dx = pos.x - target.x, dy = pos.y - target.y;
    if (Math.sqrt(dx*dx+dy*dy) < 40){
      if (target.type === 'target'){
        addScore(10);
      } else if (target.type === 'billy'){
        addScore(-15);
        effect = { msg:'Billy fugiu correndo!', x: target.x, y: target.y, timer: 900 };
      } else {
        addScore(-15);
        effect = { msg:'A moto quebrou! 💥', x: target.x, y: target.y, timer: 900 };
      }
      target = null;
    }
  });

  raf = requestAnimationFrame(loop);
  cleanupCurrentPhase = ()=>{ cancelAnimationFrame(raf); removeTap(); };
}

/* ============================================================
   FASE 4 - RODOVIA (visão de cima)
   ============================================================ */
function runPhase4(done){
  updateHud('Toque na esquerda/direita para desviar!');
  const lanes = 3;
  const laneW = () => canvas.width / lanes;
  let bikeLane = 1;
  let timeLeft = 60000;
  let items = [];
  let spawnTimer = 0;
  let flashTimer = 0;

  function spawn(){
    const r = Math.random();
    let type;
    if (r < 0.35) type = 'buraco';
    else if (r < 0.55) type = 'billy';
    else if (r < 0.7) type = 'rato_branco';
    else if (r < 0.82) type = 'rato_cinza';
    else if (r < 0.93) type = 'dinheiro';
    else type = 'gasolina';
    items.push({ type, lane: Math.floor(Math.random()*lanes), y: -60 });
  }

  const IMG_KEY = { buraco:'top_buraco', billy:'top_billy', rato_branco:'top_rato_branco', rato_cinza:'top_rato_cinza', dinheiro:'top_dinheiro', gasolina:'top_gasolina' };

  let last = performance.now(), raf;
  function loop(now){
    const dt = now - last; last = now;
    timeLeft -= dt;
    spawnTimer -= dt;
    clearBg('#2b2b2b');

    // pista
    ctx.strokeStyle = '#f4f1de';
    ctx.setLineDash([20,16]);
    ctx.lineWidth = 4;
    for (let i=1;i<lanes;i++){
      ctx.beginPath();
      ctx.moveTo(laneW()*i, 0);
      ctx.lineTo(laneW()*i, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (spawnTimer <= 0){ spawn(); spawnTimer = 550; }

    const speed = 0.25 * (canvas.height/400);
    items.forEach(it=> it.y += dt*speed);
    items = items.filter(it=>{
      if (it.y > canvas.height + 60) return false;
      const cx = laneW()*it.lane + laneW()/2;
      drawSprite(IMG_KEY[it.type], cx, it.y, 58);
      const bikeY = canvas.height - 90;
      if (it.lane === bikeLane && Math.abs(it.y - bikeY) < 40){
        if (it.type === 'dinheiro'){ addScore(10); return false; }
        if (it.type === 'gasolina'){ addScore(15); timeLeft += 1000; return false; }
        addScore(-10);
        flashTimer = 250;
        return false;
      }
      return true;
    });

    const bikeCx = laneW()*bikeLane + laneW()/2;
    const bikeY = canvas.height - 90;
    ctx.save();
    if (flashTimer > 0){ ctx.globalAlpha = 0.5 + 0.5*Math.sin(now*0.05); flashTimer -= dt; }
    drawSprite('top_moto', bikeCx, bikeY, 78);
    ctx.restore();

    ctx.fillStyle = '#ffd460';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign='left';
    ctx.fillText('Tempo: ' + Math.ceil(timeLeft/1000) + 's', 14, 30);

    if (timeLeft <= 0){
      cancelAnimationFrame(raf);
      removeTap();
      done();
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  const removeTap = addTap((pos)=>{
    if (pos.x < canvas.width/2){ bikeLane = Math.max(0, bikeLane-1); }
    else { bikeLane = Math.min(lanes-1, bikeLane+1); }
  });

  raf = requestAnimationFrame(loop);
  cleanupCurrentPhase = ()=>{ cancelAnimationFrame(raf); removeTap(); };
}

/* ============================================================
   FASE 5 - SALAO DE BELEZA
   ============================================================ */
function runPhase5(done){
  updateHud('Atenda os clientes, cuidado com a Bárbara!');
  let timeLeft = 30000;
  let spawnTimer = 0;
  let slots = [];

  function spawn(){
    const r = Math.random();
    let type = r < 0.72 ? 'cliente' : (r < 0.9 ? 'barbara' : 'arao');
    const x = 50 + Math.random()*(canvas.width-100);
    const y = 80 + Math.random()*(canvas.height-200);
    slots.push({ type, x, y, patience: type==='barbara' ? 1800 : 2400, max: type==='barbara'?1800:2400 });
  }

  let last = performance.now(), raf;
  function loop(now){
    const dt = now - last; last = now;
    timeLeft -= dt;
    spawnTimer -= dt;
    clearBg('#241a2e');

    if (spawnTimer <= 0 && slots.length < 3){ spawn(); spawnTimer = 900; }

    slots = slots.filter(s=>{
      s.patience -= dt;
      const key = s.type === 'cliente' ? 'sprite_cliente' : (s.type === 'barbara' ? 'sprite_barbara' : 'sprite_arao');
      drawSprite(key, s.x, s.y, 68);
      const pct = Math.max(0, s.patience/s.max);
      ctx.fillStyle = '#0f0f1e';
      ctx.fillRect(s.x-30, s.y+28, 60, 6);
      ctx.fillStyle = pct > 0.3 ? '#4ecdc4' : '#e63946';
      ctx.fillRect(s.x-30, s.y+28, 60*pct, 6);
      if (s.patience <= 0){
        if (s.type === 'barbara') addScore(-12);
        return false;
      }
      return true;
    });

    ctx.fillStyle = '#ffd460';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign='left';
    ctx.fillText('Tempo: ' + Math.ceil(timeLeft/1000) + 's', 14, 30);

    if (timeLeft <= 0){
      cancelAnimationFrame(raf);
      removeTap();
      done();
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  const removeTap = addTap((pos)=>{
    const i = slots.findIndex(s=>{
      const dx = pos.x-s.x, dy = pos.y-s.y;
      return Math.sqrt(dx*dx+dy*dy) < 36;
    });
    if (i === -1) return;
    const s = slots[i];
    const toRemove = new Set([i]);
    if (s.type === 'cliente') addScore(12);
    else if (s.type === 'barbara') addScore(4); // tocou a tempo, evita o desconto maior
    else if (s.type === 'arao'){
      addScore(8);
      const clienteIdx = slots.findIndex(c=>c.type==='cliente');
      if (clienteIdx > -1){ addScore(12); toRemove.add(clienteIdx); }
    }
    slots = slots.filter((_,idx)=> !toRemove.has(idx));
  });

  raf = requestAnimationFrame(loop);
  cleanupCurrentPhase = ()=>{ cancelAnimationFrame(raf); removeTap(); };
}

/* ============================================================
   FASE 6 - BOLICHE
   ============================================================ */
function runPhase6(done){
  updateHud('Toque para travar a mira!');
  const THROWS = 10;
  let throwIdx = 0;
  let stage = 'direction'; // direction -> power -> result
  let dirPos = 0, dirSpeed = 0.0022, dirDir = 1;
  let powPos = 0, powSpeed = 0.0026, powDir = 1;
  let lockedDir = null, lockedPow = null;
  let totalPins = 0;
  let resultTimer = 0, lastPins = 0;
  let flash = 0, flashTimer = 0;

  function currentPlayer(){ return throwIdx % 2 === 0 ? 'Karina' : 'Junior'; }
  function isEasy(kind){
    const p = currentPlayer();
    if (kind === 'direction') return p === 'Karina';
    return p === 'Junior';
  }

  let last = performance.now(), raf;
  function loop(now){
    const dt = now - last; last = now;
    clearBg('#1a1a2e');

    ctx.fillStyle = '#ffd460';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign='center';
    ctx.fillText('Arremesso ' + (throwIdx+1) + '/' + THROWS + ' - ' + currentPlayer(), canvas.width/2, 40);

    if (flashTimer > 0){
      flashTimer -= dt;
      ctx.fillStyle = 'rgba(255,255,255,' + (flashTimer/600*0.85) + ')';
      ctx.fillRect(0,0,canvas.width,canvas.height);
    }

    if (stage === 'direction' || stage === 'power'){
      const barY = canvas.height/2;
      const barW = canvas.width - 80;
      const barX = 40;
      ctx.fillStyle = '#0f0f1e';
      ctx.fillRect(barX, barY-10, barW, 20);
      const easy = isEasy(stage);
      const winW = easy ? barW*0.34 : barW*0.16;
      ctx.fillStyle = 'rgba(78,205,196,0.5)';
      ctx.fillRect(barX + barW/2 - winW/2, barY-10, winW, 20);

      if (stage === 'direction'){
        dirPos += dirSpeed*dt*dirDir;
        if (dirPos > 1 || dirPos < 0) dirDir *= -1;
        dirPos = Math.max(0,Math.min(1,dirPos));
        const cx = barX + dirPos*barW;
        ctx.fillStyle = '#ffd460';
        ctx.fillRect(cx-3, barY-16, 6, 32);
        ctx.fillStyle = '#f4f1de';
        ctx.font = '16px VT323, monospace';
        ctx.fillText('DIREÇÃO', canvas.width/2, barY-30);
      } else {
        powPos += powSpeed*dt*powDir;
        if (powPos > 1 || powPos < 0) powDir *= -1;
        powPos = Math.max(0,Math.min(1,powPos));
        const cx = barX + powPos*barW;
        ctx.fillStyle = '#ff6b9d';
        ctx.fillRect(cx-3, barY-16, 6, 32);
        ctx.fillStyle = '#f4f1de';
        ctx.font = '16px VT323, monospace';
        ctx.fillText('FORÇA', canvas.width/2, barY-30);
      }
    } else if (stage === 'result'){
      resultTimer -= dt;
      ctx.font = '40px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffd460';
      ctx.fillText(lastPins + ' pinos!', canvas.width/2, canvas.height/2);
      if (resultTimer <= 0){
        throwIdx++;
        if (throwIdx >= THROWS){
          cancelAnimationFrame(raf);
          removeTap();
          done();
          return;
        }
        stage = 'direction'; dirPos = 0; powPos = 0; lockedDir=null; lockedPow=null;
      }
    }

    // Bárbara flash aleatória
    flash -= dt;
    if (flash <= 0 && Math.random() < 0.003 && (stage==='direction'||stage==='power')){
      flashTimer = 600;
      flash = 4000;
    }

    raf = requestAnimationFrame(loop);
  }

  function computePins(dAcc, pAcc){
    const acc = (dAcc + pAcc) / 2; // 0 = perfeito, 1 = longe
    return Math.round(Math.max(0, 10 * (1 - acc)));
  }

  const removeTap = addTap(()=>{
    if (stage === 'direction'){
      lockedDir = Math.abs(dirPos - 0.5) / 0.5;
      stage = 'power';
    } else if (stage === 'power'){
      lockedPow = Math.abs(powPos - 0.5) / 0.5;
      lastPins = computePins(lockedDir, lockedPow);
      totalPins += lastPins;
      addScore(lastPins * 3);
      resultTimer = 1100;
      stage = 'result';
    }
  });

  raf = requestAnimationFrame(loop);
  cleanupCurrentPhase = ()=>{ cancelAnimationFrame(raf); removeTap(); };
}

/* ============================================================
   FASE 7 - PEDIDO DE CASAMENTO
   ============================================================ */
function runPhase7(done){
  updateHud('Suba a serra! Toque a seta certa.');
  const ARROWS = ['up','left','right'];
  const SEQ_LEN = 10;
  let seq = Array.from({length:SEQ_LEN}, ()=> ARROWS[Math.floor(Math.random()*3)]);
  let idx = 0;
  let progress = 0;
  let promptTimer = 0;
  let feedback = null;
  let phase = 'climb'; // climb -> cutscene
  let cutsceneStep = 0, cutsceneTimer = 0;

  const btnSize = 64;
  function buttons(){
    const y = canvas.height - 100;
    const cx = canvas.width/2;
    return {
      left: {x:cx-100-btnSize/2, y:y-btnSize/2, w:btnSize, h:btnSize, key:'left', icon:'←'},
      up: {x:cx-btnSize/2, y:y-btnSize/2-40, w:btnSize, h:btnSize, key:'up', icon:'↑'},
      right:{x:cx+100-btnSize/2, y:y-btnSize/2, w:btnSize, h:btnSize, key:'right', icon:'→'}
    };
  }

  function nextPrompt(){ promptTimer = 1400; }
  nextPrompt();

  let last = performance.now(), raf;
  function drawClimb(dt){
    clearBg('#1a1a2e');
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(30, 40, canvas.width-60, 14);
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(30, 40, (canvas.width-60)*progress, 14);

    ctx.font = '48px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🚗', 30 + (canvas.width-60)*progress, 90);

    const need = seq[idx];
    const btns = buttons();
    Object.values(btns).forEach(b=>{
      ctx.fillStyle = (b.key === need) ? '#ffd460' : '#2a2a45';
      roundRect(ctx, b.x, b.y, b.w, b.h, 10);
      ctx.fill();
      ctx.strokeStyle = '#6c5b9e';
      ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = (b.key===need) ? '#1a1a2e' : '#f4f1de';
      ctx.font = '28px sans-serif';
      ctx.fillText(b.icon, b.x+b.w/2, b.y+b.h/2);
    });

    promptTimer -= dt;
    if (feedback){
      ctx.fillStyle = feedback.ok ? '#4ecdc4' : '#ff6b9d';
      ctx.font = '16px VT323, monospace';
      ctx.fillText(feedback.ok ? 'Isso aí!' : 'Escorregou!', canvas.width/2, canvas.height-160);
    }

    if (promptTimer <= 0){
      progress = Math.max(0, progress - 0.02);
      idx++;
      if (idx >= SEQ_LEN){
        phase = 'cutscene'; cutsceneTimer = 0; cutsceneStep = 0;
      } else nextPrompt();
    }
  }

  const CUTSCENE_STEPS = [
    { dur:1600, key:'cena_carro', caption:'Chegando ao castelo...' },
    { dur:1800, key:'cena_castelo', caption:'Saindo do carro...' },
    { dur:2000, key:'cena_anel', caption:'Junior se ajoelha...' },
    { dur:2200, key:'cena_cerejeira', caption:'ELA DISSE SIM!' },
    { dur:2400, key:'cena_casal_beijo', caption:'Felizes para sempre.' }
  ];

  function drawCutscene(dt){
    cutsceneTimer += dt;
    const step = CUTSCENE_STEPS[cutsceneStep];
    drawSceneImage(step.key, step.caption);
    if (cutsceneTimer >= step.dur){
      cutsceneTimer = 0;
      cutsceneStep++;
      if (cutsceneStep >= CUTSCENE_STEPS.length){
        cancelAnimationFrame(raf);
        removeTap();
        addScore(40);
        done();
        return true;
      }
    }
    return false;
  }

  function loop(now){
    const dt = now - last; last = now;
    if (phase === 'climb') drawClimb(dt);
    else { if (drawCutscene(dt)) return; }
    raf = requestAnimationFrame(loop);
  }

  const removeTap = addTap((pos)=>{
    if (phase !== 'climb') return;
    const need = seq[idx];
    const btns = buttons();
    for (const b of Object.values(btns)){
      if (pos.x>=b.x && pos.x<=b.x+b.w && pos.y>=b.y && pos.y<=b.y+b.h){
        if (b.key === need){
          progress = Math.min(1, progress + 1/SEQ_LEN);
          addScore(6);
          feedback = {ok:true};
        } else {
          addScore(-2);
          feedback = {ok:false};
        }
        setTimeout(()=>feedback=null, 500);
        idx++;
        if (idx >= SEQ_LEN){ phase='cutscene'; }
        else nextPrompt();
        break;
      }
    }
  });

  raf = requestAnimationFrame(loop);
  cleanupCurrentPhase = ()=>{ cancelAnimationFrame(raf); removeTap(); };
}

/* ============================================================
   FASE 8 - A GRANDE PERGUNTA
   ============================================================ */
function runPhase8(done){
  showScreen('screen-choice');
  const boyBtn = document.getElementById('choice-boy');
  const girlBtn = document.getElementById('choice-girl');
  function pick(g){
    player.guess = g;
    boyBtn.onclick = null; girlBtn.onclick = null;
    done();
  }
  boyBtn.onclick = ()=>pick('Timothy');
  girlBtn.onclick = ()=>pick('Luna');
}

/* ============================================================
   CONTROLADOR DE FASES / HISTÓRIA
   ============================================================ */
const PHASES = [
  { label:'FASE 1', title:'IPNET - Cruzando Caminhos', portrait:'🏢',
    text:'Karina e Junior trabalhavam na mesma empresa, mas nunca trocaram uma palavra. Você lembra o que cada um fazia lá?',
    run: runPhase1 },
  { label:'FASE 2', title:'Instagram - A Camisa Marrom', portrait:'📱',
    text:'Foi uma foto de uma blusa marrom social que fez os dois começarem a se falar de verdade.',
    run: runPhase2 },
  { label:'FASE 3', title:'Stand de Tiro - Primeiro Encontro', portrait:'🎯',
    text:'O primeiro encontro do casal foi em um stand de tiro esportivo!',
    run: runPhase3 },
  { label:'FASE 4', title:'Uma Volta de Harley', portrait:'🏍️',
    text:'Junior ama viajar de moto pela cidade, e Karina é a melhor companheira de garupa.',
    run: runPhase4 },
  { label:'FASE 5', title:'Salão de Beleza - Dia Corrido', portrait:'💇‍♀️',
    text:'Karina cuida de tudo na recepção do salão... mas a prima Bárbara sempre aparece pra atrapalhar!',
    run: runPhase5 },
  { label:'FASE 6', title:'Boliche - Aniversário de Namoro', portrait:'🎳',
    text:'Eles comemoraram o aniversário de namoro jogando boliche. Sua vez de jogar por eles!',
    run: runPhase6 },
  { label:'FASE 7', title:'O Pedido de Casamento', portrait:'💍',
    text:'Junior levou Karina até a Serra de Petrópolis para um pedido inesquecível.',
    run: runPhase7 },
  { label:'FASE 8', title:'O Que Vai Nascer Desse Amor?', portrait:'👶',
    text:'Agora você conhece um pouco do amor de Karina e Junior... mas há uma pergunta que só o tempo pode responder.',
    run: runPhase8 }
];

function startPhase(i){
  phaseIndex = i;
  const p = PHASES[i];
  document.getElementById('story-phase-label').textContent = p.label;
  document.getElementById('story-title').textContent = p.title;
  document.getElementById('story-text').textContent = p.text;
  document.getElementById('story-portrait').textContent = p.portrait;
  showScreen('screen-story');
}

document.getElementById('btn-story-continue').addEventListener('click', ()=>{
  const p = PHASES[phaseIndex];
  if (p.run === runPhase8){
    p.run(onPhaseComplete);
    return;
  }
  showScreen('screen-game');
  resizeCanvas();
  updateHud();
  p.run(onPhaseComplete);
});

function onPhaseComplete(){
  if (cleanupCurrentPhase){ cleanupCurrentPhase(); cleanupCurrentPhase = null; }
  if (phaseIndex + 1 < PHASES.length){
    startPhase(phaseIndex + 1);
  } else {
    finishGame();
  }
}

/* ============================================================
   REGISTRO
   ============================================================ */
const nameInput = document.getElementById('input-name');
const photoInput = document.getElementById('input-photo');
const photoPreview = document.getElementById('photo-preview');
const startBtn = document.getElementById('btn-start-game');

function checkReady(){
  startBtn.disabled = !(nameInput.value.trim().length > 0 && player.photo);
}
nameInput.addEventListener('input', checkReady);

photoInput.addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    const img = new Image();
    img.onload = ()=>{
      const size = 96;
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const cctx = c.getContext('2d');
      const scale = Math.max(size/img.width, size/img.height);
      const w = img.width*scale, h = img.height*scale;
      cctx.drawImage(img, (size-w)/2, (size-h)/2, w, h);
      player.photo = c.toDataURL('image/jpeg', 0.7);
      photoPreview.innerHTML = '';
      const pimg = document.createElement('img');
      pimg.src = player.photo;
      photoPreview.appendChild(pimg);
      checkReady();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

startBtn.addEventListener('click', ()=>{
  player.name = nameInput.value.trim();
  startPhase(0);
});

/* ============================================================
   FINALIZAÇÃO / FIREBASE
   ============================================================ */
function finishGame(){
  document.getElementById('result-name').textContent = player.name;
  document.getElementById('result-score').textContent = player.score;
  document.getElementById('result-guess').textContent = 'Apostou em: ' + player.guess;
  const rp = document.getElementById('result-photo');
  rp.innerHTML = '';
  const img = document.createElement('img');
  img.src = player.photo;
  rp.appendChild(img);
  showScreen('screen-result');

  const statusEl = document.getElementById('result-status');
  const viewBtn = document.getElementById('btn-view-rank');

  db.collection('players').add({
    name: player.name,
    photo: player.photo,
    score: player.score,
    guess: player.guess,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(()=>{
    statusEl.textContent = 'Pontuação registrada no ranking!';
    viewBtn.style.display = 'inline-block';
  }).catch((err)=>{
    statusEl.textContent = 'Não foi possível enviar (erro: ' + err.message + ')';
    viewBtn.style.display = 'inline-block';
  });
}

document.getElementById('btn-view-rank').addEventListener('click', openLeaderboard);
document.getElementById('btn-back-result').addEventListener('click', ()=> showScreen('screen-result'));

let leaderboardUnsub = null;
function openLeaderboard(){
  showScreen('screen-leaderboard');
  const list = document.getElementById('leaderboard-list');
  if (leaderboardUnsub) leaderboardUnsub();
  leaderboardUnsub = db.collection('players').orderBy('score','desc').limit(100)
    .onSnapshot((snap)=>{
      let correctGender = null;
      db.collection('config').doc('reveal').get().then(doc=>{
        if (doc.exists) correctGender = doc.data().gender;
        renderLeaderboard(snap, correctGender);
      }).catch(()=> renderLeaderboard(snap, null));
    });
}

function renderLeaderboard(snap, correctGender){
  const list = document.getElementById('leaderboard-list');
  list.innerHTML = '';
  let rank = 0;
  snap.forEach(doc=>{
    rank++;
    const d = doc.data();
    const row = document.createElement('div');
    row.className = 'lb-row';
    const correctMark = correctGender && d.guess === correctGender ? '🎉' : '';
    row.innerHTML =
      '<div class="lb-rank">#' + rank + '</div>' +
      '<div class="lb-photo"><img src="' + d.photo + '"></div>' +
      '<div class="lb-name">' + d.name + '</div>' +
      '<div class="lb-correct">' + correctMark + '</div>' +
      '<div class="lb-score">' + d.score + '</div>';
    list.appendChild(row);
  });
  if (rank === 0) list.innerHTML = '<p class="hint-text">Ninguém jogou ainda.</p>';
}

/* ============================================================
   PAINEL ADMIN (?admin=1)
   ============================================================ */
function initAdmin(){
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') !== '1') return;
  showScreen('screen-admin');
  document.getElementById('admin-set-boy').addEventListener('click', ()=> setReveal('Timothy'));
  document.getElementById('admin-set-girl').addEventListener('click', ()=> setReveal('Luna'));
  document.getElementById('admin-view-rank').addEventListener('click', openLeaderboard);
}

function setReveal(gender){
  db.collection('config').doc('reveal').set({ gender }).then(()=>{
    document.getElementById('admin-status').textContent = 'Definido: ' + gender + ' ✔';
  });
}

/* ============================================================
   BOOT
   ============================================================ */
document.getElementById('screen-boot').addEventListener('click', ()=>{
  showScreen('screen-register');
});
resizeCanvas();
initAdmin();
