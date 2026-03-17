// ============================================
//   NEON DISTRICT CUTS — neon.js  v3.0
// ============================================

// ======= PLAYER STATE =======
const PLAYER = { xp:0, level:1, coins:500, cutsCompleted:0, spinUses:0, votedOps:new Set(), achievements:new Set() };
const XP_LEVELS = [0,500,1500,3500,7500,15000];
const CUTS_TO_SPIN = 5;

// ======= DATA =======
const services = [
  {id:1,icon:"⚡",name:"FADE EXTREMO",desc:"Degradado de piel total con tres máquinas de precisión. El corte más solicitado del distrito.",price:"$35.000",priceN:35000,dur:"45 min",xp:150,popular:true},
  {id:2,icon:"✂️",name:"CORTE CLÁSICO",desc:"El operativo estándar. Tijera, peine y navaja. Sin fallos. Sin tiempo extra.",price:"$28.000",priceN:28000,dur:"35 min",xp:100,popular:false},
  {id:3,icon:"🔥",name:"COMBO ÉLITE",desc:"Corte + fade + barba en una sola misión. Para los agentes que exigen el paquete completo.",price:"$55.000",priceN:55000,dur:"70 min",xp:250,popular:true},
  {id:4,icon:"⚔️",name:"DISEÑO DE BARBA",desc:"Escultura facial con navajas de precisión. Perfilado láser, aceite y fijación permanente.",price:"$22.000",priceN:22000,dur:"30 min",xp:80,popular:false},
  {id:5,icon:"💀",name:"EL AFEITADO",desc:"Navaja recta. Toalla caliente. Espuma artesanal. El ritual más ancestral del distrito.",price:"$25.000",priceN:25000,dur:"35 min",xp:90,popular:false},
  {id:6,icon:"🎯",name:"CORTE INFANTIL",desc:"Misión de bajo riesgo para los reclutas más jóvenes. Paciencia garantizada.",price:"$20.000",priceN:20000,dur:"25 min",xp:60,popular:false},
  {id:7,icon:"🧬",name:"TRATAMIENTO",desc:"Hidratación profunda, mascarilla de keratina y masaje de cuero cabelludo. Upgrade total.",price:"$48.000",priceN:48000,dur:"60 min",xp:180,popular:false},
  {id:8,icon:"👑",name:"GHOST PROTOCOL",desc:"El ritual completo. Solo para GHOST y LEGEND. Reserva exclusiva. Todo incluido.",price:"$95.000",priceN:95000,dur:"120 min",xp:500,popular:true},
];

const operatives = [
  {id:1,name:"RAZOR-7",realname:"Jhon Jairo Parra",role:"Founder & Lead Operative",color:"#00fff2",bg:"linear-gradient(135deg,#001a1a,#002828)",rating:5.0,votes:612,cuts:14200,specs:["Fade Extremo","Navaja","Arte Barbero","Ghost Protocol"],online:true},
  {id:2,name:"GHOST-X",realname:"Sebastián Banguera",role:"Co-Founder & Style Director",color:"#f700ff",bg:"linear-gradient(135deg,#1a001a,#280028)",rating:4.9,votes:487,cuts:11800,specs:["Diseños","Undercut","Color","Texturas"],online:true},
  {id:3,name:"BLADE-3",realname:"Valentina Soto",role:"Senior Operative",color:"#ffd700",bg:"linear-gradient(135deg,#1a1400,#282000)",rating:4.8,votes:356,cuts:8400,specs:["Barba","Afeitado","Cejas","Tratamientos"],online:true},
  {id:4,name:"ECHO-9",realname:"Camilo Ortiz",role:"Fade Specialist",color:"#ff4444",bg:"linear-gradient(135deg,#1a0000,#280000)",rating:4.7,votes:228,cuts:5600,specs:["Fade","Degradado","Modernos","Infantil"],online:false},
  {id:5,name:"NOVA-2",realname:"Isabella Mora",role:"Color Operative",color:"#00ff88",bg:"linear-gradient(135deg,#001a0e,#00280e)",rating:4.6,votes:167,cuts:3800,specs:["Color","Keratina","Mechas","Tratamientos"],online:true},
  {id:6,name:"ROOK-5",realname:"Felipe Vargas",role:"Trainee Operative",color:"#888bff",bg:"linear-gradient(135deg,#06061a,#0a0a28)",rating:4.3,votes:89,cuts:1200,specs:["Clásicos","Infantil","Fade Básico"],online:false},
];

// Spin wheel prizes
const SPIN_PRIZES = [
  {label:"10% OFF",desc:"10% de descuento en tu próxima visita",code:"NDC-10OFF",color:"#00fff2",textColor:"#000",prob:30},
  {label:"15% OFF",desc:"15% de descuento en tu próxima visita",code:"NDC-15OFF",color:"#f700ff",textColor:"#fff",prob:20},
  {label:"20% OFF",desc:"20% de descuento — ¡Misión épica!",code:"NDC-20OFF",color:"#ffd700",textColor:"#000",prob:15},
  {label:"CORTE GRATIS",desc:"Un corte clásico completamente gratis",code:"NDC-FREE1",color:"#00ff88",textColor:"#000",prob:5},
  {label:"+200 XP",desc:"Bonus de 200 XP instantáneos",code:"NDC-XP200",color:"#ff4444",textColor:"#fff",prob:20},
  {label:"2x1",desc:"Trae un amigo y paga solo uno",code:"NDC-2X1",color:"#888bff",textColor:"#fff",prob:7},
  {label:"5% OFF",desc:"5% de descuento — Sigue intentándolo",code:"NDC-5OFF",color:"#555577",textColor:"#aaa",prob:3},
];

// ======= GAME STATE =======
let booking = {op:null,svc:null,date:null,time:null,pay:null};
let mgState = {running:false,score:0,combo:1,lives:3,timer:30,clients:[],intervals:[]};
let spinState = {spinning:false,angle:0,used:false};
let currentPhase = 1;

// ======= AUDIO ENGINE =======
let audioCtx = null;
function getAudio(){if(!audioCtx){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}return audioCtx}
function playTone(freqs,dur,vol=0.08,type='sine'){
  const ctx=getAudio();if(!ctx)return;
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.connect(gain);gain.connect(ctx.destination);
  osc.type=type;gain.gain.setValueAtTime(vol,ctx.currentTime);
  freqs.forEach((f,i)=>osc.frequency.setValueAtTime(f,ctx.currentTime+i*(dur/freqs.length)));
  gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur*1.5);
  osc.start(ctx.currentTime);osc.stop(ctx.currentTime+dur*2);
}
const SFX={
  click:()=>playTone([800,600],0.06,0.06,'square'),
  confirm:()=>playTone([400,600,800],0.15,0.1,'sine'),
  xp:()=>playTone([600,800,1000,1200],0.25,0.1,'sine'),
  error:()=>playTone([300,200],0.15,0.08,'sawtooth'),
  cut:()=>playTone([900,500],0.08,0.07,'square'),
  miss:()=>playTone([250,180],0.12,0.07,'sawtooth'),
  level:()=>playTone([300,400,500,700,900,1200],0.4,0.12,'sine'),
  spin:()=>playTone([200,300,400,300,200],0.6,0.1,'sine'),
  win:()=>playTone([500,700,900,700,900,1100],0.5,0.12,'sine'),
  pip:()=>playTone([600,900],0.1,0.08,'sine'),
  unlock:()=>playTone([400,600,800,1000,1200,1500],0.6,0.12,'sine'),
};

// ======= INIT =======
document.addEventListener('DOMContentLoaded',()=>{
  initBoot();
  initCursor();
  initRain();
  initSoundButtons();
  initScrollReveal();
  initNavScroll();
  renderArsenal();
  renderOperatives();
  renderCutPips();
  initBookingForm();
  initDateInput();
  animateCounters();
});

// ======= BOOT =======
function initBoot(){
  const logs=["NDC_OS v3.0 inicializando...","Cargando operativos... [OK]","Sistema XP activo... [OK]","Ruleta de descuentos... [OK]","Módulo de misiones: ACTIVO","⚡ BIENVENIDO AL DISTRITO — CALI"];
  const bar=document.getElementById('bootBar');
  const logEl=document.getElementById('bootLog');
  let i=0,progress=0;
  const iv=setInterval(()=>{
    progress=Math.min(100,progress+100/logs.length);
    bar.style.width=progress+'%';
    if(i<logs.length){const d=document.createElement('div');d.textContent='> '+logs[i++];logEl.appendChild(d);logEl.scrollTop=logEl.scrollHeight;}
    if(progress>=100){clearInterval(iv);setTimeout(()=>{
      document.getElementById('bootScreen').classList.add('hidden');
      document.getElementById('hudTop').classList.add('visible');
    },700);}
  },240);
  document.addEventListener('keydown',skipBoot,{once:true});
  document.getElementById('bootScreen').addEventListener('click',skipBoot,{once:true});
}
function skipBoot(){
  document.getElementById('bootScreen').classList.add('hidden');
  document.getElementById('hudTop').classList.add('visible');
}

// ======= CURSOR =======
function initCursor(){
  const ring=document.getElementById('cursorRing'),dot=document.getElementById('cursorDot');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px';});
  function animRing(){rx+=(mx-rx)*0.12;ry+=(my-ry)*0.12;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(animRing);}
  animRing();
  document.querySelectorAll('button,a,.arsenal-card,.op-card,.ct-pip,.style-btn').forEach(el=>{
    el.addEventListener('mouseenter',()=>ring.classList.add('hovering'));
    el.addEventListener('mouseleave',()=>ring.classList.remove('hovering'));
  });
}

// ======= RAIN =======
function initRain(){
  const container=document.getElementById('heroRain');if(!container)return;
  const chars='アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF';
  for(let i=0;i<30;i++){
    const el=document.createElement('div');
    el.classList.add('rain-char');
    el.textContent=chars[Math.floor(Math.random()*chars.length)];
    el.style.left=Math.random()*100+'%';
    el.style.animationDuration=(Math.random()*8+4)+'s';
    el.style.animationDelay=(Math.random()*6)+'s';
    el.style.fontSize=(Math.random()*8+9)+'px';
    el.style.opacity=Math.random()*0.4+0.1;
    container.appendChild(el);
    setInterval(()=>{el.textContent=chars[Math.floor(Math.random()*chars.length)];},(Math.random()*2000+1000));
  }
}

// ======= SOUND BUTTONS =======
function initSoundButtons(){
  document.querySelectorAll('[data-sound]').forEach(el=>{
    el.addEventListener('click',()=>{const s=el.dataset.sound;if(SFX[s])SFX[s]();});
  });
}

// ======= SCROLL REVEAL =======
function initScrollReveal(){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis');});
  },{threshold:0.1});
  document.querySelectorAll('.fade-in-up').forEach(el=>obs.observe(el));
}

// ======= NAVBAR =======
function initNavScroll(){
  window.addEventListener('scroll',()=>{
    document.getElementById('navbar')?.classList.toggle('scrolled',window.scrollY>50);
  });
  document.getElementById('hamburger')?.addEventListener('click',()=>{
    document.getElementById('mobileNav').classList.toggle('open');
  });
}
function closeMobileNav(){document.getElementById('mobileNav').classList.remove('open');}
function scrollToSection(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth'});}

// ======= COUNTER ANIMATIONS =======
function animateCounters(){
  document.querySelectorAll('.hs-n[data-target]').forEach(el=>{
    const target=parseInt(el.dataset.target);
    let current=0;
    const step=Math.ceil(target/60);
    const iv=setInterval(()=>{
      current=Math.min(current+step,target);
      el.textContent=current.toLocaleString('es-CO');
      if(current>=target)clearInterval(iv);
    },30);
  });
}

// ======= XP & LEVEL SYSTEM =======
function addXP(amount){
  PLAYER.xp+=amount;
  PLAYER.coins+=Math.floor(amount/5);
  updateHUD();
  checkLevelUp();
  checkTiers();
  SFX.xp();
  pushNotif(`+${amount} XP desbloqueados`,'cyan');
}

function updateHUD(){
  const lvl=PLAYER.level;
  const xpNeeded=XP_LEVELS[Math.min(lvl,XP_LEVELS.length-1)];
  const xpPrev=XP_LEVELS[Math.max(lvl-1,0)];
  const pct=xpNeeded>0?Math.min(((PLAYER.xp-xpPrev)/(xpNeeded-xpPrev))*100,100):100;
  const xpFill=document.getElementById('xpBarFill');
  if(xpFill)xpFill.style.width=pct+'%';
  const xpNum=document.getElementById('xpNum');
  if(xpNum)xpNum.textContent=PLAYER.xp;
  const playerLvl=document.getElementById('playerLvl');
  if(playerLvl)playerLvl.textContent=PLAYER.level;
  const charBadge=document.getElementById('charLvlBadge');
  if(charBadge)charBadge.textContent=PLAYER.level;
  const coins=document.getElementById('playerCoins');
  if(coins)coins.textContent=PLAYER.coins;
}

function checkLevelUp(){
  const needed=XP_LEVELS[Math.min(PLAYER.level,XP_LEVELS.length-1)];
  if(PLAYER.xp>=needed && PLAYER.level<5){
    PLAYER.level++;
    SFX.level();
    pushNotif(`🏆 LEVEL UP — NIVEL ${PLAYER.level}!`,'yellow');
    updateHUD();
    // Flash the char badge
    const badge=document.getElementById('charLvlBadge');
    if(badge){badge.parentElement.style.animation='none';setTimeout(()=>badge.parentElement.style.animation='',50);}
  }
}

const TIER_LABELS=['RECRUIT 🔩','SOLDIER ⚡','VETERAN 🔥','LEGEND 💀','GHOST 👑'];
function checkTiers(){
  const tiers=[0,500,1500,3500,7500];
  let currentTier=0;
  tiers.forEach((t,i)=>{if(PLAYER.xp>=t)currentTier=i;});
  document.querySelectorAll('[id^="tier"]').forEach((el,i)=>el.classList.toggle('current',i===currentTier));
  const label=document.getElementById('currentTierLabel');
  if(label)label.textContent=TIER_LABELS[currentTier];
}

// ======= ACHIEVEMENTS =======
function unlockAchievement(id,label){
  if(PLAYER.achievements.has(id))return;
  PLAYER.achievements.add(id);
  const chip=document.getElementById(id);
  if(chip){chip.classList.remove('locked');chip.classList.add('unlocked');}
  pushNotif(`🏆 LOGRO: ${label}`,'yellow');
  SFX.win();
}

// ======= NOTIFICATIONS =======
function pushNotif(msg,type='cyan'){
  const stack=document.getElementById('notifStack');if(!stack)return;
  const t=document.createElement('div');
  t.className=`notif-toast ${type}`;
  t.textContent=msg;
  stack.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(100%)';t.style.transition='all 0.4s';},2500);
  setTimeout(()=>t.remove(),3000);
  // Limit 4
  while(stack.children.length>4)stack.removeChild(stack.firstChild);
}

// ======= ✂ CUT TRACKER =======
function renderCutPips(){
  const cont=document.getElementById('ctPips');if(!cont)return;
  cont.innerHTML='';
  for(let i=0;i<CUTS_TO_SPIN;i++){
    const pip=document.createElement('div');
    pip.className='ct-pip'+(i<PLAYER.cutsCompleted?' done':'');
    pip.id='pip'+i;
    cont.appendChild(pip);
  }
  updateCutLabel();
}

function updateCutLabel(){
  const left=CUTS_TO_SPIN-PLAYER.cutsCompleted;
  const el=document.getElementById('ctLeft');
  if(el)el.textContent=Math.max(0,left);
  const btn=document.getElementById('spinUnlockBtn');
  const icon=document.getElementById('spinBtnIcon');
  const lbl=document.getElementById('spinBtnLabel');
  if(!btn)return;
  if(PLAYER.cutsCompleted>=CUTS_TO_SPIN && PLAYER.spinUses>0){
    btn.classList.remove('locked');btn.classList.add('unlocked');
    btn.disabled=false;
    if(icon)icon.textContent='🎰';
    if(lbl)lbl.textContent=`GIRAR RULETA (${PLAYER.spinUses})`;
  } else {
    btn.classList.add('locked');btn.classList.remove('unlocked');
    btn.disabled=true;
    if(icon)icon.textContent='🔒';
    if(lbl)lbl.textContent='RULETA BLOQUEADA';
  }
  const simBtn=document.getElementById('simCutBtn');
  if(simBtn)simBtn.style.display=PLAYER.cutsCompleted>=CUTS_TO_SPIN?'none':'block';
}

// Simulate a cut (demo button) — also called after real booking confirmed
function simCut(){
  if(PLAYER.cutsCompleted>=CUTS_TO_SPIN)return;
  SFX.pip();
  PLAYER.cutsCompleted++;
  addXP(80);
  const pip=document.getElementById('pip'+(PLAYER.cutsCompleted-1));
  if(pip){
    pip.classList.add('done','pulse');
    setTimeout(()=>pip.classList.remove('pulse'),700);
  }
  updateCutLabel();
  pushNotif(`✂ Corte ${PLAYER.cutsCompleted}/${CUTS_TO_SPIN} registrado!`,'cyan');

  if(PLAYER.cutsCompleted===CUTS_TO_SPIN){
    PLAYER.spinUses=1;
    updateCutLabel();
    SFX.unlock();
    setTimeout(()=>{
      pushNotif('🎰 ¡RULETA DESBLOQUEADA! Pulsa el botón para girar.','yellow');
      unlockAchievement('ach1','PRIMER CORTE');
    },600);
  }
}

// ======= 🎰 SPIN WHEEL =======
function openSpinWheel(){
  if(PLAYER.spinUses<=0)return;
  document.getElementById('spinOverlay').classList.add('open');
  document.getElementById('spinResult').style.display='none';
  document.getElementById('spinBtn').disabled=false;
  document.getElementById('spinBtn').textContent='⚡ GIRAR RULETA';
  document.getElementById('spinUsesLeft').textContent=PLAYER.spinUses;
  drawWheel(spinState.angle);
}

function closeSpinWheel(){
  document.getElementById('spinOverlay').classList.remove('open');
}

function drawWheel(startAngle=0){
  const canvas=document.getElementById('spinCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const cx=160,cy=160,r=148;
  const total=SPIN_PRIZES.reduce((s,p)=>s+p.prob,0);
  ctx.clearRect(0,0,320,320);

  // Draw shadow
  ctx.save();ctx.shadowColor='rgba(0,255,242,0.3)';ctx.shadowBlur=20;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle='#05050f';ctx.fill();
  ctx.restore();

  let angle=startAngle;
  SPIN_PRIZES.forEach((prize,i)=>{
    const slice=(prize.prob/total)*Math.PI*2;
    // Slice fill
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+slice);ctx.closePath();
    ctx.fillStyle=prize.color+'22';ctx.fill();
    ctx.strokeStyle=prize.color+'66';ctx.lineWidth=1.5;ctx.stroke();

    // Glow arc
    ctx.beginPath();ctx.arc(cx,cy,r-2,angle,angle+slice);
    ctx.strokeStyle=prize.color;ctx.lineWidth=2;ctx.globalAlpha=0.5;ctx.stroke();
    ctx.globalAlpha=1;

    // Label
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(angle+slice/2);
    ctx.textAlign='right';
    ctx.font=`bold 11px 'Orbitron', monospace`;
    ctx.fillStyle=prize.color;
    ctx.shadowColor=prize.color;ctx.shadowBlur=6;
    ctx.fillText(prize.label,r-12,4);
    ctx.restore();

    angle+=slice;
  });

  // Center circle
  ctx.beginPath();ctx.arc(cx,cy,22,0,Math.PI*2);
  ctx.fillStyle='#0a0a1e';ctx.fill();
  ctx.strokeStyle='rgba(0,255,242,0.5)';ctx.lineWidth=2;ctx.stroke();
  ctx.font=`bold 14px 'Orbitron'`;ctx.fillStyle='#00fff2';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor='#00fff2';ctx.shadowBlur=8;
  ctx.fillText('NDC',cx,cy);
}

function spinWheel(){
  if(spinState.spinning||PLAYER.spinUses<=0)return;
  spinState.spinning=true;
  document.getElementById('spinBtn').disabled=true;
  document.getElementById('spinResult').style.display='none';
  SFX.spin();

  // Pick prize using weighted random
  const total=SPIN_PRIZES.reduce((s,p)=>s+p.prob,0);
  let r=Math.random()*total,cumul=0,prizeIdx=0;
  SPIN_PRIZES.forEach((p,i)=>{cumul+=p.prob;if(r<=cumul&&prizeIdx===0)prizeIdx=i;});

  // Calculate final angle so pointer lands on prize
  const slices=SPIN_PRIZES.map(p=>(p.prob/total)*Math.PI*2);
  let prizeStart=0;
  for(let i=0;i<prizeIdx;i++)prizeStart+=slices[i];
  const prizeCenter=prizeStart+slices[prizeIdx]/2;
  // Pointer is at top (angle = -PI/2). We want prizeCenter to end at top.
  const extraSpins=Math.PI*2*(6+Math.floor(Math.random()*4)); // 6-9 full spins
  const targetAngle=extraSpins - prizeCenter + (Math.PI*2 - Math.PI/2) + spinState.angle;

  const duration=4000+Math.random()*1500;
  const startAngle=spinState.angle;
  const startTime=performance.now();

  function easeOut(t){return 1-Math.pow(1-t,4);}

  function frame(now){
    const elapsed=now-startTime;
    const t=Math.min(elapsed/duration,1);
    const current=startAngle+(targetAngle-startAngle)*easeOut(t);
    spinState.angle=current;
    drawWheel(current);
    if(t<1){requestAnimationFrame(frame);}
    else{
      spinState.spinning=false;
      PLAYER.spinUses--;
      updateCutLabel();
      const prize=SPIN_PRIZES[prizeIdx];
      // Show result
      const code=prize.code+'-'+Math.random().toString(36).substr(2,4).toUpperCase();
      document.getElementById('srPrize').textContent=prize.label;
      document.getElementById('srCode').querySelector('strong').textContent=code;
      document.getElementById('spinResult').style.display='block';
      document.getElementById('spinUsesLeft').textContent=PLAYER.spinUses;
      // If XP prize apply it
      if(prize.label.includes('XP'))addXP(200);
      SFX.win();
      pushNotif(`🎰 ¡GANASTE: ${prize.label}!`,'yellow');
      unlockAchievement('ach4','GAMER');
      // Reset pips if uses exhausted
      if(PLAYER.spinUses<=0){
        PLAYER.cutsCompleted=0;
        renderCutPips();
        pushNotif('Completa 5 cortes más para otra ruleta','cyan');
      }
    }
  }
  requestAnimationFrame(frame);
}

// ======= ARSENAL =======
function renderArsenal(){
  const grid=document.getElementById('arsenalGrid');if(!grid)return;
  grid.innerHTML=services.map((s,i)=>`
    <div class="arsenal-card fade-in-up" style="transition-delay:${i*0.05}s">
      ${s.popular?'<div class="ac-popular">HOT</div>':''}
      <div class="ac-num">0${s.id}</div>
      <span class="ac-icon">${s.icon}</span>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
      <div class="ac-foot">
        <div>
          <div class="ac-price">${s.price}</div>
          <div class="ac-dur">${s.dur}</div>
        </div>
        <div class="ac-xp">+${s.xp} XP</div>
      </div>
    </div>`).join('');
  setTimeout(()=>initScrollReveal(),100);
}

// ======= OPERATIVES =======
function renderOperatives(){
  const grid=document.getElementById('opsGrid');if(!grid)return;
  const sorted=[...operatives].sort((a,b)=>b.rating-a.rating||b.votes-a.votes);
  grid.innerHTML=sorted.map((op,i)=>{
    const rank=i+1;
    const rClass=rank===1?'r1':rank===2?'r2':rank===3?'r3':'rn';
    const voted=PLAYER.votedOps.has(op.id);
    return `
    <div class="op-card fade-in-up" style="transition-delay:${i*0.08}s">
      <div class="op-card-top" style="background:${op.bg}">
        <div class="op-initials" style="color:${op.color};text-shadow:0 0 24px ${op.color}">${op.name}</div>
        <div class="op-rank ${rClass}">${rank}</div>
        <div class="op-status ${op.online?'op-online':'op-offline'}">${op.online?'● ONLINE':'○ OFFLINE'}</div>
      </div>
      <div class="op-body">
        <h3>${op.realname}</h3>
        <span class="op-role" style="color:${op.color}">${op.role}</span>
        <div class="op-stars">${renderStars(op.rating)}<span class="op-rating-num">${op.rating}</span></div>
        <div class="op-votes">${op.votes.toLocaleString()} votos · ${op.cuts.toLocaleString()} cortes</div>
        <div class="op-specs">${op.specs.map(s=>`<span class="op-spec">${s}</span>`).join('')}</div>
        <div class="op-kills">✂ <strong style="color:${op.color}">${op.cuts.toLocaleString()}</strong> cortes realizados</div>
        <button class="op-vote-btn ${voted?'voted':''}" onclick="voteOp(${op.id})">${voted?'⭐ VOTADO':'⚡ VOTAR'}</button>
      </div>
    </div>`}).join('');
  setTimeout(()=>initScrollReveal(),100);
}

function renderStars(r){
  let h='';
  for(let i=1;i<=5;i++){
    if(i<=Math.floor(r))h+=`<span class="op-star on">★</span>`;
    else if(i-0.5<=r)h+=`<span class="op-star on" style="opacity:.55">★</span>`;
    else h+=`<span class="op-star">★</span>`;
  }
  return h;
}

function voteOp(id){
  if(PLAYER.votedOps.has(id)){pushNotif('Ya votaste por este operativo','yellow');return;}
  PLAYER.votedOps.add(id);
  const op=operatives.find(o=>o.id===id);if(!op)return;
  op.votes++;op.rating=Math.min(5,parseFloat((op.rating+0.005).toFixed(3)));
  addXP(25);renderOperatives();
  pushNotif(`⚡ Voto registrado para ${op.realname}`,'cyan');
}

// ======= MINI-GAME =======
function openMiniGame(){
  document.getElementById('miniGameOverlay').classList.add('open');
  document.getElementById('mgInstructions').style.display='block';
  document.getElementById('mgGame').style.display='none';
  document.getElementById('mgResult').style.display='none';
  unlockAchievement('ach4','GAMER');
}
function closeMiniGame(){
  stopMiniGame();
  document.getElementById('miniGameOverlay').classList.remove('open');
}

function startMiniGame(){
  mgState={running:true,score:0,combo:1,lives:3,timer:30,clients:[],intervals:[]};
  document.getElementById('mgInstructions').style.display='none';
  document.getElementById('mgResult').style.display='none';
  document.getElementById('mgGame').style.display='block';
  document.getElementById('mgField').innerHTML='';
  updateMgHUD();

  // Spawn clients
  const spawnIv=setInterval(()=>{if(!mgState.running)return;spawnClient();},900);
  mgState.intervals.push(spawnIv);
  // Timer
  const timerIv=setInterval(()=>{
    if(!mgState.running)return;
    mgState.timer--;
    document.getElementById('mgTimer').textContent=mgState.timer;
    if(mgState.timer<=0){clearInterval(timerIv);endMiniGame();}
  },1000);
  mgState.intervals.push(timerIv);
}

function spawnClient(){
  const field=document.getElementById('mgField');if(!field)return;
  const isAngry=Math.random()<0.2;
  const el=document.createElement('div');
  el.className='mg-client'+(isAngry?' angry':'');
  const emojis=isAngry?['😤','😠','🤬']:['😐','😊','🧔','👱','👦','😎'];
  el.innerHTML=`<div class="mg-head">${emojis[Math.floor(Math.random()*emojis.length)]}</div>
    <div class="mg-bar"><div class="mg-bar-fill" style="width:100%"></div></div>`;
  const maxX=field.offsetWidth-60,maxY=field.offsetHeight-80;
  el.style.left=Math.max(0,Math.random()*maxX)+'px';
  el.style.top=Math.max(0,Math.random()*maxY)+'px';
  field.appendChild(el);

  // Timeout bar drain
  const lifetime=isAngry?1800:2800;
  const barFill=el.querySelector('.mg-bar-fill');
  const start=performance.now();
  const drainId=requestAnimationFrame(function drain(now){
    if(!mgState.running){el.remove();return;}
    const pct=Math.max(0,1-(now-start)/lifetime)*100;
    barFill.style.width=pct+'%';
    if(pct>0)requestAnimationFrame(drain);
    else{
      if(el.parentNode){
        el.remove();
        if(!isAngry){
          mgState.combo=1;mgState.lives=Math.max(0,mgState.lives-1);
          updateMgHUD();SFX.miss();
          if(mgState.lives<=0)endMiniGame();
        }
      }
    }
  });

  el.onclick=()=>{
    if(!mgState.running)return;
    el.remove();
    if(isAngry){
      mgState.score=Math.max(0,mgState.score-30);mgState.combo=1;
      SFX.miss();pushNotif('😤 Cliente enojado -30 pts','yellow');
    } else {
      mgState.score+=20*mgState.combo;mgState.combo=Math.min(mgState.combo+1,8);
      SFX.cut();
      // Flash combo
      const c=document.getElementById('mgCombo');
      if(c){c.textContent=mgState.combo;c.style.color='var(--yellow)';setTimeout(()=>c.style.color='',300);}
    }
    updateMgHUD();
  };
}

function updateMgHUD(){
  const s=mgState;
  const sc=document.getElementById('mgScore');if(sc)sc.textContent=s.score;
  const co=document.getElementById('mgCombo');if(co)co.textContent=s.combo;
  const li=document.getElementById('mgLives');if(li)li.textContent='❤️'.repeat(Math.max(0,s.lives));
}

function stopMiniGame(){
  mgState.running=false;
  mgState.intervals.forEach(iv=>clearInterval(iv));
  document.getElementById('mgField').innerHTML='';
}

function endMiniGame(){
  stopMiniGame();
  const xpGained=Math.floor(mgState.score/5)+50;
  addXP(xpGained);
  document.getElementById('mgGame').style.display='none';
  document.getElementById('mgResult').style.display='block';
  document.getElementById('mgFinalScore').textContent=mgState.score;
  document.getElementById('mgXpReward').textContent=xpGained;
  SFX.win();
}

// ======= BOOKING =======
function initBookingForm(){
  const opGrid=document.getElementById('opSelectGrid');
  if(opGrid){
    opGrid.innerHTML=operatives.map(op=>`
      <div class="pick-op" id="pop_${op.id}" onclick="pickOp(${op.id})">
        <h4 style="color:${op.color}">${op.name}</h4>
        <p>${op.realname}</p>
        <p style="font-size:0.6rem;margin-top:3px;color:${op.online?'#00ff88':'#888'}">${op.online?'● DISPONIBLE':'○ FUERA'}</p>
      </div>`).join('');
  }
  const svcGrid=document.getElementById('missionServiceGrid');
  if(svcGrid){
    svcGrid.innerHTML=services.map(s=>`
      <div class="pick-svc" id="psvc_${s.id}" onclick="pickSvc(${s.id})">
        <h4>${s.icon} ${s.name}</h4>
        <div class="ps-price">${s.price}</div>
        <p>${s.dur} · +${s.xp} XP</p>
      </div>`).join('');
  }
}

function pickOp(id){
  booking.op=operatives.find(o=>o.id===id);
  document.querySelectorAll('.pick-op').forEach(c=>c.classList.remove('sel'));
  document.getElementById('pop_'+id)?.classList.add('sel');
  SFX.click();
  updateTerminal();
  goPhase(2);
}

function pickSvc(id){
  booking.svc=services.find(s=>s.id===id);
  document.querySelectorAll('.pick-svc').forEach(c=>c.classList.remove('sel'));
  document.getElementById('psvc_'+id)?.classList.add('sel');
  SFX.click();
  updateTerminal();
  goPhase(3);
}

function initDateInput(){
  const input=document.getElementById('mDate');if(!input)return;
  input.min=new Date().toISOString().split('T')[0];
  input.addEventListener('change',()=>{
    booking.date=input.value;
    booking.time=null;
    document.getElementById('tm-date').textContent=formatDate(input.value);
    renderTimeSlots(input.value);
  });
}

function renderTimeSlots(dateStr){
  const cont=document.getElementById('timeGrid');if(!cont)return;
  const d=new Date(dateStr+'T12:00:00'),day=d.getDay();
  const open=8,close=day===0?14:day===6?18:20;
  const occupied=['09:00','10:30','14:00','16:30'];
  const slots=[];
  for(let h=open;h<close;h++){slots.push(pad(h)+':00');if(h+0.5<close)slots.push(pad(h)+':30');}
  cont.innerHTML=slots.map(s=>`
    <button class="time-slot${occupied.includes(s)?' taken':''}" onclick="pickTime('${s}',this)">${s}</button>`).join('');
}

function pickTime(t,el){
  document.querySelectorAll('.time-slot').forEach(b=>b.classList.remove('sel'));
  el.classList.add('sel');
  booking.time=t;
  document.getElementById('tm-time').textContent=t;
  SFX.click();
  goPhase(4);
}

function goPhase(n){
  currentPhase=n;
  document.querySelectorAll('.phase').forEach((p,i)=>p.classList.toggle('active',i===n-1));
  // Update terminal
  addTerminalLine(`FASE ${n} — ${['OPERATIVO','MISIÓN','FECHA/HORA','DATOS DEL AGENTE'][n-1]}`);
}

function updateTerminal(){
  const op=booking.op,svc=booking.svc;
  if(op){document.getElementById('tm-op').textContent=op.realname;}
  if(svc){
    document.getElementById('tm-svc').textContent=svc.name;
    document.getElementById('tm-price').textContent=svc.price;
    document.getElementById('tm-dur').textContent=svc.dur;
    document.getElementById('tm-xp').textContent=svc.xp;
  }
}

function addTerminalLine(text){
  const body=document.getElementById('terminalBody');if(!body)return;
  const line=document.createElement('div');line.className='term-line';
  line.innerHTML=`<span class="term-prompt">$</span> ${text}_`;
  body.appendChild(line);body.scrollTop=body.scrollHeight;
  while(body.children.length>8)body.removeChild(body.firstChild);
}

// ======= PAYMENT =======
const PAY_LABELS = {
  cash:     '💵 Efectivo al llegar',
  nequi:    '📱 Nequi — 315 678 9012',
  daviplata:'🔴 Daviplata — 315 678 9012',
  transfer: '🏦 Transferencia / PSE',
};

function selectPay(method, el) {
  booking.pay = method;
  // Toggle card selected state
  document.querySelectorAll('.pay-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  // Show/hide number panels
  const nequiNum = document.getElementById('nequiNum');
  const daviNum  = document.getElementById('daviNum');
  if (nequiNum) nequiNum.style.display = method === 'nequi'     ? 'flex' : 'none';
  if (daviNum)  daviNum.style.display  = method === 'daviplata' ? 'flex' : 'none';
  // Update message
  const msg = document.getElementById('payMsg');
  const msgs = {
    cash:     '✓ Paga en efectivo al llegar al estudio.',
    nequi:    '✓ Transfiere antes de tu cita y trae el comprobante.',
    daviplata:'✓ Transfiere antes de tu cita y trae el comprobante.',
    transfer: '✓ Te enviaremos los datos bancarios por WhatsApp.',
  };
  if (msg) msg.textContent = msgs[method] || '';
  // Update terminal
  const tmPay = document.getElementById('tm-pay');
  if (tmPay) tmPay.textContent = PAY_LABELS[method];
  SFX.click();
  addTerminalLine('MÉTODO DE PAGO: '+PAY_LABELS[method]);
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ COPIADO';
    btn.classList.add('copied');
    pushNotif('📋 Número copiado al portapapeles', 'cyan');
    setTimeout(() => { btn.textContent = '⎘ COPIAR'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => {
    pushNotif('Número: ' + text, 'cyan');
  });
}

function copyNequi(e) {
  e.stopPropagation();
  copyToClipboard('3156789012', e.currentTarget);
}

function copyDavi(e) {
  e.stopPropagation();
  copyToClipboard('3156789012', e.currentTarget);
}

function confirmMission(){
  const name=document.getElementById('mName')?.value.trim();
  const phone=document.getElementById('mPhone')?.value.trim();
  if(!name||!phone){pushNotif('Completa nombre y teléfono','yellow');SFX.error();return;}
  if(!booking.op){pushNotif('Selecciona un operativo','yellow');SFX.error();return;}
  if(!booking.svc){pushNotif('Elige tu misión','yellow');SFX.error();return;}
  if(!booking.date||!booking.time){pushNotif('Selecciona fecha y hora','yellow');SFX.error();return;}

  if(!booking.pay){pushNotif('Selecciona un método de pago','yellow');SFX.error();return;}

  const xpGained=booking.svc.xp;
  const dateStr=formatDate(booking.date);

  document.getElementById('mmBody').innerHTML=`
    <span class="term-prompt">$</span> AGENTE: <strong style="color:#00fff2">${name}</strong><br/>
    <span class="term-prompt">$</span> OPERATIVO: <strong>${booking.op.realname}</strong><br/>
    <span class="term-prompt">$</span> MISIÓN: <strong>${booking.svc.name}</strong><br/>
    <span class="term-prompt">$</span> FECHA: <strong>${dateStr} ${booking.time}</strong><br/>
    <span class="term-prompt">$</span> INVERSIÓN: <strong>${booking.svc.price}</strong><br/>
    <span class="term-prompt">$</span> PAGO: <strong style="color:#ffd700">${PAY_LABELS[booking.pay]}</strong><br/>
    <span class="term-prompt">$</span> CONTACTO: <strong>${phone}</strong>
  `;
  document.getElementById('mmXpGain').textContent='+'+xpGained;
  document.getElementById('missionModal').classList.add('open');
  SFX.confirm();
  addXP(xpGained);

  // Register cut
  PLAYER.cutsCompleted=Math.min(PLAYER.cutsCompleted+1,CUTS_TO_SPIN);
  if(PLAYER.cutsCompleted===CUTS_TO_SPIN){
    PLAYER.spinUses=(PLAYER.spinUses||0)+1;
    setTimeout(()=>pushNotif('🎰 ¡RULETA DESBLOQUEADA! Baja al hero y gira.','yellow'),1500);
  }
  renderCutPips();
  if(booking.op.id===1||booking.op.id===2)unlockAchievement('ach1','PRIMER CORTE');
}

function closeMissionModal(){
  document.getElementById('missionModal').classList.remove('open');
  // Reset form
  booking={op:null,svc:null,date:null,time:null,pay:null};
  document.querySelectorAll('.pick-op,.pick-svc,.time-slot,.pay-card').forEach(c=>c.classList.remove('sel','selected'));
  const nequiNum=document.getElementById('nequiNum');if(nequiNum)nequiNum.style.display='none';
  const daviNum=document.getElementById('daviNum');if(daviNum)daviNum.style.display='none';
  const payMsg=document.getElementById('payMsg');if(payMsg)payMsg.textContent='';
  const tmPay=document.getElementById('tm-pay');if(tmPay)tmPay.textContent='—';
  ['mName','mPhone','mEmail','mNote'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const mDate=document.getElementById('mDate');if(mDate)mDate.value='';
  document.getElementById('timeGrid').innerHTML='<p class="hint-neon">Selecciona fecha para ver slots disponibles</p>';
  ['tm-op','tm-svc','tm-price','tm-dur','tm-date','tm-time'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—';});
  document.getElementById('tm-xp').textContent='0';
  goPhase(1);
}

// ======= UTILS =======
function pad(n){return String(Math.floor(n)).padStart(2,'0')}
function formatDate(str){
  const d=new Date(str+'T12:00:00');
  return d.toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'});
}
