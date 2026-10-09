// ══════════════════ GLITCHBOX GAME CATALOG + THUMBNAILS ══════════════════
// Shared by the hub (index.html) and the framed play page (play.html) so the
// roster and its canvas art only ever live in one place.

const GAMES=[
  {name:'Midnight Post',      file:'midnight-post.html',          emoji:'🔦',color:['#07090a','#1a140a'],category:'puzzle',     tags:['new','hot'],blurb:'Guard the base gate from midnight to six. Check papers, catch the Hollows wearing soldiers\' faces'},
  {name:'Imposter',           file:'imposter.html',               emoji:'🕵️',color:['#0e0610','#200a14'],category:'multiplayer',tags:['new','hot','mp'],blurb:'Everyone knows the secret word except one. Give clues, find the faker. 3 to 16 players'},
  {name:'Most Likely To',     file:'most-likely-to.html',         emoji:'🫵',color:['#120c06','#22101c'],category:'multiplayer',tags:['new','hot','mp'],blurb:'Who\'s most likely to…? Everyone votes, the winner gets crowned. 3 to 16 players'},
  {name:'Rhyme Bomb',         file:'rhyme-bomb.html',             emoji:'💣',color:['#0c0614','#24100a'],category:'multiplayer',tags:['new','hot','mp'],blurb:'Rhyme with the word or the bomb blows up in your hands — 2 to 8 players'},
  {name:'Be the Dungeon',     file:'be-the-dungeon.html',         emoji:'🕳️',color:['#0a0508','#1e0a12'],category:'strategy',   tags:['new','hot'],price:150,blurb:'You are the dungeon. The adventurers learn from every raid'},
  {name:'Idle Universe',      file:'idle-universe.html',          emoji:'🌌',color:['#04030c','#140b2c'],category:'simulation', tags:['new','hot'],blurb:'One tap, one particle. Grow it into stars, life and minds, then crunch it all'},
  {name:'Shape Conquest',     file:'shape-conquest.html',         emoji:'🌍',color:['#0d1624','#152238'],category:'strategy',   tags:['new','hot'],blurb:'Pick any country, build an army of shapes, invade the world'},
  {name:'Scrawl',             file:'scrawl.html',                 emoji:'🖍️',color:['#0a0614','#1c1030'],category:'multiplayer',tags:['new','hot','mp'],blurb:'One player draws, everyone races to guess the word — 2 to 8 players'},
  {name:'Gridlock',           file:'gridlock.html',               emoji:'\u26a1',color:['#04060e','#0a1a34'],category:'multiplayer',tags:['new','hot','mp'],price:100,blurb:'Three to eight light cycles, one grid, nobody stops'},
  {name:'Patch Notes',        file:'patch-notes.html',            emoji:'🩹',color:['#07090c','#121922'],category:'strategy',   tags:['new','hot']},
  {name:'Seven Liars',         file:'seven-liars.html',            emoji:'🕶️',color:['#06080b','#101a24'],category:'puzzle',     tags:['new','hot']},
  {name:'Fatespine',           file:'fatespine.html',              emoji:'\u23f3',color:['#0a0410','#24103a'],category:'action',     tags:['new','hot']},
  {name:'Blast Radius',        file:'blast-radius.html',            emoji:'💥',color:['#03040c','#141d44'],category:'multiplayer',tags:['new','hot','mp'],price:120},
  {name:'Neon Frag',           file:'neon-frag.html',              emoji:'🔫',color:['#05070e','#101b33'],category:'multiplayer',tags:['new','hot','mp']},
  {name:'Mic Drop',            file:'mic-drop.html',               emoji:'🎤',color:['#12061f','#2a0f4a'],category:'multiplayer',tags:['new','mp']},
  {name:'Wet Paint',           file:'wet-paint.html',              emoji:'🎨',color:['#1a0e08','#2e1a10'],category:'adventure',  tags:['new','hot']},
  {name:'Magic Wand',          file:'magic-wand.html',             emoji:'🪄',color:['#0a0616','#1a0f33'],category:'other',      tags:['new','hot']},
  {name:'Neon Putt',           file:'neon-putt.html',              emoji:'⛳',color:['#04120f','#0a2620'],category:'puzzle',     tags:['new','hot'],price:80},
  {name:'Barrier',             file:'barrier.html',                emoji:'🚧',color:['#02140f','#04241b'],category:'action',     tags:['new','hot']},
  {name:'Quoridor',            file:'quoridor.html',               emoji:'🧱',color:['#0a1428','#12233f'],category:'strategy',   tags:['new','mp']},
  {name:'Pixel War',           file:'pixel-war.html',              emoji:'🪖',color:['#0a1800','#1a3008'],category:'action',     tags:['hot']},
  {name:'Pixel War Alt',       file:'pixelwar.html',               emoji:'⚔️',color:['#100a20','#201030'],category:'action',     tags:[]},
  {name:'Pixel War Solo',      file:'pixelwar-solo.html',          emoji:'🚀',color:['#00101a','#001828'],category:'action',     tags:[]},
  {name:'War Combined',        file:'war-combined.html',           emoji:'🛡️',color:['#180000','#300808'],category:'action',     tags:['hot'],blurb:'Two arsenals in one battlefield — subs, carriers, jets and armor'},
  {name:'Nuclear DEFCON',      file:'nuclear.html',                emoji:'☢️',color:['#141000','#242000'],category:'strategy',   tags:['hot']},
  {name:'Spaceship',           file:'spaceship-solo.html',         emoji:'🚀',color:['#020510','#060f28'],category:'action',     tags:['hot']},
  {name:'Spaceship MP',        file:'spaceship-mp.html',           emoji:'🛸',color:['#040610','#080f26'],category:'multiplayer',tags:['mp']},
  {name:'Build a Bridge',      file:'build-a-bridge.html',         emoji:'🌉',color:['#060c18','#0c1830'],category:'puzzle',     tags:['hot']},
  {name:'Red Horizon',         file:'mars-colony.html',            emoji:'🔴',color:['#180400','#301000'],category:'simulation', tags:['new'],blurb:'Red Horizon — build a colony that survives the Martian night'},
  {name:'Untamed',             file:'national-park-tycoon.html',   emoji:'🏞️',color:['#041200','#082400'],category:'simulation', tags:['new']},
  {name:'Park Simulator',      file:'national-park-simulator.html',emoji:'⛺',color:['#060e00','#0e1c00'],category:'simulation', tags:[]},
  {name:'Virus',               file:'virus.html',                  emoji:'🦠',color:['#0a0414','#180828'],category:'strategy',   tags:['hot']},
  {name:'Pathogen',            file:'pathogen.html',               emoji:'🧬',color:['#041208','#081e0e'],category:'strategy',   tags:[]},
  {name:'Last Transmission',   file:'last-transmission.html',      emoji:'📡',color:['#040a14','#081424'],category:'adventure',  tags:['new']},
  {name:'Last Transmission 3D',file:'last-transmission-3d.html',   emoji:'🌌',color:['#02040e','#060c1e'],category:'adventure',  tags:['new'],blurb:'The deep-space story, rebuilt in 3D'},
  {name:'Cheese Heist 3D',     file:'cheese-heist-3d.html',        emoji:'🧀',color:['#1a1500','#2a2200'],category:'action',     tags:[],blurb:'Full 3D stealth heist — grab the cheese, stay out of sight'},
  {name:'Fib Factory',         file:'fib-factory.html',            emoji:'🎭',color:['#1a001a','#2a002a'],category:'multiplayer',tags:['mp']},
  {name:'Yellowstone Carnage', file:'yellowstone-carnage.html',    emoji:'🌋',color:['#1a0a00','#2a1500'],category:'action',     tags:['new'],blurb:'Supervolcano chaos, no survivors guaranteed'},
  {name:'Speed Stars',         file:'speed-stars.html',            emoji:'🏎️',color:['#000a1a','#001030'],category:'action',     tags:[]},
  {name:'Hacker',              file:'hacker.html',                 emoji:'💻',color:['#001a00','#003300'],category:'puzzle',     tags:[]},
  {name:'DJ',                  file:'dj.html',                     emoji:'🎧',color:['#0a001a','#15002a'],category:'other',      tags:[]},
  {name:'Decision Roulette',   file:'decision-roulette.html',      emoji:'🎰',color:['#1a0000','#2a0a00'],category:'other',      tags:[]},
  {name:'Case Board',          file:'case-board.html',             emoji:'🔎',color:['#0a0a0a','#141414'],category:'puzzle',     tags:[]},
  {name:'Roach Rave',          file:'roach-rave.html',             emoji:'🪳',color:['#0d0a00','#1a1400'],category:'other',      tags:[],blurb:'Paste a YouTube link, watch roaches dance to it'},
  {name:'Nothing',             file:'nothing.html',                emoji:'⬜',color:['#080808','#101010'],category:'other',      tags:[]},
];

// ── CANVAS DRAWING HELPERS ──
const _F=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
const _C=(c,x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,6.28);c.fill()};
const _L=(c,x1,y1,x2,y2,col,lw=1)=>{c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke()};
const _GV=(c,x,y,w,h,...s)=>{const g=c.createLinearGradient(x,y,x,y+h);s.forEach((v,i)=>g.addColorStop(i/(s.length-1),v));c.fillStyle=g;c.fillRect(x,y,w,h)};
const _ST=(c,n=35)=>{for(let i=0;i<n;i++){const x=(i*137.5)%320,y=(i*97.3)%200,s=i%7<1?2:1;c.fillStyle=`rgba(255,255,255,${.3+i%4*.17})`;c.fillRect(x,y,s,s)}};
const _SC=(c)=>{for(let y=0;y<200;y+=4){c.fillStyle='rgba(0,0,0,0.1)';c.fillRect(0,y+2,320,2)}};

// ── THUMBNAIL DRAW FUNCTIONS ──
const DRAW={

'idle-universe':(c)=>{
  const g=c.createRadialGradient(160,104,0,160,104,190); g.addColorStop(0,'#1c1238'); g.addColorStop(1,'#04030c'); c.fillStyle=g; c.fillRect(0,0,320,200);
  _ST(c,60);
  // nebula wash
  [[70,60,70,'255,90,180'],[250,150,80,'60,200,255'],[230,40,50,'160,110,255']].forEach(([x,y,r,col])=>{ const n=c.createRadialGradient(x,y,0,x,y,r); n.addColorStop(0,`rgba(${col},.32)`); n.addColorStop(1,`rgba(${col},0)`); c.fillStyle=n; c.fillRect(0,0,320,200); });
  // orbits + planets around a young star
  c.strokeStyle='rgba(190,200,255,.18)'; c.lineWidth=1;
  [[60,20],[92,30],[124,41]].forEach(([rx,ry])=>{ c.beginPath(); c.ellipse(160,104,rx,ry,0,0,6.283); c.stroke(); });
  const s=c.createRadialGradient(160,104,0,160,104,46); s.addColorStop(0,'rgba(255,255,240,1)'); s.addColorStop(.25,'rgba(255,220,130,.9)'); s.addColorStop(1,'rgba(255,170,60,0)'); c.fillStyle=s; c.beginPath(); c.arc(160,104,46,0,6.283); c.fill();
  c.strokeStyle='rgba(255,180,80,.9)'; c.lineWidth=2.5; c.beginPath(); c.ellipse(160,104,24,9,0,3.4,6.0); c.stroke();
  _C(c,218,113,6,'#c99b6a'); _C(c,94,93,5,'#3aa0ff'); _C(c,92,91,2.5,'#46d17a'); _C(c,268,88,4,'#9c7fc9');
  // quark triplets drifting in from the edges
  [[34,160],[290,170],[40,30]].forEach(([x,y])=>{ ['#ff4d5a','#4dff88','#4d8aff'].forEach((col,i)=>_C(c,x+Math.cos(i*2.1)*5,y+Math.sin(i*2.1)*5,2.2,col)); });
  // a comet
  for(let i=0;i<22;i++){ c.fillStyle=`rgba(255,220,130,${(1-i/22)*.55})`; c.fillRect(250+i*2.2,22+i*.8,3,2); }
  _C(c,250,22,3.5,'#fff3c4');
  c.font='bold 13px Orbitron, monospace'; c.fillStyle='rgba(255,255,255,.9)'; c.textAlign='left'; c.fillText('1.000 Qa',14,24);
  _SC(c);
},

'be-the-dungeon':(c)=>{
  _F(c,0,0,320,200,'#0e0a10');
  const T=20;
  // a winding tunnel carved through rock
  const floor=[[0,5],[1,5],[2,5],[3,5],[3,4],[3,3],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[9,7],[10,7],[11,7],[12,7],[12,6],[12,5],[12,4],[12,3],[13,3],[14,3],[14,4],[14,5],[14,6],[15,5],[15,6],[13,5],[13,6]];
  for(let y=0;y<10;y++) for(let x=0;x<16;x++){ const h=((x*73+y*151)%17)/17; _F(c,x*T,y*T,T,T,`rgb(${14+h*8|0},${10+h*6|0},${16+h*8|0})`); }
  floor.forEach(([x,y])=>{ _F(c,x*T,y*T,T,T,'#4a3e48'); _F(c,x*T+1,y*T+1,T/2-1,T/2-1,'#564852'); _F(c,x*T+T/2,y*T+T/2,T/2-1,T/2-1,'#50434d'); });
  // wall faces
  floor.forEach(([x,y])=>{ if(!floor.some(([a,b])=>a===x&&b===y-1)) _F(c,x*T,y*T-6,T,6,'#4e3f48'); });
  // torchlight + the heart's glow
  [[60,30],[170,130],[250,50]].forEach(([x,y])=>{ const g=c.createRadialGradient(x,y,0,x,y,60); g.addColorStop(0,'rgba(255,150,60,.28)'); g.addColorStop(1,'rgba(255,150,60,0)'); c.fillStyle=g; c.fillRect(0,0,320,200); _C(c,x,y-4,3,'#ffb050'); });
  const hg=c.createRadialGradient(290,110,0,290,110,70); hg.addColorStop(0,'rgba(255,40,80,.5)'); hg.addColorStop(1,'rgba(255,40,80,0)'); c.fillStyle=hg; c.fillRect(0,0,320,200);
  // the heart
  c.save(); c.translate(290,112); c.fillStyle='#e0334a'; c.beginPath(); c.moveTo(0,14); c.bezierCurveTo(-22,0,-15,-19,-5,-15); c.bezierCurveTo(-2,-14,0,-11,0,-9); c.bezierCurveTo(0,-11,2,-14,5,-15); c.bezierCurveTo(15,-19,22,0,0,14); c.fill(); c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-7,-7,3,5,-.5,0,6.283); c.fill(); c.restore();
  // traps and the raiders' planned route
  c.strokeStyle='rgba(255,90,70,.7)'; c.lineWidth=2; c.setLineDash([5,5]); c.beginPath(); c.moveTo(0,110); c.lineTo(70,110); c.lineTo(70,50); c.lineTo(170,50); c.lineTo(170,150); c.lineTo(250,150); c.lineTo(250,70); c.lineTo(290,70); c.lineTo(290,105); c.stroke(); c.setLineDash([]);
  [[70,70],[210,150]].forEach(([x,y])=>{ for(let a=0;a<3;a++) for(let b=0;b<3;b++){ c.fillStyle='#d8d0d8'; c.beginPath(); c.moveTo(x-7+a*7-2,y-5+b*6+2); c.lineTo(x-7+a*7,y-5+b*6-4); c.lineTo(x-7+a*7+2,y-5+b*6+2); c.fill(); } });
  // a raider with a torch and a goblin waiting for him
  _C(c,120,50,9,'rgba(255,200,120,.25)'); _F(c,116,46,8,9,'#c0392b'); _C(c,120,42,4,'#f0c8a0'); _L(c,125,48,131,38,'#ddd',2);
  _C(c,152,52,6,'#5aa040'); c.fillStyle='#5aa040'; c.beginPath(); c.moveTo(148,50); c.lineTo(140,46); c.lineTo(149,54); c.moveTo(156,50); c.lineTo(164,46); c.lineTo(155,54); c.fill(); _F(c,149,50,2,2,'#ffe14a'); _F(c,154,50,2,2,'#ffe14a');
  // the guild's eye
  _C(c,296,22,12,'rgba(0,0,0,.7)'); c.fillStyle='#f4e8d8'; c.beginPath(); c.ellipse(296,22,9,5.5,0,0,6.283); c.fill(); _C(c,296,22,4,'#c0303a'); _C(c,296,22,1.8,'#000');
  _SC(c);
},

'shape-conquest':(c)=>{
  _GV(c,0,0,320,200,'#0b1320','#0d1624','#111d30');
  c.strokeStyle='rgba(120,150,200,.07)';c.lineWidth=1;
  for(let x=0;x<320;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,200);c.stroke()}
  for(let y=0;y<200;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(320,y);c.stroke()}
  // three flat countries: yours (gold) pushing into two neighbours
  const land=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
    c.strokeStyle='#0b1220';c.lineWidth=2;c.stroke()};
  land([[20,40],[120,28],[150,70],[140,150],[60,172],[14,120]],'#f0bf3a');
  land([[120,28],[230,18],[250,90],[190,110],[150,70]],'#5a8fd6');
  land([[150,70],[190,110],[250,90],[300,130],[270,188],[140,150]],'#57c08f');
  const cap=(x,y,col)=>{_C(c,x,y,7,'#0b1220');_C(c,x,y,5,col);_C(c,x,y,2,'#0b1220')};
  cap(80,100,'#f0bf3a');cap(195,60,'#5a8fd6');cap(225,140,'#57c08f');
  // the shape army on the march
  const sh=(t,x,y,col)=>{c.fillStyle=col;c.strokeStyle='#060a12';c.lineWidth=1.5;c.beginPath();
    if(t===0)c.arc(x,y,5,0,6.283);else if(t===1)c.rect(x-5,y-5,10,10);
    else if(t===2){c.moveTo(x,y-7);c.lineTo(x+6,y+5);c.lineTo(x-6,y+5);c.closePath()}
    else{c.moveTo(x+8,y);c.lineTo(x,y+5);c.lineTo(x-6,y);c.lineTo(x,y-5);c.closePath()}c.fill();c.stroke()};
  [[1,150,108],[1,164,120],[0,158,94],[0,172,104],[0,146,124],[2,128,112],[2,120,96],[3,184,70],[3,200,86]].forEach(([t,x,y])=>sh(t,x,y,'#fff3b0'));
  [[0,212,128],[0,222,120],[1,236,132]].forEach(([t,x,y])=>sh(t,x,y,'#b9f0d4'));
  c.strokeStyle='rgba(255,240,200,.8)';c.lineWidth=1;
  c.beginPath();c.moveTo(172,104);c.lineTo(212,128);c.moveTo(128,112);c.lineTo(218,138);c.stroke();
  c.fillStyle='rgba(255,170,80,.35)';c.beginPath();c.arc(222,138,10,0,6.283);c.fill();
  c.fillStyle='#f0bf3a';c.font='bold 15px system-ui,sans-serif';c.fillText('SHAPE CONQUEST',12,24);
},

'imposter':(c)=>{
  _GV(c,0,0,320,200,'#0e0610','#170812','#200a14');
  // a circle of cards: four show the word, one shows the imposter
  const card=(x,y,r,face,imp)=>{c.save();c.translate(x,y);c.rotate(r);
    c.fillStyle='rgba(0,0,0,.4)';c.fillRect(-25,-33,54,70);
    c.fillStyle=imp?'#2a0a14':'#16112c';c.fillRect(-28,-36,54,70);
    c.strokeStyle=imp?'#ff3355':'rgba(0,245,255,.6)';c.lineWidth=2;c.strokeRect(-28,-36,54,70);
    c.textAlign='center';c.fillStyle=imp?'#ff3355':'#00f5ff';c.font=imp?'26px sans-serif':'bold 11px monospace';
    c.fillText(face,-1,imp?8:4);c.restore();};
  card(56,96,-0.28,'PIZZA',0);card(116,78,-0.1,'PIZZA',0);card(178,74,0.06,'?',1);card(240,82,0.2,'PIZZA',0);
  // the suspicious eyes
  c.fillStyle='#f4e8d8';c.beginPath();c.ellipse(166,150,10,6,0,0,6.283);c.ellipse(192,150,10,6,0,0,6.283);c.fill();
  _C(c,170,151,3.2,'#111');_C(c,196,151,3.2,'#111');
  c.textAlign='left';c.fillStyle='#ff3355';c.font='bold 15px system-ui,sans-serif';c.fillText('IMPOSTER',12,186);
  c.fillStyle='rgba(255,255,255,.55)';c.font='bold 11px system-ui,sans-serif';c.fillText('one of you is faking it',100,186);
},

'most-likely-to':(c)=>{
  _GV(c,0,0,320,200,'#120c06','#1a0e12','#22101c');
  c.textAlign='center';c.fillStyle='#ff4fa3';c.font='bold 11px system-ui,sans-serif';c.fillText('WHO\'S MOST LIKELY TO…',160,26);
  c.fillStyle='#fff5e8';c.font='bold 15px monospace';c.fillText('cry at a sad film?',160,48);
  // vote bars
  [['#ffc93c',150,'MUM'],['#00f5ff',96,'DAD'],['#00ff88',52,'NAN']].forEach(([col,w,n],i)=>{
    c.fillStyle='rgba(255,255,255,.06)';c.fillRect(92,68+i*26,170,18);
    c.fillStyle=col;c.fillRect(92,68+i*26,w,18);
    c.textAlign='right';c.fillStyle='#fff5e8';c.font='bold 12px system-ui,sans-serif';c.fillText(n,84,81+i*26);});
  // a gold crown over the winner, and a big one bottom-right
  const crown=(x,y,k)=>{c.fillStyle='#ffc93c';c.beginPath();c.moveTo(x-12*k,y+8*k);c.lineTo(x-12*k,y-6*k);c.lineTo(x-6*k,y+1*k);c.lineTo(x,y-10*k);
    c.lineTo(x+6*k,y+1*k);c.lineTo(x+12*k,y-6*k);c.lineTo(x+12*k,y+8*k);c.closePath();c.fill();
    _C(c,x,y-10*k,2*k,'#ff4fa3');_C(c,x-12*k,y-6*k,1.6*k,'#00f5ff');_C(c,x+12*k,y-6*k,1.6*k,'#00f5ff');};
  crown(258,76,0.8);crown(276,158,1.7);
  c.textAlign='left';c.fillStyle='#ffc93c';c.font='bold 15px system-ui,sans-serif';c.fillText('MOST LIKELY TO',12,188);
},

'rhyme-bomb':(c)=>{
  _GV(c,0,0,320,200,'#0c0614','#1a0b16','#24100a');
  // the word, with rhymes floating off it
  c.textAlign='center';c.fillStyle='#ffe600';c.font='bold 44px monospace';c.fillText('CAT',196,92);
  c.font='bold 15px system-ui,sans-serif';
  [['hat',122,40,'#00f5ff'],['splat',270,44,'#ff0080'],['acrobat',262,128,'#00ff88'],['bat',150,136,'#ff8a00']].forEach(([w,x,y,col])=>{c.fillStyle=col;c.fillText(w,x,y);});
  // the bomb and its lit fuse
  c.fillStyle='#1b1b24';c.beginPath();c.arc(62,118,34,0,6.283);c.fill();
  c.fillStyle='rgba(255,255,255,0.18)';c.beginPath();c.arc(50,104,10,0,6.283);c.fill();
  c.fillStyle='#3a3a48';c.fillRect(70,76,16,12);
  c.strokeStyle='#c9a36b';c.lineWidth=3;c.beginPath();c.moveTo(80,78);c.quadraticCurveTo(96,58,112,64);c.stroke();
  c.fillStyle='#ffe600';c.beginPath();c.arc(114,63,6,0,6.283);c.fill();
  c.fillStyle='#ff8a00';c.beginPath();c.arc(114,63,3,0,6.283);c.fill();
  c.textAlign='left';c.fillStyle='#ff8a00';c.font='bold 15px system-ui,sans-serif';c.fillText('RHYME BOMB',12,186);
},

'scrawl':(c)=>{
  _GV(c,0,0,320,200,'#0a0614','#140c26','#1c1030');
  // the sketch board, slightly tilted like a page on a desk
  c.save();c.translate(112,104);c.rotate(-0.05);
  c.fillStyle='rgba(0,0,0,0.35)';c.fillRect(-86,-66,180,136);
  c.fillStyle='#fdfdfd';c.fillRect(-92,-72,180,136);
  c.lineCap='round';c.lineJoin='round';
  // a wobbly crayon house with a sun
  c.strokeStyle='#222';c.lineWidth=4;c.beginPath();
  c.moveTo(-52,40);c.lineTo(-50,-4);c.lineTo(24,-2);c.lineTo(22,41);c.closePath();c.stroke();
  c.fillStyle='#ffd400';c.beginPath();c.moveTo(-60,-2);c.lineTo(-14,-42);c.lineTo(32,-1);c.closePath();c.fill();
  c.strokeStyle='#ff2d55';c.stroke();
  c.fillStyle='#2979ff';c.fillRect(-18,14,16,27);
  c.strokeStyle='#ff8a00';c.lineWidth=3;c.beginPath();c.arc(58,-40,12,0,Math.PI*2);c.stroke();
  for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(58+Math.cos(a)*17,-40+Math.sin(a)*17);c.lineTo(58+Math.cos(a)*23,-40+Math.sin(a)*23);c.stroke();}
  c.restore();
  // the word, still hidden
  c.fillStyle='#ffe600';c.font='bold 13px monospace';c.fillText('_ _ _ _ _',74,26);
  // guesses flying in
  const bub=(x,y,w,t,col)=>{c.fillStyle='rgba(8,12,28,0.92)';c.fillRect(x,y,w,20);c.fillStyle=col;c.fillRect(x,y,3,20);
    c.fillStyle='#dfe7ff';c.font='bold 11px sans-serif';c.fillText(t,x+8,y+14);};
  bub(214,58,96,'boat?','#00f5ff');
  bub(222,88,88,'castle','#b300ff');
  bub(206,118,104,'is close!','#ffe600');
  c.fillStyle='rgba(0,255,136,0.95)';c.fillRect(210,150,100,20);
  c.fillStyle='#02150b';c.font='bold 11px sans-serif';c.fillText('Mo got it!',218,164);
  // the crayon
  c.save();c.translate(200,176);c.rotate(-0.7);
  c.fillStyle='#ff0080';c.fillRect(0,-5,46,10);c.fillStyle='#ffd6e8';c.beginPath();c.moveTo(0,-5);c.lineTo(-12,0);c.lineTo(0,5);c.fill();
  c.restore();
  _SC(c);
},

'gridlock':(c)=>{
  _GV(c,0,0,320,200,'#04060e','#060c18','#0a1a34');
  // the arena floor
  c.strokeStyle='rgba(0,245,255,0.07)';c.lineWidth=1;c.beginPath();
  for(let x=0;x<=320;x+=16){c.moveTo(x+.5,0);c.lineTo(x+.5,200);}
  for(let y=0;y<=200;y+=16){c.moveTo(0,y+.5);c.lineTo(320,y+.5);}
  c.stroke();
  c.strokeStyle='rgba(0,245,255,0.45)';c.lineWidth=2;c.strokeRect(9,9,302,182);
  // three cycles, each boxing the next one in
  const ride=(pts,col)=>{
    c.strokeStyle=col;c.lineWidth=5;c.lineCap='butt';c.lineJoin='miter';
    c.beginPath();c.moveTo(pts[0],pts[1]);
    for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);
    c.stroke();
    c.save();c.shadowColor=col;c.shadowBlur=12;
    _F(c,pts[pts.length-2]-5,pts[pts.length-1]-5,10,10,col);c.restore();
  };
  ride([26,40,150,40,150,120,84,120,84,74],'#00f5ff');
  ride([292,160,190,160,190,64,246,64,246,112],'#ff0080');
  ride([120,182,120,146,232,146,232,182],'#00ff88');
  // a pickup waiting to be taken
  c.strokeStyle='#ffe600';c.lineWidth=2;c.strokeRect(58,158,12,12);
  c.fillStyle='rgba(255,230,0,0.35)';c.fillRect(58,158,12,12);
  _SC(c);
},

'patch-notes':(c)=>{
  _GV(c,0,0,320,200,'#07090c','#0b0f14','#121922');
  // the changelog itself: buff and nerf lines in diff green and red
  const rows=[[1,74],[0,96],[1,58],[0,84],[1,66]];
  c.textAlign='left';c.textBaseline='middle';
  rows.forEach(([buff,w],i)=>{
    const y=30+i*24;
    _F(c,12,y-10,176,20,buff?'rgba(63,185,80,0.10)':'rgba(248,81,73,0.10)');
    _F(c,12,y-10,2,20,buff?'#3fb950':'#f85149');
    c.fillStyle=buff?'#3fb950':'#f85149';c.font='10px monospace';c.fillText(buff?'+':'−',21,y);
    _F(c,32,y-3,w,2,'rgba(213,221,229,0.5)');
    _F(c,32,y+3,w*0.55,2,'rgba(213,221,229,0.2)');
  });
  _F(c,12,4,58,14,'#0d1a11');c.strokeStyle='#1c3a24';c.lineWidth=1;c.strokeRect(12.5,4.5,57,13);
  c.fillStyle='#3fb950';c.font='9px monospace';c.fillText('v0.1.14',17,11.5);

  // one card taking the hit, with a sibling behind it for depth
  c.save();c.translate(238,104);c.rotate(0.07);
  _F(c,-34,-52,68,104,'#0d1117');c.strokeStyle='#2c3947';c.lineWidth=1;c.strokeRect(-34.5,-52.5,69,105);
  c.restore();
  c.save();c.translate(258,100);c.rotate(-0.05);
  _F(c,-38,-56,76,112,'#121922');
  c.strokeStyle='#f85149';c.lineWidth=1.5;c.strokeRect(-38.5,-56.5,77,113);
  _F(c,-27,-42,46,2,'rgba(213,221,229,0.6)');           // title rule
  c.fillStyle='#f85149';c.font='7px monospace';c.textAlign='left';c.fillText('FIRE',-27,-31);
  // the patched number: base struck through, new value in green
  c.fillStyle='#5a6672';c.font='15px monospace';c.fillText('9',-25,4);
  c.strokeStyle='#f85149';c.lineWidth=1.4;c.beginPath();c.moveTo(-28,3);c.lineTo(-15,3);c.stroke();
  c.fillStyle='#3fb950';c.font='bold 20px monospace';c.fillText('14',-8,4);
  _F(c,-27,26,52,2,'rgba(213,221,229,0.22)');
  _F(c,-27,34,36,2,'rgba(213,221,229,0.22)');
  _C(c,-38,-56,11,'#171208');c.strokeStyle='#d29922';c.lineWidth=1.5;c.beginPath();c.arc(-38,-56,11,0,6.28);c.stroke();
  c.fillStyle='#d29922';c.font='bold 12px monospace';c.textAlign='center';c.fillText('2',-38,-51.5);
  c.restore();
  _SC(c);
},

'midnight-post':(c)=>{
  // the gate window at night: a face under the sodium lamp, torch-lit eyes shining back, the red barrier arm
  _GV(c,0,0,320,200,'#05070b','#0c0f10','#1a140a');
  const lamp=c.createRadialGradient(120,10,4,120,90,170);lamp.addColorStop(0,'rgba(255,170,70,.35)');lamp.addColorStop(1,'rgba(255,170,70,0)');c.fillStyle=lamp;c.fillRect(0,0,320,200);
  _F(c,14,80,212,120,'#15181a');
  // torch shadow on the wall, then the visitor
  c.save();c.filter='blur(4px)';_C(c,150,112,40,'rgba(0,0,0,.55)');c.restore();c.filter='none';
  c.fillStyle='#3d4a2c';c.beginPath();c.moveTo(62,200);c.quadraticCurveTo(64,152,104,146);c.lineTo(136,146);c.quadraticCurveTo(176,152,178,200);c.fill();
  _F(c,112,128,16,22,'#c99169');
  c.fillStyle='#c99169';c.beginPath();c.ellipse(120,104,30,36,0,0,6.283);c.fill();
  c.fillStyle='#1b1410';c.beginPath();c.ellipse(120,86,31,22,0,3.1416,6.283);c.fill();
  c.save();c.shadowColor='#e8ff7a';c.shadowBlur=12;_C(c,109,100,4.2,'#f2ff9c');_C(c,131,100,4.2,'#f2ff9c');c.restore();
  c.fillStyle='#2a0d0b';c.beginPath();c.ellipse(120,122,11,6,0,0,6.283);c.fill();
  c.fillStyle='#f1ede2';for(let i=0;i<8;i++){const x=109+i*2.75;c.beginPath();c.moveTo(x,116);c.lineTo(x+1.4,120);c.lineTo(x+2.75,116);c.fill();c.beginPath();c.moveTo(x,128);c.lineTo(x+1.4,124);c.lineTo(x+2.75,128);c.fill();}
  // torch beam
  c.save();c.globalCompositeOperation='lighter';const b=c.createRadialGradient(120,104,0,120,104,80);b.addColorStop(0,'rgba(255,250,225,.22)');b.addColorStop(1,'rgba(255,250,225,0)');c.fillStyle=b;c.fillRect(0,0,320,200);c.restore();
  // rain
  c.strokeStyle='rgba(170,190,210,.25)';c.lineWidth=1;c.beginPath();for(let i=0;i<40;i++){const x=(i*71.3)%230,y=(i*43.7)%200;c.moveTo(x,y);c.lineTo(x-2,y+9);}c.stroke();
  // window frame + booth side
  _F(c,0,0,320,8,'#0d110e');_F(c,0,0,8,200,'#0d110e');_F(c,226,0,94,200,'#0d110e');
  // barrier arm + the stamps on the desk
  _F(c,252,60,8,60,'#3a3a3a');c.save();c.translate(256,64);c.rotate(-0.5);for(let i=0;i<5;i++)_F(c,-2+i*14,-4,14,8,i%2?'#f1ede2':'#d32f2f');c.restore();
  c.font='900 13px sans-serif';c.textAlign='center';
  c.save();c.translate(272,150);c.rotate(-.18);c.strokeStyle='#5fd47e';c.lineWidth=2;c.strokeRect(-36,-12,72,22);c.fillStyle='#5fd47e';c.fillText('ADMIT',0,4);c.restore();
  c.save();c.translate(272,182);c.rotate(.12);c.fillStyle='#c4221a';c.fillRect(-38,-12,76,22);c.fillStyle='#fff';c.fillText('DETAIN',0,4);c.restore();
  c.fillStyle='#ff6b3d';c.font='700 14px monospace';c.fillText('03:12',272,28);
  _SC(c);
},

'seven-liars':(c)=>{
  _GV(c,0,0,320,200,'#06080b','#0b131b','#101a24');
  // the bulb over the table, and the cone of light everything else sits in
  _L(c,160,0,160,17,'#1e2a36',2);
  c.save();c.shadowColor='rgba(255,220,160,.55)';c.shadowBlur=16;_C(c,160,23,7,'#ffe6a8');c.restore();
  const cone=c.createLinearGradient(160,26,160,200);
  cone.addColorStop(0,'rgba(255,224,166,.16)');cone.addColorStop(1,'rgba(255,224,166,0)');
  c.fillStyle=cone;c.beginPath();c.moveTo(160,26);c.lineTo(292,200);c.lineTo(28,200);c.closePath();c.fill();
  // seven statements, four hours each — green agrees, red is denied, one is proof
  const st=[[1,1,1,1],[1,0,1,1],[1,1,3,0],[0,1,1,1],[1,1,2,1],[1,0,1,0],[1,1,3,1]];
  const col=['#111a23','#0d2117','#08222b','#26101a'];
  const bd =['#26333f','#1f5236','#2a6d80','#5a2530'];
  for(let r=0;r<7;r++)for(let h=0;h<4;h++){
    const x=76+h*44,y=52+r*19,v=st[r][h];
    _F(c,x,y,38,14,col[v]);
    c.strokeStyle=bd[v];c.lineWidth=1;c.strokeRect(x+.5,y+.5,37,13);
    if(v===3){c.save();c.shadowColor='rgba(255,77,94,.8)';c.shadowBlur=6;c.strokeRect(x+.5,y+.5,37,13);c.restore();}
    if(v===2){c.save();c.shadowColor='rgba(111,211,236,.7)';c.shadowBlur=6;c.strokeRect(x+.5,y+.5,37,13);c.restore();}
  }
  // the seven of them down the left, one already crossed off
  for(let r=0;r<7;r++){
    const y=52+r*19;
    _C(c,44,y+7,5,r===2?'#5a2530':'#2b3a49');
    _F(c,54,y+5,16,4,r===2?'#ff4d5e':'#3d4b58');
  }
  // the hour it happened
  _F(c,164,42,38,3,'#ff4d5e');
  _SC(c);
},

'fatespine':(c)=>{
  _GV(c,0,0,320,200,'#050308','#12061f','#24103a');
  // the Spine: a branching graph of nights, drawn behind everything
  const nodes=[[42,150],[78,132],[114,150],[152,128],[190,146],[228,124],[264,142],[290,112]];
  c.strokeStyle='rgba(122,80,180,.55)'; c.lineWidth=1.5;
  for(let i=0;i<nodes.length-1;i++){
    c.beginPath(); c.moveTo(nodes[i][0],nodes[i][1]);
    c.bezierCurveTo((nodes[i][0]+nodes[i+1][0])/2,nodes[i][1],
                    (nodes[i][0]+nodes[i+1][0])/2,nodes[i+1][1],
                    nodes[i+1][0],nodes[i+1][1]);
    c.stroke();
  }
  // the one edge that only exists because you changed something
  c.strokeStyle='#ffd24a'; c.lineWidth=2; c.setLineDash([4,3]);
  c.beginPath(); c.moveTo(152,128); c.lineTo(150,74); c.stroke(); c.setLineDash([]);
  const hex=(x,y,r,fill,stroke)=>{
    c.beginPath();
    for(let k=0;k<6;k++){const a=k/6*6.283; const px=x+Math.cos(a)*r, py=y+Math.sin(a)*r; k?c.lineTo(px,py):c.moveTo(px,py);}
    c.closePath(); c.fillStyle=fill; c.fill(); c.strokeStyle=stroke; c.lineWidth=1.5; c.stroke();
  };
  for(const n of nodes) hex(n[0],n[1],7,'#1c1430','#5a76a8');
  hex(152,128,8,'#2a1a08','#ffd24a');
  // the amber Fracture hanging off it
  c.save(); c.translate(150,70); c.rotate(0.785);
  _F(c,-7,-7,14,14,'#3a2a08');
  c.strokeStyle='#ffb01f'; c.lineWidth=2; c.strokeRect(-7,-7,14,14); c.restore();
  // neon ledges
  _F(c,24,176,120,2,'#ff3ad0'); _F(c,196,176,104,2,'#ff3ad0');
  _F(c,96,44,86,2,'rgba(255,58,208,.45)');
  // you, and the two of you that came before
  const vek=(x,y,col,al)=>{
    c.globalAlpha=al; c.fillStyle=col;
    c.beginPath(); c.moveTo(x-8,y); c.lineTo(x-7,y-26); c.lineTo(x-2,y-33);
    c.lineTo(x+3,y-33); c.lineTo(x+8,y-25); c.lineTo(x+9,y); c.closePath(); c.fill();
    c.fillStyle='#ffffff'; c.globalAlpha=al*0.9; _F(c,x+1,y-28,3,2,'#ffffff');
    c.globalAlpha=1;
  };
  vek(52,176,'#2ec6ff',.28); vek(80,176,'#3ad8ff',.42); vek(112,176,'#48e8ff',1);
  // the rewind tear
  c.globalAlpha=.5; _F(c,0,88,320,3,'#ff0044'); _F(c,4,91,320,2,'#00ffee'); c.globalAlpha=1;
  // chrono filmstrip
  for(let i=0;i<5;i++){
    _F(c,120+i*17,12,14,8,i<3?'#ff3ad0':'#1a1030');
    _F(c,120+i*17,10,14,1,'#0a0614');
  }
  _SC(c);
},

'blast-radius':(c)=>{
  _GV(c,0,0,320,200,'#03040c','#080e22','#141d44');
  _ST(c,24);
  // moon with a soft halo
  const mg=c.createRadialGradient(258,34,0,258,34,46);
  mg.addColorStop(0,'rgba(255,240,200,.26)'); mg.addColorStop(1,'rgba(255,240,200,0)');
  c.fillStyle=mg; c.beginPath(); c.arc(258,34,46,0,6.28); c.fill();
  _C(c,258,34,13,'#f6efd6'); _C(c,262,30,4,'rgba(120,130,160,.3)');
  // rolling ground, deep band under a neon crest
  const hy=x=>146+Math.sin(x*0.0195+0.6)*16+Math.sin(x*0.052+2.1)*6;
  const fillTo=(off,col)=>{ c.beginPath(); c.moveTo(0,200);
    for(let x=0;x<=320;x+=4) c.lineTo(x,hy(x)+off);
    c.lineTo(320,200); c.closePath(); c.fillStyle=col; c.fill(); };
  fillTo(0,'#12313f'); fillTo(9,'#0a1e2c');
  c.save(); c.shadowColor='rgba(60,255,190,.85)'; c.shadowBlur=8;
  c.strokeStyle='#3dffc0'; c.lineWidth=2; c.beginPath();
  for(let x=0;x<=320;x+=4){ if(x) c.lineTo(x,hy(x)); else c.moveTo(x,hy(x)); }
  c.stroke(); c.restore();
  // the shell's arc, mid-flight
  for(let i=0;i<=22;i++){ const t=i/22, x=48+t*180, y=hy(48)-10-88*Math.sin(Math.PI*t)+t*14;
    c.fillStyle='rgba(255,208,90,'+(0.22+0.62*(1-t)).toFixed(2)+')'; c.fillRect(x-1.5,y-1.5,3,3); }
  // impact
  const ex=234, ey=hy(234)-3;
  const eg=c.createRadialGradient(ex,ey,0,ex,ey,36);
  eg.addColorStop(0,'#fff6d8'); eg.addColorStop(.32,'#ffb03a');
  eg.addColorStop(.68,'rgba(255,80,20,.42)'); eg.addColorStop(1,'rgba(255,60,0,0)');
  c.fillStyle=eg; c.beginPath(); c.arc(ex,ey,36,0,6.28); c.fill();
  for(let i=0;i<11;i++){ const a=i*0.62, r=17+(i*7)%15;
    _F(c,ex+Math.cos(a)*r,ey+Math.sin(a)*r*0.8,2,2,'#ffe600'); }
  // the duellists
  const tank=(x,col,fill,ang)=>{
    const y=hy(x)+2;
    c.save(); c.strokeStyle=col; c.lineWidth=4; c.lineCap='round';
    c.shadowColor=col; c.shadowBlur=9;
    c.beginPath(); c.moveTo(x,y-11); c.lineTo(x+Math.cos(ang)*21,y-11-Math.sin(ang)*21); c.stroke(); c.restore();
    c.fillStyle=fill; c.strokeStyle=col; c.lineWidth=2;
    c.beginPath(); c.moveTo(x-15,y-3); c.lineTo(x-11,y-12); c.lineTo(x+11,y-12); c.lineTo(x+15,y-3);
    c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(x,y-12,6,Math.PI,0); c.fill(); c.stroke();
    _F(c,x-15,y-3,30,4,'#0b1220');
    for(let i=0;i<5;i++) _F(c,x-12+i*6,y-2,2,2,col);
  };
  tank(48,'#00f5ff','#063a49',0.85);
  tank(268,'#ff0080','#4a0327',Math.PI-0.85);
  _SC(c);
},

'neon-frag':(c)=>{
  _GV(c,0,0,320,100,'#0a0f22','#1b2448');
  _GV(c,0,100,320,100,'#0b1020','#050810');
  // corridor walls in one-point perspective, meeting at the vanishing point
  const vp=[160,100];
  [[0,-1],[320,1]].forEach(([x,dir])=>{
    c.fillStyle=dir<0?'#0d5f80':'#0a4a66';
    c.beginPath(); c.moveTo(x,20); c.lineTo(x,180);
    c.lineTo(vp[0]-dir*54,vp[1]+34); c.lineTo(vp[0]-dir*54,vp[1]-34); c.closePath(); c.fill();
  });
  _F(c,106,66,108,68,'#7a0f3e');                       // back wall
  _F(c,106,66,108,4,'#ff2b8a');
  for(let i=1;i<5;i++) _L(c,0,100+i*i*3,320,100+i*i*3,'rgba(0,245,255,.09)',1);
  _C(c,160,104,7,'#ff2b8a');                            // opponent, mid-corridor
  _F(c,155,104,10,20,'#c9145f');
  // crosshair + gun
  _L(c,160,88,160,96,'#00f5ff',2); _L(c,160,112,160,120,'#00f5ff',2);
  _L(c,148,104,156,104,'#00f5ff',2); _L(c,164,104,172,104,'#00f5ff',2);
  c.fillStyle='#0d1526'; c.strokeStyle='#00f5ff'; c.lineWidth=2;
  c.beginPath(); c.moveTo(196,200); c.lineTo(204,158); c.lineTo(232,146);
  c.lineTo(250,152); c.lineTo(246,178); c.lineTo(258,200); c.closePath(); c.fill(); c.stroke();
  _SC(c);
},

'mic-drop':(c)=>{
  _GV(c,0,0,320,200,'#3a1160','#07030f');
  _ST(c,22);
  // note highway
  [[18,120,52],[78,96,38],[124,140,46],[178,74,56],[240,110,60]].forEach(([x,y,w],i)=>{
    c.fillStyle=i===3?'#ffe600':'#a44bff';
    c.globalAlpha=i===3?1:.75;
    c.beginPath(); c.roundRect ? c.roundRect(x,y,w,11,6) : c.rect(x,y,w,11); c.fill();
  });
  c.globalAlpha=1;
  _L(c,96,44,96,168,'rgba(255,255,255,.5)',2);          // now-line
  _C(c,96,101,6,'#00f5ff');
  // mic
  c.fillStyle='#e9e2ff'; c.beginPath(); c.roundRect ? c.roundRect(268,120,20,38,10) : c.rect(268,120,20,38); c.fill();
  _F(c,276,158,4,18,'#8a7fb0'); _F(c,266,176,24,5,'#8a7fb0');
  c.fillStyle='rgba(255,0,128,.25)'; c.beginPath(); c.arc(278,139,26,0,6.28); c.fill();
  c.fillStyle='#ffe600'; c.font='bold 15px monospace'; c.textAlign='left';
  c.fillText('♪  ♫   ♪', 16, 34);
  _SC(c);
},

'wet-paint':(c)=>{
  // brick wall, and a Blank half-painted into it
  _F(c,0,0,320,200,'#6E3A2C');
  const BR=['#6E3A2C','#A85C3E','#3B1F1A'];
  for(let ry=0;ry<12;ry++){
    const off=(ry%2)*16;
    for(let rx=-1;rx<12;rx++){
      const bx=rx*32+off, by=ry*18;
      _F(c,bx+1,by+1,30,16,((rx*7+ry*3)%5<2)?BR[0]:BR[1]);
      _F(c,bx+3+((rx*5+ry)%22),by+4+((rx+ry*3)%10),2,2,BR[2]);
    }
    _F(c,0,ry*18,320,1,BR[2]);
  }
  // the body: left half painted to match, right half still primer white
  const BX=118,BY=54,BW=84,BH=104;
  for(let y=0;y<BH;y++)for(let x=0;x<BW;x++){
    const wx=BX+x, wy=BY+y;
    if(x<BW*0.52){
      const ry=((wy/18)|0), rx=(((wx-(ry%2)*16)/32)|0);
      c.fillStyle=(((wy%18)===0)?BR[2]:(((rx*7+ry*3)%5<2)?BR[0]:BR[1]));
    } else c.fillStyle='#FFFFFF';
    c.fillRect(wx,wy,1,1);
  }
  // eyes, so it reads as a creature
  _F(c,BX+52,BY+22,8,10,'#111'); _F(c,BX+70,BY+22,8,10,'#111');
  // a dripping brush and three sampled swatches
  _F(c,26,120,10,54,'#3B1F1A'); _F(c,24,112,14,10,'#838C9E');
  _F(c,27,168,8,16,'#A85C3E'); _F(c,29,186,3,8,'#A85C3E');
  ['#A85C3E','#4E7C47','#357C82'].forEach((col,i)=>{
    _F(c,258,20+i*24,40,18,'#000'); _F(c,260,22+i*24,36,14,col);
  });
  // title plate
  _F(c,0,0,320,22,'rgba(0,0,0,0.72)');
  c.fillStyle='#F5D648';c.font='bold 15px ui-monospace,monospace';
  c.fillText('WET PAINT',10,16);
  c.fillStyle='#B4B4B4';c.font='11px ui-monospace,monospace';
  c.fillText('HIDE BY HAND',196,16);
},

'magic-wand':(c)=>{
  _GV(c,0,0,320,200,'#1a0f33','#05030a');
  // glow behind the tip
  const g=c.createRadialGradient(96,72,0,96,72,90);
  g.addColorStop(0,'rgba(255,214,138,0.55)');g.addColorStop(.45,'rgba(199,125,255,0.18)');
  g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,320,200);
  // wand, tip upper-left → handle lower-right
  c.save();c.translate(96,72);c.rotate(0.72);
  const wg=c.createLinearGradient(0,0,84,0);
  wg.addColorStop(0,'#6b4a2a');wg.addColorStop(.5,'#3a2515');wg.addColorStop(1,'#1d120a');
  c.fillStyle=wg;
  c.beginPath();c.moveTo(2,-3.4);c.lineTo(46,-4.6);c.lineTo(84,-5.6);
  c.lineTo(84,5.6);c.lineTo(46,4.6);c.lineTo(2,3.4);c.closePath();c.fill();
  c.fillStyle='#c9a24a';c.fillRect(42,-5.2,5,10.4);c.fillRect(72,-6,6,12);
  c.restore();
  // sparkle stars trailing from the tip
  const star=(x,y,r,col)=>{c.save();c.translate(x,y);c.fillStyle=col;
    c.shadowColor=col;c.shadowBlur=r*2.4;c.beginPath();
    for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=(i%2)?r*.2:r;
      const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?c.lineTo(px,py):c.moveTo(px,py)}
    c.closePath();c.fill();c.restore()};
  star(96,72,15,'#fff6de');
  [[142,42,6],[168,64,4],[126,26,4],[60,40,5],[42,74,3],[186,36,3],[74,18,3]]
    .forEach(([x,y,r],i)=>star(x,y,r,i%2?'#ffd48a':'#ff9de0'));
  // little terminal window getting sped up
  _F(c,180,104,116,66,'rgba(6,4,12,0.9)');
  c.strokeStyle='rgba(255,160,90,0.35)';c.lineWidth=1;c.strokeRect(180.5,104.5,115,65);
  _F(c,180,104,116,11,'rgba(255,255,255,0.07)');
  _C(c,187,109.5,2.4,'#ff5f57');_C(c,195,109.5,2.4,'#febc2e');_C(c,203,109.5,2.4,'#28c840');
  ['#ffb37a','#7dffb0','#7dffb0','#b9aee0'].forEach((col,i)=>
    _F(c,186,122+i*10,[70,54,84,40][i],3,col));
  _F(c,186,162,8,4,'#ffb37a');
  // speed bar
  _F(c,24,182,272,8,'rgba(255,255,255,0.06)');
  const sg=c.createLinearGradient(24,0,250,0);
  sg.addColorStop(0,'#6b5cff');sg.addColorStop(.5,'#ff9de0');sg.addColorStop(1,'#ffd48a');
  c.fillStyle=sg;c.fillRect(24,182,226,8);
},

'neon-putt':(c)=>{
  _GV(c,0,0,320,200,'#05080f','#080d16');
  // neon green with a dogleg wall
  c.fillStyle='#0d2b2a';c.fillRect(24,34,272,132);
  c.save();c.beginPath();c.rect(24,34,272,132);c.clip();
  c.strokeStyle='rgba(80,255,200,0.05)';c.lineWidth=1;
  for(let y=-140;y<200;y+=12){_L(c,20,y,300,y+280,'rgba(80,255,200,0.05)',1);}
  c.restore();
  c.save();c.shadowColor='rgba(60,255,190,0.8)';c.shadowBlur=9;
  c.strokeStyle='#3dffc0';c.lineWidth=2.5;c.strokeRect(24,34,272,132);c.restore();
  // sand bunker + block
  c.fillStyle='rgba(226,190,110,0.20)';c.fillRect(96,116,54,38);
  c.strokeStyle='rgba(255,214,130,0.45)';c.lineWidth=1;c.strokeRect(96,116,54,38);
  c.fillStyle='#0a1626';c.fillRect(150,44,22,54);
  c.strokeStyle='#4fa8ff';c.lineWidth=2;c.strokeRect(150,44,22,54);
  // pink bumper
  c.save();c.shadowColor='#ff4fd8';c.shadowBlur=12;
  _C(c,206,132,13,'#2a0a20');c.strokeStyle='#ff4fd8';c.lineWidth=2.5;
  c.beginPath();c.arc(206,132,13,0,6.28);c.stroke();c.restore();
  // cup + flag
  c.save();c.shadowColor='#ffe98f';c.shadowBlur=10;
  _C(c,254,74,9,'#02060a');c.strokeStyle='#ffe27a';c.lineWidth=2;
  c.beginPath();c.arc(254,74,9,0,6.28);c.stroke();c.restore();
  _L(c,254,72,254,44,'#dfe9f2',2);
  c.fillStyle='#ff4f6b';c.beginPath();c.moveTo(255,44);c.lineTo(271,49);c.lineTo(255,55);c.fill();
  // aim line from ball
  c.fillStyle='rgba(180,245,255,0.55)';
  for(let i=0;i<7;i++)_C(c,78+i*13,110-i*4.5,2.4-i*0.18,'rgba(180,245,255,'+(0.6-i*0.06)+')');
  c.save();c.shadowColor='#bfefff';c.shadowBlur=10;_C(c,70,116,6,'#ffffff');c.restore();
  _SC(c);
},

'pixel-war':(c)=>{
  _GV(c,0,0,320,115,'#0c1a00','#1e3200');
  _GV(c,0,115,320,85,'#142800','#0e1e00');
  c.fillStyle='#0d2200';c.beginPath();c.moveTo(0,140);c.quadraticCurveTo(70,85,160,145);c.lineTo(160,200);c.lineTo(0,200);c.fill();
  c.beginPath();c.moveTo(320,135);c.quadraticCurveTo(250,88,160,145);c.lineTo(160,200);c.lineTo(320,200);c.fill();
  const tank=(tx,ty,dir,b,t)=>{
    _F(c,tx,ty,72,34,b);_F(c,tx+14,ty-18,38,20,t);
    _F(c,dir>0?tx+44:tx-30,ty-11,34,9,t);_F(c,tx-1,ty+30,74,13,'#111a08');
    for(let i=0;i<4;i++)_C(c,tx+10+i*18,ty+37,6,'#0a1006');
  };
  tank(28,93,1,'#4a5a2e','#363f22');tank(204,93,-1,'#5c3020','#402018');
  _C(c,162,92,30,'rgba(255,80,0,0.5)');_C(c,162,92,18,'rgba(255,160,0,0.7)');_C(c,162,92,8,'#ffe040');
  for(let i=0;i<8;i++){const a=i*Math.PI/4,r=42;_F(c,162+Math.cos(a)*r-2,92+Math.sin(a)*r-2,4,4,'#ff6600');}
  _SC(c);
},

'pixelwar':(c)=>{
  _GV(c,0,0,320,120,'#020408','#040810');_ST(c,25);
  _GV(c,0,120,320,80,'#0e1800','#0a1200');
  const tank=(tx,ty,dir,col)=>{_F(c,tx,ty,68,32,col);_F(c,tx+12,ty-16,36,18,col);_F(c,dir>0?tx+42:tx-28,ty-10,32,8,col);_F(c,tx-1,ty+28,70,12,'#050a02');};
  tank(30,95,1,'#223318');tank(200,95,-1,'#1e3320');tank(115,90,1,'#2a4022');
  _C(c,200,100,15,'rgba(255,150,0,0.7)');_C(c,200,100,7,'rgba(255,220,0,0.9)');
  _L(c,200,100,244,98,'rgba(255,200,0,0.5)',2);_SC(c);
},

'pixelwar-solo':(c)=>{
  _GV(c,0,0,320,130,'#040a00','#0e1c00');_GV(c,0,130,320,70,'#081400','#050e00');
  const rx=160,ry=95;
  c.strokeStyle='rgba(0,255,80,0.7)';c.lineWidth=1.5;c.beginPath();c.arc(rx,ry,42,0,6.28);c.stroke();
  [[rx-58,ry,rx-46,ry],[rx+46,ry,rx+58,ry],[rx,ry-58,rx,ry-46],[rx,ry+46,rx,ry+58]].forEach(([x1,y1,x2,y2])=>_L(c,x1,y1,x2,y2,'rgba(0,255,80,0.7)',1.5));
  _C(c,rx,ry,3,'rgba(0,255,80,0.8)');
  _F(c,143,78,28,13,'#5c3020');_F(c,148,68,16,11,'#402018');
  _F(c,114,148,68,28,'#4a5a2e');_F(c,127,130,36,18,'#363f22');_F(c,157,136,32,8,'#363f22');
  _SC(c);
},

'war-combined':(c)=>{
  _GV(c,0,0,320,90,'#040810','#080f20');_ST(c,15);
  _GV(c,0,90,320,110,'#041830','#020e1e');
  for(let w=0;w<3;w++){c.strokeStyle=`rgba(0,80,160,${0.2+w*0.1})`;c.lineWidth=1;c.beginPath();for(let x=0;x<=320;x+=20)c.lineTo(x,96+w*10+Math.sin(x*0.18)*3);c.stroke();}
  // Plane
  c.fillStyle='#607090';c.beginPath();c.moveTo(230,32);c.lineTo(170,38);c.lineTo(190,32);c.lineTo(170,26);c.fill();
  _F(c,170,31,6,2,'#8090a8');
  // Carrier
  _F(c,50,86,130,18,'#4a5060');_F(c,70,74,65,12,'#3a3f50');_F(c,90,68,8,8,'#2a3040');
  // Submarine
  _F(c,40,130,95,20,'#2a3820');_C(c,90,130,10,'#2a3820');_F(c,46,122,6,8,'#222c18');_F(c,48,110,2,12,'#222c18');
  // Tank on deck
  _F(c,210,84,52,18,'#4a5a2e');_F(c,218,75,28,12,'#363f22');_F(c,240,80,26,6,'#363f22');
  _SC(c);
},

'nuclear':(c)=>{
  _F(c,0,0,320,200,'#020408');_ST(c,50);
  const gx=160,gy=110,gr=72;
  c.save();c.beginPath();c.arc(gx,gy,gr,0,6.28);c.clip();
  _C(c,gx,gy,gr,'#051030');
  c.strokeStyle='rgba(30,60,140,0.3)';c.lineWidth=0.5;
  for(let i=1;i<4;i++){c.beginPath();c.ellipse(gx,gy,gr,gr*i/4,0,0,6.28);c.stroke();}
  for(let i=1;i<6;i++){c.beginPath();c.ellipse(gx,gy,gr*i/6,gr,0,0,6.28);c.stroke();}
  c.fillStyle='rgba(20,70,15,0.8)';
  c.beginPath();c.ellipse(gx-28,gy-5,18,30,-0.3,0,6.28);c.fill();
  c.beginPath();c.ellipse(gx+14,gy-8,13,22,0.2,0,6.28);c.fill();
  c.beginPath();c.ellipse(gx+48,gy-8,16,18,-0.1,0,6.28);c.fill();
  c.restore();
  c.strokeStyle='rgba(50,100,200,0.5)';c.lineWidth=1;c.beginPath();c.arc(gx,gy,gr,0,6.28);c.stroke();
  [[45,25,gx+25,gy+35,'#ff3333'],[280,15,gx-15,gy+35,'#ff6600'],[gx-10,8,gx-35,gy+25,'#ff2200']].forEach(([x1,y1,x2,y2,col])=>{
    c.strokeStyle=col;c.lineWidth=1.5;c.shadowColor=col;c.shadowBlur=6;
    c.beginPath();c.moveTo(x1,y1);c.quadraticCurveTo((x1+x2)/2+18,6,x2,y2);c.stroke();
    _C(c,x2,y2,5,col);c.shadowBlur=0;
  });
  c.fillStyle='#ff2200';c.font='bold 9px monospace';c.textAlign='left';c.fillText('DEFCON 1',10,20);
  _SC(c);
},

'spaceship-solo':(c)=>{
  _F(c,0,0,320,200,'#05060d');_ST(c,50);
  const ng=c.createRadialGradient(260,80,0,260,80,100);ng.addColorStop(0,'rgba(0,80,120,0.2)');ng.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=ng;c.fillRect(0,0,320,200);
  const sx=108,sy=100;
  c.fillStyle='#00d4a0';c.beginPath();c.moveTo(sx+44,sy);c.lineTo(sx,sy-22);c.lineTo(sx+8,sy);c.lineTo(sx,sy+22);c.fill();
  c.fillStyle='rgba(0,200,160,0.35)';c.beginPath();c.moveTo(sx+8,sy-8);c.lineTo(sx-16,sy);c.lineTo(sx+8,sy+8);c.fill();
  c.strokeStyle='#00ffaa';c.lineWidth=2;c.shadowColor='#00ffaa';c.shadowBlur=8;
  _L(c,sx+44,sy,292,sy,'#00ffaa',2);c.shadowBlur=0;
  [[238,68,'#ff4422'],[262,104,'#cc2200'],[248,138,'#ff4422']].forEach(([ex,ey,col])=>{
    c.fillStyle=col;c.beginPath();c.moveTo(ex-26,ey);c.lineTo(ex,ey-14);c.lineTo(ex+5,ey);c.lineTo(ex,ey+14);c.fill();
  });
  _C(c,262,104,11,'rgba(255,100,0,0.5)');_C(c,262,104,5,'rgba(255,200,0,0.7)');
  c.strokeStyle='rgba(0,212,160,0.3)';c.lineWidth=1;c.beginPath();
  for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;c.lineTo(26+20*Math.cos(a),26+20*Math.sin(a));}
  c.closePath();c.stroke();_SC(c);
},

'spaceship-mp':(c)=>{
  _F(c,0,0,320,200,'#05060d');_ST(c,60);
  const ng=c.createRadialGradient(160,100,0,160,100,140);ng.addColorStop(0,'rgba(40,0,80,0.3)');ng.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=ng;c.fillRect(0,0,320,200);
  [[88,68,'#00d4a0','#00ffaa'],[148,103,'#2288ff','#44aaff'],[88,138,'#00d4a0','#00ffaa']].forEach(([sx,sy,col,laser])=>{
    c.fillStyle=col;c.beginPath();c.moveTo(sx+34,sy);c.lineTo(sx,sy-17);c.lineTo(sx+6,sy);c.lineTo(sx,sy+17);c.fill();
    c.strokeStyle=laser;c.lineWidth=1.5;c.shadowColor=laser;c.shadowBlur=5;
    _L(c,sx+34,sy,sx+80,sy,laser,1.5);c.shadowBlur=0;
  });
  [[238,83,'#ff3322'],[258,100,'#cc2200'],[238,117,'#ff4433']].forEach(([ex,ey,col])=>{
    c.fillStyle=col;c.beginPath();c.moveTo(ex-20,ey);c.lineTo(ex,ey-12);c.lineTo(ex+4,ey);c.lineTo(ex,ey+12);c.fill();
  });
  _SC(c);
},

'build-a-bridge':(c)=>{
  _GV(c,0,0,320,100,'#0d2a4a','#1a3a5a');
  for(let i=0;i<8;i++){c.fillStyle=`rgba(150,180,220,${0.08+i%3*0.04})`;c.beginPath();c.ellipse(28+i*38,28+i%3*14,18+i%3*6,5,0,0,6.28);c.fill();}
  _GV(c,0,155,320,45,'#041830','#082040');
  for(let w=0;w<3;w++){c.strokeStyle=`rgba(0,120,200,${0.2+w*0.1})`;c.lineWidth=1;c.beginPath();for(let x=0;x<=320;x+=16)c.lineTo(x,159+w*8+Math.sin(x*0.2)*3);c.stroke();}
  c.fillStyle='#1a1a1a';
  c.beginPath();c.moveTo(0,200);c.lineTo(0,88);c.lineTo(58,98);c.lineTo(74,155);c.lineTo(0,155);c.fill();
  c.beginPath();c.moveTo(320,200);c.lineTo(320,88);c.lineTo(262,98);c.lineTo(246,155);c.lineTo(320,155);c.fill();
  c.strokeStyle='#7dd3fc';c.lineWidth=2;
  _L(c,74,93,160,73,'#7dd3fc',2);_L(c,160,73,246,93,'#7dd3fc',2);
  for(let i=0;i<7;i++){const bx=84+i*24,yc=73+Math.pow((i-3)/3,2)*20;_L(c,bx,yc,bx,133,'rgba(125,211,252,0.6)',1);}
  _F(c,74,131,172,9,'#334455');_F(c,74,137,172,4,'#2a3a4a');
  _F(c,142,121,28,11,'#ff6600');_F(c,145,114,22,8,'#ff8800');
  _SC(c);
},

'mars-colony':(c)=>{
  _GV(c,0,0,320,90,'#120808','#2a1006');_GV(c,0,90,320,110,'#3a1505','#260e04');
  for(let i=0;i<20;i++){const x=(i*137)%320,y=(i*97)%78;c.fillStyle='rgba(255,200,150,0.4)';c.fillRect(x,y,1,1);}
  c.fillStyle='#200a04';c.beginPath();c.moveTo(0,100);c.lineTo(40,78);c.lineTo(80,95);c.lineTo(120,72);c.lineTo(160,90);c.lineTo(200,70);c.lineTo(240,88);c.lineTo(280,75);c.lineTo(320,92);c.lineTo(320,100);c.fill();
  const dome=(cx,cy,r,col)=>{
    c.fillStyle=col+'22';c.beginPath();c.arc(cx,cy,r,Math.PI,0);c.fill();
    c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();c.arc(cx,cy,r,Math.PI,0);c.stroke();
    _L(c,cx-r,cy,cx+r,cy,col,1.5);
    for(let s=1;s<4;s++){c.strokeStyle=col+'55';c.lineWidth=0.5;c.beginPath();c.arc(cx,cy,r*s/4,Math.PI,0);c.stroke();}
  };
  dome(130,142,48,'#f0a43c');dome(220,147,32,'#f0a43c');dome(55,150,22,'#cc8830');
  [[168,154,38,8,'#1a3050'],[172,164,38,8,'#1a3050'],[68,156,26,6,'#1a3050']].forEach(([x,y,w,h,col])=>{_F(c,x,y,w,h,col);for(let i=1;i<4;i++)_L(c,x+w*i/4,y,x+w*i/4,y+h,'rgba(0,150,255,0.3)',0.5);});
  _SC(c);
},

'national-park-tycoon':(c)=>{
  _GV(c,0,0,320,80,'#0a1a3a','#0c2040');_GV(c,0,80,320,120,'#061408','#091a0a');
  c.fillStyle='#0e2010';c.beginPath();c.moveTo(0,95);c.lineTo(50,55);c.lineTo(100,85);c.lineTo(160,45);c.lineTo(220,80);c.lineTo(270,50);c.lineTo(320,75);c.lineTo(320,100);c.lineTo(0,100);c.fill();
  c.fillStyle='rgba(200,220,255,0.25)';c.beginPath();c.moveTo(148,45);c.lineTo(160,40);c.lineTo(172,45);c.lineTo(163,50);c.lineTo(157,50);c.fill();
  const tree=(tx,ty,h,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(tx,ty-h);c.lineTo(tx+h*.35,ty);c.lineTo(tx-h*.35,ty);c.fill();c.beginPath();c.moveTo(tx,ty-h*.65);c.lineTo(tx+h*.45,ty+h*.1);c.lineTo(tx-h*.45,ty+h*.1);c.fill();_F(c,tx-3,ty,6,10,'#2a1a08');};
  [[40,155,28,'#0d3010'],[70,160,24,'#122a0e'],[100,157,27,'#0d3010'],[190,155,30,'#0f2e0c'],[222,162,22,'#122a0e'],[256,157,26,'#0d3010'],[292,160,23,'#112808']].forEach(a=>tree(...a));
  c.fillStyle='rgba(180,140,80,0.3)';c.beginPath();c.moveTo(128,200);c.quadraticCurveTo(148,164,158,150);c.quadraticCurveTo(168,136,198,130);c.lineTo(202,134);c.quadraticCurveTo(172,140,162,153);c.quadraticCurveTo(152,168,132,200);c.fill();
  c.fillStyle='rgba(120,80,40,0.55)';c.beginPath();c.ellipse(164,166,12,7,0.2,0,6.28);c.fill();c.beginPath();c.ellipse(172,158,5,6,-0.2,0,6.28);c.fill();
  c.strokeStyle='rgba(100,60,20,0.5)';c.lineWidth=1.5;_L(c,174,153,171,147,'rgba(100,60,20,0.5)',1.5);_L(c,171,147,168,143,'rgba(100,60,20,0.5)',1.5);_L(c,171,147,173,143,'rgba(100,60,20,0.5)',1.5);
  _SC(c);
},

'national-park-simulator':(c)=>{
  // Yellowstone at golden hour: Old Faithful erupting, lodgepole pines, a bison, a camera frame
  _GV(c,0,0,320,200,'#f0a35a','#f6d28a');
  const sun=c.createRadialGradient(250,70,0,250,70,90); sun.addColorStop(0,'rgba(255,245,200,.9)'); sun.addColorStop(1,'rgba(255,245,200,0)'); c.fillStyle=sun; c.fillRect(0,0,320,200);
  // far ridges
  c.fillStyle='#8a6f8f'; c.beginPath(); c.moveTo(0,110); [[40,88],[90,104],[140,80],[200,100],[250,84],[320,104]].forEach(([x,y])=>c.lineTo(x,y)); c.lineTo(320,200); c.lineTo(0,200); c.fill();
  c.fillStyle='#5d5a6e'; c.beginPath(); c.moveTo(0,124); [[60,108],[120,122],[180,112],[260,126],[320,116]].forEach(([x,y])=>c.lineTo(x,y)); c.lineTo(320,200); c.lineTo(0,200); c.fill();
  // geyser basin (pale mineral crust + steaming plume)
  c.fillStyle='#e9e1cf'; c.beginPath(); c.ellipse(118,150,60,12,0,0,6.283); c.fill();
  c.fillStyle='#4fb3c9'; c.beginPath(); c.ellipse(118,150,16,4,0,0,6.283); c.fill();
  // a narrow jet of water that blooms into billowing steam drifting with the wind
  const jet=c.createLinearGradient(0,150,0,70); jet.addColorStop(0,'rgba(255,255,255,.95)'); jet.addColorStop(1,'rgba(255,255,255,.5)');
  c.fillStyle=jet; c.beginPath(); c.moveTo(112,150); c.lineTo(115,78); c.lineTo(121,78); c.lineTo(124,150); c.fill();
  [[118,74,15],[106,62,14],[128,58,16],[114,46,18],[134,40,15],[122,30,19],[142,26,16],[110,30,13],[150,16,15],[130,14,17],[100,50,11],[160,30,12]]
    .forEach(([x,y,r],i)=>{ c.fillStyle=`rgba(255,255,255,${.92-i*.04})`; c.beginPath(); c.arc(x,y,r,0,6.283); c.fill(); });
  for(let i=0;i<10;i++){ c.fillStyle='rgba(255,255,255,.75)'; c.beginPath(); c.arc(106+i*2.6,148-((i*7)%10),3,0,6.283); c.fill(); }
  // meadow
  _GV(c,0,156,320,44,'#7d8a3e','#4e5a24');
  // lodgepole pines
  [[18,150,1],[36,156,.8],[268,150,1.1],[292,158,.85],[306,150,.95]].forEach(([x,y,k])=>{
    c.fillStyle='#22381f'; for(let j=0;j<5;j++){ c.beginPath(); c.moveTo(x,y-58*k+j*10*k); c.lineTo(x-(7+j*3)*k,y-40*k+j*10*k); c.lineTo(x+(7+j*3)*k,y-40*k+j*10*k); c.fill(); }
    _F(c,x-1.5,y-12*k,3,14*k,'#3b2a1c'); });
  // bison
  c.fillStyle='#3a2416'; c.beginPath(); c.ellipse(222,166,22,12,0,0,6.283); c.fill();
  c.fillStyle='#2a180e'; c.beginPath(); c.ellipse(204,160,13,13,0,0,6.283); c.fill();
  c.fillStyle='#1f120a'; c.beginPath(); c.ellipse(195,168,8,7,0,0,6.283); c.fill();
  [[210,174],[218,176],[232,176],[240,174]].forEach(([x,y])=>_F(c,x,y,4,10,'#1f120a'));
  _L(c,198,154,194,148,'#d9cbb0',2); _L(c,208,152,212,146,'#d9cbb0',2);
  // camera viewfinder
  c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=2.5;
  [[70,26,1,1],[250,26,-1,1],[70,182,1,-1],[250,182,-1,-1]].forEach(([x,y,dx,dy])=>{ c.beginPath(); c.moveTo(x,y+dy*16); c.lineTo(x,y); c.lineTo(x+dx*16,y); c.stroke(); });
  _C(c,82,170,4,'#ff3b3b'); c.font='bold 10px monospace'; c.fillStyle='#fff'; c.textAlign='left'; c.fillText('REC',90,174);
  c.font='900 15px sans-serif'; c.fillStyle='#fff3c0'; c.textAlign='right'; c.fillText('YELLOWSTONE',304,22);
},

'virus':(c)=>{
  _F(c,0,0,320,200,'#030a04');_ST(c,20);
  c.fillStyle='rgba(10,60,15,0.8)';
  c.beginPath();c.roundRect(30,60,45,100,5);c.fill();c.beginPath();c.roundRect(40,85,30,80,5);c.fill();
  c.beginPath();c.roundRect(118,50,36,60,5);c.fill();c.beginPath();c.roundRect(124,110,30,70,5);c.fill();
  c.beginPath();c.roundRect(158,46,100,74,5);c.fill();c.beginPath();c.roundRect(220,140,40,34,5);c.fill();
  [[80,90,'#80ff80',25],[140,70,'#80ff80',18],[182,66,'#00ff80',30],[242,80,'#66ff66',20],[262,152,'#80ff80',15],[132,142,'#40ff60',22]].forEach(([x,y,col,r])=>{
    _C(c,x,y,r,'rgba(0,255,80,0.1)');
    c.strokeStyle=col;c.lineWidth=1.5;c.shadowColor=col;c.shadowBlur=7;c.beginPath();c.arc(x,y,r,0,6.28);c.stroke();c.shadowBlur=0;
    _C(c,x,y,3,col);
  });
  c.strokeStyle='rgba(0,255,80,0.12)';c.lineWidth=1;[[80,90,140,70],[140,70,182,66],[182,66,242,80]].forEach(([x1,y1,x2,y2])=>{c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();});
  c.fillStyle='#80ff80';c.font='bold 8px monospace';c.textAlign='left';c.fillText('INFECTED: 2.4B',10,18);_SC(c);
},

'pathogen':(c)=>{
  _GV(c,0,0,320,200,'#02050c','#040c10');_ST(c,15);
  const cx=160,cy=108;
  const cg=c.createRadialGradient(cx,cy,50,cx,cy,78);cg.addColorStop(0,'rgba(0,255,136,0)');cg.addColorStop(.8,'rgba(0,255,136,0.1)');cg.addColorStop(1,'rgba(0,255,136,0)');c.fillStyle=cg;c.fillRect(82,30,156,156);
  c.strokeStyle='rgba(0,255,136,0.6)';c.lineWidth=2;c.shadowColor='#00ff88';c.shadowBlur=10;c.beginPath();c.arc(cx,cy,68,0,6.28);c.stroke();c.shadowBlur=0;
  c.fillStyle='rgba(0,40,20,0.35)';c.beginPath();c.arc(cx,cy,68,0,6.28);c.fill();
  c.strokeStyle='rgba(0,200,100,0.5)';c.lineWidth=1.5;c.beginPath();c.arc(cx,cy,26,0,6.28);c.stroke();c.fillStyle='rgba(0,80,40,0.5)';c.beginPath();c.arc(cx,cy,26,0,6.28);c.fill();
  for(let i=0;i<12;i++){const t=i/12*6.28,hx=cx+Math.cos(t)*14,hy=cy-22+i*3.6;_C(c,hx,hy,2.5,i%2?'#00ff88':'#00ddbb');if(i<11)_L(c,hx,hy,cx+Math.cos((i+1)/12*6.28)*14,cy-22+(i+1)*3.6,'rgba(0,180,100,0.4)',1);}
  [[240,60],[282,90],[202,172],[98,162],[58,78],[302,142]].forEach(([vx,vy])=>{
    _C(c,vx,vy,7,'rgba(255,34,0,0.15)');c.strokeStyle='rgba(255,34,0,0.65)';c.lineWidth=1;c.beginPath();c.arc(vx,vy,7,0,6.28);c.stroke();
    for(let s=0;s<6;s++){const sa=s*Math.PI/3;_L(c,vx+Math.cos(sa)*7,vy+Math.sin(sa)*7,vx+Math.cos(sa)*12,vy+Math.sin(sa)*12,'rgba(255,34,0,0.5)',1);}
  });
  _SC(c);
},

'last-transmission':(c)=>{
  _F(c,0,0,320,200,'#050810');
  [[180,70,88,'rgba(0,80,100,0.22)'],[118,130,68,'rgba(40,0,80,0.18)'],[250,110,58,'rgba(0,60,80,0.2)']].forEach(([x,y,r,col])=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,6.28);c.fill();});
  _ST(c,55);
  const ox=90,oy=100;
  [20,40,60,80,100].forEach((r,i)=>{c.strokeStyle=`rgba(111,214,200,${.5-i*.08})`;c.lineWidth=1;c.shadowColor='rgba(111,214,200,0.4)';c.shadowBlur=4;c.beginPath();c.arc(ox,oy,r,0,6.28);c.stroke();c.shadowBlur=0;});
  c.fillStyle='#4a5a6a';c.beginPath();c.moveTo(ox+12,oy);c.lineTo(ox-10,oy-8);c.lineTo(ox-5,oy);c.lineTo(ox-10,oy+8);c.fill();
  c.strokeStyle='#6fd6c8';c.lineWidth=1.5;c.beginPath();c.arc(ox+8,oy,10,Math.PI*1.2,Math.PI*1.8);c.stroke();_L(c,ox+8,oy,ox+8,oy-12,'#6fd6c8',1);
  c.fillStyle='rgba(111,214,200,0.65)';c.font='8px monospace';c.textAlign='left';
  ['> SIGNAL LOST','> SCANNING...','> FREQ: 2.4GHz','> ..........'].forEach((t,i)=>c.fillText(t,165,58+i*18));
  _F(c,165,130,40,2,'rgba(111,214,200,0.5)');_SC(c);
},

'last-transmission-3d':(c)=>{
  _F(c,0,0,320,200,'#040608');_ST(c,30);
  const vx=160,vy=100;
  c.strokeStyle='rgba(40,80,120,0.35)';c.lineWidth=1;
  for(let i=0;i<=7;i++){const x=i*46-12;_L(c,x,200,vx,vy,'rgba(40,80,120,0.25)',1);}
  for(let d=0;d<5;d++){const t=d/5,w2=(1-t)*155;c.strokeStyle=`rgba(40,80,120,${0.1+d*.04})`;c.lineWidth=0.5;c.strokeRect(vx-w2,vy+(1-t)*98-6,w2*2,6);}
  const pg=c.createRadialGradient(vx,vy,0,vx,vy,38);pg.addColorStop(0,'rgba(0,180,200,0.5)');pg.addColorStop(.5,'rgba(0,100,150,0.2)');pg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=pg;c.fillRect(vx-38,vy-38,76,76);
  c.strokeStyle='rgba(0,200,220,0.6)';c.lineWidth=1.5;c.shadowColor='#00c8dc';c.shadowBlur=10;c.beginPath();c.arc(vx,vy,15,0,6.28);c.stroke();c.shadowBlur=0;
  c.fillStyle='rgba(60,80,100,0.8)';c.beginPath();c.moveTo(188,200);c.lineTo(150,158);c.lineTo(160,147);c.lineTo(170,158);c.lineTo(132,200);c.fill();
  _SC(c);
},

'cheese-heist-3d':(c)=>{
  _F(c,0,0,320,200,'#080808');
  for(let x=0;x<8;x++)for(let y=0;y<5;y++){if((x+y)%2===0)_F(c,x*40,y*40,40,40,'#0d0d0d');}
  const sg=c.createRadialGradient(160,0,0,160,0,130);sg.addColorStop(0,'rgba(255,220,100,0.22)');sg.addColorStop(.7,'rgba(255,200,80,0.05)');sg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=sg;c.fillRect(0,0,320,200);
  _GV(c,128,138,64,44,'#1a1a1a','#0d0d0d');_F(c,118,178,84,9,'#0f0f0f');
  c.fillStyle='#d4a010';c.beginPath();c.moveTo(128,138);c.lineTo(192,138);c.lineTo(176,98);c.lineTo(144,98);c.fill();
  [[154,116,6],[168,128,4],[147,130,5]].forEach(([x,y,r])=>_C(c,x,y,r,'#a07800'));
  c.strokeStyle='#ffe040';c.lineWidth=1;c.beginPath();c.moveTo(128,138);c.lineTo(192,138);c.lineTo(176,98);c.lineTo(144,98);c.closePath();c.stroke();
  c.fillStyle='rgba(0,255,208,0.12)';c.beginPath();c.ellipse(248,158,15,22,0,0,6.28);c.fill();c.beginPath();c.arc(248,128,12,0,6.28);c.fill();
  c.strokeStyle='rgba(0,255,208,0.38)';c.lineWidth=1;c.beginPath();c.arc(248,128,12,0,6.28);c.stroke();_L(c,248,140,248,180,'rgba(0,255,208,0.18)',1);
  _SC(c);
},

'fib-factory':(c)=>{
  _GV(c,0,0,320,200,'#0d0015','#180025','#0d001a');_GV(c,0,152,320,48,'#100018','#08000f');
  _F(c,48,28,224,92,'rgba(255,93,143,0.08)');c.strokeStyle='rgba(255,93,143,0.45)';c.lineWidth=1.5;c.strokeRect(48,28,224,92);
  c.fillStyle='rgba(255,255,255,0.75)';c.font='bold 9px monospace';c.textAlign='center';
  c.fillText('What year was the',160,52);c.fillText('Eiffel Tower built?',160,68);
  [[54,132,'#ff5d8f','1887'],[162,132,'#ffd24c','1889'],[54,163,'#5d8fff','1900'],[162,163,'#5dff8f','1901']].forEach(([x,y,col,txt])=>{
    c.fillStyle=col+'18';c.fillRect(x,y,96,23);c.strokeStyle=col;c.lineWidth=1;c.strokeRect(x,y,96,23);
    c.fillStyle=col;c.font='bold 8px monospace';c.textAlign='center';c.fillText(txt,x+48,y+14);
  });
  [[48,153,'#ff5d8f'],[128,156,'#ffd24c'],[208,152,'#5d8fff'],[274,154,'#5dff8f']].forEach(([px,py,col])=>{_F(c,px,py,30,40,col+'12');c.strokeStyle=col;c.lineWidth=1;c.strokeRect(px,py,30,40);_C(c,px+15,py+11,8,col+'38');});
  _SC(c);
},

'yellowstone-carnage':(c)=>{
  _GV(c,0,0,320,110,'#0d0800','#200c00','#3a1000');_GV(c,0,110,320,90,'#1a0f00','#0d0800');
  c.fillStyle='#0a0600';c.beginPath();c.moveTo(0,200);c.lineTo(0,130);c.lineTo(40,110);c.lineTo(80,90);c.lineTo(120,105);c.lineTo(160,60);c.lineTo(200,90);c.lineTo(240,85);c.lineTo(280,100);c.lineTo(320,110);c.lineTo(320,200);c.fill();
  const vg=c.createRadialGradient(160,60,0,160,60,58);vg.addColorStop(0,'rgba(255,150,0,0.9)');vg.addColorStop(.3,'rgba(255,80,0,0.5)');vg.addColorStop(.7,'rgba(200,30,0,0.2)');vg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=vg;c.fillRect(100,0,120,130);
  [[154,57,3,'#ff8800'],[147,44,4,'#ffaa00'],[167,49,3,'#ff6600'],[139,37,2,'#ff4400'],[171,33,3,'#ffcc00'],[133,54,2,'#ff8800'],[179,46,3,'#ff5500'],[161,28,2,'#ffdd00'],[144,23,4,'#ff6600']].forEach(([x,y,r,col])=>_C(c,x,y,r,col));
  c.strokeStyle='rgba(255,80,0,0.55)';c.lineWidth=2;c.beginPath();c.moveTo(160,60);c.quadraticCurveTo(140,100,124,130);c.stroke();c.beginPath();c.moveTo(160,60);c.quadraticCurveTo(175,96,190,126);c.stroke();
  for(let i=0;i<5;i++){c.fillStyle=`rgba(50,30,10,${.18+i*.04})`;c.beginPath();c.arc(154+i*12,44-i*5,14+i*5,0,6.28);c.fill();}
  _SC(c);
},

'speed-stars':(c)=>{
  // night stadium, a red running track in perspective, a sprinter clearing a hurdle
  _GV(c,0,0,320,200,'#02040a','#060c1c');
  // stadium lights + crowd glow
  [[40,18],[280,18]].forEach(([x,y])=>{ const g=c.createRadialGradient(x,y,0,x,y,70); g.addColorStop(0,'rgba(200,255,250,.55)'); g.addColorStop(1,'rgba(200,255,250,0)'); c.fillStyle=g; c.fillRect(0,0,320,110); _F(c,x-10,y-3,20,6,'#e8fffb'); });
  for(let i=0;i<70;i++){ c.fillStyle=`rgba(${120+i*7%120},${80+i*13%120},255,.35)`; c.fillRect((i*37)%320,62+(i*11)%14,3,3); }
  _F(c,0,78,320,4,'#0d1a2e');
  // track: trapezoid lanes converging to the horizon
  c.fillStyle='#7a1f22'; c.beginPath(); c.moveTo(118,82); c.lineTo(202,82); c.lineTo(320,200); c.lineTo(0,200); c.closePath(); c.fill();
  c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1.4;
  for(let k=0;k<=6;k++){ const t=k/6; c.beginPath(); c.moveTo(118+84*t,82); c.lineTo(0+320*t,200); c.stroke(); }
  // finish line + distance marks
  for(let i=0;i<14;i++){ c.fillStyle=i%2?'#fff':'#111'; c.fillRect(120+i*6,84,6,4); }
  // hurdles (getting smaller toward the horizon)
  [[166,1.0],[112,0.5]].forEach(([y,sc])=>{ const w=150*sc, x=160-w/2+20*sc;
    c.fillStyle='#f4f4f4'; c.fillRect(x,y,w,5*sc+2); c.fillStyle='#ff3a3a'; for(let i=0;i<4;i++) c.fillRect(x+i*w/4,y,w/8,5*sc+2);
    _L(c,x+3,y,x+3,y+26*sc,'#cfd6e0',2); _L(c,x+w-3,y,x+w-3,y+26*sc,'#cfd6e0',2); });
  // the sprinter mid-leap (cyan neon stick figure)
  c.save(); c.shadowColor='#00f5ff'; c.shadowBlur=12; c.strokeStyle='#00f5ff'; c.lineWidth=5; c.lineCap='round';
  // hurdling form: body leaning in, lead leg straight out front, trail leg folded to the side
  const hx=168, hy=104;
  c.beginPath(); c.moveTo(hx+10,hy+10); c.lineTo(hx-6,hy+34); c.stroke();                       // torso, leaning forward
  c.beginPath(); c.moveTo(hx-6,hy+34); c.lineTo(hx+22,hy+44); c.lineTo(hx+44,hy+46); c.stroke();   // lead leg, nearly straight
  c.beginPath(); c.moveTo(hx-6,hy+34); c.lineTo(hx-28,hy+38); c.lineTo(hx-18,hy+52); c.stroke();   // trail leg, knee out
  c.beginPath(); c.moveTo(hx+6,hy+16); c.lineTo(hx+28,hy+26); c.stroke();                       // reaching arm
  c.beginPath(); c.moveTo(hx+4,hy+18); c.lineTo(hx-14,hy+12); c.lineTo(hx-24,hy+20); c.stroke(); // swinging arm
  _C(c,hx+16,hy+2,7,'#00f5ff'); c.restore();
  // speed streaks
  for(let i=0;i<5;i++) _L(c,104-i*6,120+i*7,144-i*4,120+i*7,`rgba(0,245,255,${.5-i*.08})`,2);
  // HUD
  c.font='bold 12px monospace'; c.textAlign='left'; c.fillStyle='#ffe600'; c.fillText('9.84s',12,190);
  c.textAlign='right'; c.fillStyle='rgba(0,245,255,.9)'; c.fillText('100M',308,190);
  _SC(c);
},

'hacker':(c)=>{
  _F(c,0,0,320,200,'#000000');
  const lines=['01001000 41 4B 45 52','> BREACH DETECTED...','DECRYPTING AES-256...','[####......] 42%','> ROOT ACCESS: OK','FIREWALL: BYPASSED','DOWNLOADING...........','> sudo rm -rf /logs','TRACE ROUTE: BOUNCE','IDENTITY: MASKED'];
  lines.forEach((t,i)=>{
    const alpha=i<2?0.9:i<5?0.7:i<8?0.5:0.3;
    c.fillStyle=`rgba(0,${i<5?255:180},${i<5?65:50},${alpha})`;
    c.font=`${i<2?'bold ':''}9px monospace`;c.textAlign='left';c.fillText(t,12,20+i*17);
  });
  c.fillStyle='rgba(0,255,65,0.12)';c.fillRect(8,48,114,16);c.strokeStyle='rgba(0,255,65,0.38)';c.lineWidth=1;c.strokeRect(8,48,114,16);
  _F(c,12,156,8,13,'rgba(0,255,65,0.75)');
  for(let y=0;y<200;y+=2)_F(c,0,y,320,1,'rgba(0,0,0,0.14)');
},

'dj':(c)=>{
  _GV(c,0,0,320,200,'#060609','#0a060f');
  _F(c,98,68,124,104,'#0d0d18');c.strokeStyle='rgba(139,92,246,0.28)';c.lineWidth=1;c.strokeRect(98,68,124,104);
  const turntable=(cx,cy,r)=>{
    _C(c,cx,cy,r,'#0a0a14');c.strokeStyle='rgba(139,92,246,0.38)';c.lineWidth=1.5;c.beginPath();c.arc(cx,cy,r,0,6.28);c.stroke();
    for(let gr=r*.3;gr<r*.95;gr+=r*.12){c.strokeStyle=`rgba(139,92,246,${.08+gr/r*.14})`;c.lineWidth=0.5;c.beginPath();c.arc(cx,cy,gr,0,6.28);c.stroke();}
    _C(c,cx,cy,r*.25,'#8b5cf6');_C(c,cx,cy,r*.08,'#060609');
    c.strokeStyle='rgba(6,214,245,0.55)';c.lineWidth=2;c.beginPath();c.moveTo(cx+r,cy-r*.7);c.lineTo(cx+r*.4,cy-r*.15);c.stroke();_C(c,cx+r*.4,cy-r*.15,3,'#06d6f5');
  };
  turntable(64,100,54);turntable(256,100,54);
  c.strokeStyle='rgba(6,214,245,0.65)';c.lineWidth=1.5;c.shadowColor='rgba(6,214,245,0.45)';c.shadowBlur=4;c.beginPath();c.moveTo(110,120);
  for(let i=0;i<=20;i++){const wx=110+i*5,amp=(8+Math.abs(Math.sin(i*.7))*18)*.5;c.lineTo(wx,120+(i%2===0?amp:-amp));}
  c.stroke();c.shadowBlur=0;
  [[107,140,'#8b5cf6'],[119,131,'#8b5cf6'],[131,143,'#8b5cf6'],[143,127,'#06d6f5'],[155,138,'#8b5cf6'],[167,124,'#8b5cf6'],[179,140,'#06d6f5'],[191,130,'#8b5cf6'],[203,141,'#8b5cf6']].forEach(([fx,fh,col])=>{_F(c,fx,fh,7,60,'rgba(255,255,255,0.04)');_F(c,fx,fh,7,4,col);});
  [[64,38,'#ff00ff'],[113,38,'#8b5cf6'],[163,38,'#06d6f5'],[213,38,'#ff00ff'],[262,38,'#8b5cf6']].forEach(([lx,ly,col],i)=>{if(i%2===0){c.shadowColor=col;c.shadowBlur=8;}_C(c,lx,ly,6,i%2===0?col:col+'88');c.shadowBlur=0;});
  _SC(c);
},

'decision-roulette':(c)=>{
  _GV(c,0,0,320,200,'#0d0010','#180018');
  const wx=160,wy=108,wr=82;
  const segs=[['#ff3366','YES'],['#ff6b35','NO'],['#ffd60a','MAYBE'],['#7209b7','HELL YES'],['#3a0ca3','NEVER'],['#4361ee','SURE'],['#4cc9f0','AGAIN?'],['#ff006e','YES!']];
  segs.forEach(([col,label],i)=>{
    const a1=i/segs.length*6.28-Math.PI/2,a2=(i+1)/segs.length*6.28-Math.PI/2;
    c.fillStyle=col+'cc';c.beginPath();c.moveTo(wx,wy);c.arc(wx,wy,wr,a1,a2);c.fill();
    c.strokeStyle='rgba(0,0,0,0.35)';c.lineWidth=1;c.beginPath();c.moveTo(wx,wy);c.arc(wx,wy,wr,a1,a2);c.stroke();
    const la=(a1+a2)/2;c.fillStyle='rgba(255,255,255,0.88)';c.font='bold 7px monospace';c.textAlign='center';c.textBaseline='middle';
    c.fillText(label,wx+Math.cos(la)*wr*.65,wy+Math.sin(la)*wr*.65);
  });
  c.strokeStyle='rgba(255,51,102,0.65)';c.lineWidth=3;c.shadowColor='#ff3366';c.shadowBlur=12;c.beginPath();c.arc(wx,wy,wr,0,6.28);c.stroke();c.shadowBlur=0;
  _C(c,wx,wy,11,'#0d0010');c.strokeStyle='#ff3366';c.lineWidth=2;c.beginPath();c.arc(wx,wy,11,0,6.28);c.stroke();
  c.fillStyle='#ffffff';c.beginPath();c.moveTo(wx,wy-wr-13);c.lineTo(wx-8,wy-wr+4);c.lineTo(wx+8,wy-wr+4);c.fill();
  _SC(c);
},

'case-board':(c)=>{
  _GV(c,0,0,320,200,'#2a1a08','#1e1206');
  for(let i=0;i<40;i++){c.fillStyle=`rgba(160,100,40,${.04+i%4*.02})`;c.fillRect((i*73)%310+5,(i*51)%190+5,i%3*7+4,2);}
  const note=(x,y,w,h,rot,col,lines)=>{c.save();c.translate(x+w/2,y+h/2);c.rotate(rot);_F(c,-w/2,-h/2,w,h,col);c.strokeStyle='rgba(0,0,0,0.1)';c.lineWidth=1;c.strokeRect(-w/2,-h/2,w,h);c.fillStyle='rgba(50,30,10,0.6)';c.font='7px monospace';c.textAlign='left';c.textBaseline='alphabetic';lines.forEach((l,i)=>c.fillText(l,-w/2+6,-h/2+14+i*12));c.restore();};
  note(18,14,100,80,-.05,'#f5e8c8',['SUSPECT #1','John Doe','Last seen 8pm','ALIBI: ???']);
  note(133,10,90,65,.04,'#e8d4a8',['CRIME SCENE','Warehouse 7','Evidence: key','fingerprints']);
  note(238,18,72,56,.03,'#f0ddb0',['TIMELINE','8:00 PM','10:30 PM','12:00 AM']);
  note(24,114,86,66,.02,'#dcc89a',['MOTIVE:','$2.4M missing','Swiss account']);
  note(184,100,90,70,-.03,'#e5d0a0',['WITNESS','M. Smith','Dark car','near alley']);
  [[68,54,'#ff3333'],[178,42,'#3366ff'],[274,46,'#33ff66'],[67,147,'#ff3333'],[229,135,'#ffcc00']].forEach(([px,py,col])=>{_C(c,px,py,5,col);_C(c,px,py,2,'rgba(255,255,255,0.5)');});
  c.strokeStyle='rgba(180,0,0,0.45)';c.lineWidth=1;[[68,54,178,42],[178,42,274,46],[68,54,67,147],[178,42,229,135],[67,147,229,135]].forEach(([x1,y1,x2,y2])=>{c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();});
  _SC(c);
},

'roach-rave':(c)=>{
  _GV(c,0,0,320,200,'#0a0612','#060310');
  for(let x=0;x<8;x++)for(let y=3;y<5;y++){const h=(x+y)*45%360;_F(c,x*40,y*40,40,40,`hsla(${h},55%,12%,0.7)`);c.strokeStyle=`hsla(${h},55%,22%,0.25)`;c.lineWidth=0.5;c.strokeRect(x*40,y*40,40,40);}
  _C(c,160,24,18,'#c0c8d0');for(let i=0;i<6;i++)for(let j=0;j<3;j++){const a=i/6*6.28,d=j/3*3.14;c.fillStyle=`rgba(255,255,255,${.08+i%2*.14})`;c.fillRect(160+Math.cos(a)*14-2,24+Math.sin(d)*10-1,5,3);}
  [['#ff2bd6',45],['#2bf0ff',100],['#b6ff3b',155],['#ff2bd6',210],['#2bf0ff',265]].forEach(([col,lx])=>{c.strokeStyle=col+'44';c.lineWidth=2;c.shadowColor=col;c.shadowBlur=5;c.beginPath();c.moveTo(160,30);c.lineTo(lx,185);c.stroke();c.shadowBlur=0;});
  const roach=(rx,ry,ang)=>{c.save();c.translate(rx,ry);c.rotate(ang);c.fillStyle='#1a1206';c.beginPath();c.ellipse(0,0,13,7,0,0,6.28);c.fill();c.beginPath();c.ellipse(4,-2,7,5,.3,0,6.28);c.fill();c.strokeStyle='#0f0c06';c.lineWidth=1;_L(c,9,-2,20,-9,'#0f0c06',1);_L(c,9,-2,22,-4,'#0f0c06',1);for(let l=0;l<3;l++){_L(c,-3+l*5,7,-9+l*5,15,'#0f0c06',1);_L(c,-3+l*5,-7,-9+l*5,-15,'#0f0c06',1);}c.restore();};
  [[58,140,0.3],[108,163,-0.2],[158,150,.3],[208,160,.4],[258,143,-0.3],[84,178,Math.PI],[198,173,Math.PI*.9],[140,168,Math.PI*1.8]].forEach(([rx,ry,a])=>roach(rx,ry,a));
  _SC(c);
},

'nothing':(c)=>{
  _F(c,0,0,320,200,'#f0f0f0');
  c.fillStyle='rgba(180,180,180,0.5)';c.font='12px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('nothing.',160,100);
},

'barrier':(c)=>{
  // a runway into the distance: two gates (×3 good, −8 bad) and a numbered wall, a crowd surging forward
  _GV(c,0,0,320,200,'#031410','#062a20');
  // road in perspective
  c.fillStyle='#0b1f2a'; c.beginPath(); c.moveTo(130,16); c.lineTo(190,16); c.lineTo(310,200); c.lineTo(10,200); c.closePath(); c.fill();
  c.strokeStyle='rgba(61,255,192,.22)'; c.lineWidth=1;
  for(let i=0;i<9;i++){ const t=i/8, y=16+184*t*t; c.beginPath(); c.moveTo(130-120*t*t,y); c.lineTo(190+120*t*t,y); c.stroke(); }
  _L(c,160,16,160,200,'rgba(255,255,255,.12)',2);
  // the numbered barrier far away
  c.save(); c.shadowColor='#ff4d6d'; c.shadowBlur=10; _F(c,128,30,64,18,'#ff4d6d'); c.restore();
  c.font='900 13px sans-serif'; c.textAlign='center'; c.fillStyle='#fff'; c.fillText('42',160,44);
  // the two gates
  const gate=(x,w,col,txt)=>{ c.save(); c.fillStyle=col.replace('1)','.22)'); c.fillRect(x,70,w,36); c.shadowColor=col; c.shadowBlur=12; c.strokeStyle=col; c.lineWidth=3; c.strokeRect(x,70,w,36); c.restore();
    c.font='900 22px sans-serif'; c.fillStyle='#fff'; c.textAlign='center'; c.fillText(txt,x+w/2,96); };
  gate(92,66,'rgba(61,255,192,1)','×3'); gate(162,66,'rgba(255,77,109,1)','−8');
  // the crowd: little glowing runners, tighter near the front
  c.save(); c.shadowColor='#7dfcff'; c.shadowBlur=6;
  for(let i=0;i<34;i++){ const r=(i*0.618)%1, row=Math.floor(i/7), x=118+r*84+Math.sin(i)*6, y=150+row*9+Math.cos(i*2.1)*3;
    c.fillStyle=i%5? '#7dfcff' : '#ffffff'; c.beginPath(); c.arc(x,y-6,3,0,6.283); c.fill(); c.fillRect(x-2,y-3,4,7); }
  c.restore();
  // HUD
  c.font='800 16px sans-serif'; c.textAlign='left'; c.fillStyle='#7dfcff'; c.fillText('34',12,26);
  c.font='600 9px sans-serif'; c.fillStyle='rgba(200,255,240,.7)'; c.fillText('CROWD',12,37);
  c.font='800 14px sans-serif'; c.textAlign='right'; c.fillStyle='#eafff8'; c.fillText('418 m',308,26);
  _SC(c);
},
'quoridor':(c)=>{
  // 9×9 board seen at an angle-free top view: two pawns racing, walls cutting off the path
  _GV(c,0,0,320,200,'#0a1428','#12233f');
  const N=9, cell=19, gap=2, bx=160-(N*cell+(N-1)*gap)/2, by=100-(N*cell+(N-1)*gap)/2;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    c.fillStyle=(y===0)?'rgba(255,90,120,.22)':(y===N-1)?'rgba(80,170,255,.22)':'#1a2c4e';
    c.fillRect(bx+x*(cell+gap),by+y*(cell+gap),cell,cell); }
  const P=(gx,gy)=>[bx+gx*(cell+gap),by+gy*(cell+gap)];
  // walls (span two cells, sit in the grooves)
  const wall=(gx,gy,horiz)=>{ const [x,y]=P(gx,gy); c.save(); c.shadowColor='#ffd166'; c.shadowBlur=8; c.fillStyle='#ffd166';
    if(horiz) c.fillRect(x,y+cell,cell*2+gap,gap+1); else c.fillRect(x+cell,y,gap+1,cell*2+gap); c.restore(); };
  wall(2,2,true); wall(4,3,false); wall(5,5,true); wall(3,6,true); wall(1,4,false); wall(6,1,false);
  // pawns
  const pawn=(gx,gy,col)=>{ const [x,y]=P(gx,gy); c.save(); c.shadowColor=col; c.shadowBlur=14;
    _C(c,x+cell/2,y+cell/2,7.5,col); c.restore(); _C(c,x+cell/2-2,y+cell/2-2,2.4,'rgba(255,255,255,.7)'); };
  pawn(4,6,'#4fa8ff'); pawn(5,2,'#ff5a78');
  // the blue pawn's planned route
  c.strokeStyle='rgba(79,168,255,.6)'; c.setLineDash([3,3]); c.lineWidth=2; c.beginPath();
  [[4,6],[4,5],[3,5],[3,4],[3,3],[3,2],[3,1],[3,0]].forEach(([gx,gy],i)=>{ const [x,y]=P(gx,gy); i?c.lineTo(x+cell/2,y+cell/2):c.moveTo(x+cell/2,y+cell/2); }); c.stroke(); c.setLineDash([]);
  // wall counters at the sides
  c.font='800 10px sans-serif'; c.textAlign='center';
  [[26,'#4fa8ff','7'],[294,'#ff5a78','5']].forEach(([x,col,n])=>{ for(let i=0;i<+n;i++){ c.fillStyle=col; c.globalAlpha=.75; c.fillRect(x-8,40+i*16,16,4); } c.globalAlpha=1; c.fillStyle=col; c.fillText('WALLS',x,180); });
},
fallback:(c,g)=>{
  _GV(c,0,0,320,200,g.color[0],g.color[1]);
  c.fillStyle='rgba(255,255,255,0.08)';c.font='56px sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText(g.emoji,160,100);_SC(c);
},
};

// ── AI-painted thumbnails ──
// thumbs/<gid>.png (from gen-thumbs.js) overlays the canvas art the moment it
// loads; missing files cost one 404 and the hand-drawn art simply stays.
const THUMB_IMGS = {};
// Which games actually have a painted thumbs/<gid>.png. Asking for every game's file
// meant ~43 failed downloads (404s) on every hub and play-page visit. Add a gid here
// when gen-thumbs.js makes a new one.
const THUMB_FILES = new Set(['gridlock']);
function drawThumb(ctx, g){
  const gid = g.file.replace('.html','');
  (DRAW[gid] || DRAW.fallback)(ctx, g);
  if (!THUMB_FILES.has(gid)) return;
  let img = THUMB_IMGS[gid];
  if (img === null) return;                    // known missing — canvas art it is
  if (!img){
    img = THUMB_IMGS[gid] = new Image();
    img.onerror = () => { THUMB_IMGS[gid] = null; };
    img.src = 'thumbs/' + gid + '.png';
  }
  const paint = () => { ctx.drawImage(img, 0, 0, 320, 200); };
  if (img.complete && img.naturalWidth) paint();
  else img.addEventListener('load', paint, { once:true });
}
