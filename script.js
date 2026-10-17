const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const screens=$$('.screen');let current='home';function openScreen(id){if(!$('#'+id))return;screens.forEach(s=>s.classList.toggle('active',s.id===id));current=id;document.body.dataset.screen=id; if(id==='canvas')resizePaint();if(id==='terminal')setTimeout(()=>$('#terminalInput')?.focus(),80);}
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>openScreen(b.dataset.open)));$$('[data-home]').forEach(b=>b.addEventListener('click',()=>openScreen('home')));$$('.wordmark').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();openScreen('home')}));document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#lightbox').classList.contains('open'))closeLightbox();else openScreen('home')}if(current==='home'&&['1','2','3','4','5','6'].includes(e.key)){const map={'1':'canvas','2':'photos','3':'about','4':'work','5':'vibe','6':'contact'};openScreen(map[e.key])}});

$('#modeBtn')?.addEventListener('click',()=>{document.body.classList.toggle('night');const on=document.body.classList.contains('night');$('#modeBtn').textContent=on?'DAY MODE':'02:00 MODE';toast(on?'2 AM mode: lights low, ideas loud.':'Daylight restored.');});
// Birdsong ambience: opt-in, audible but comfortable, built from short rising/falling chirps.
let audioCtx=null,ambientNodes=null,chirpTimer=null;function stopAmbient(){if(chirpTimer){clearInterval(chirpTimer);chirpTimer=null;}if(!ambientNodes)return;try{ambientNodes.forEach(n=>{try{n.stop?.()}catch(e){}try{n.disconnect?.()}catch(e){}})}catch(e){}ambientNodes=null;}
function chirpBurst(ctx,master){const now=ctx.currentTime;const count=2+Math.floor(Math.random()*2);for(let i=0;i<count;i++){const start=now+i*(.13+Math.random()*.06);const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';const base=1850+Math.random()*650;osc.frequency.setValueAtTime(base,start);osc.frequency.exponentialRampToValueAtTime(base+450+Math.random()*650,start+.075);osc.frequency.exponentialRampToValueAtTime(base-180,start+.16);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.45,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+.19);osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+.21);}}
$('#soundBtn').addEventListener('click',async()=>{const b=$('#soundBtn');const on=b.getAttribute('aria-pressed')!=='true';if(!on){stopAmbient();b.textContent='SOUND: OFF';b.setAttribute('aria-pressed','false');toast('Birdsong off.');return;}try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('audio unavailable');audioCtx=audioCtx||new AC();await audioCtx.resume();const master=audioCtx.createGain();master.gain.value = 0.8;master.connect(audioCtx.destination);ambientNodes=[master];chirpBurst(audioCtx,master);chirpTimer=setInterval(()=>{if(audioCtx&&ambientNodes)chirpBurst(audioCtx,master)},1050+Math.random()*550);b.textContent='SOUND: ON';b.setAttribute('aria-pressed','true');toast('Birdsong is on. Little birds, a little louder. Click again to stop.');}catch(e){stopAmbient();b.textContent='SOUND: OFF';b.setAttribute('aria-pressed','false');toast('Sound is unavailable in this browser.');}});
let toastTimer;function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200)}
// Interactive canvas with pressure-like varied strokes, undo and a tiny discovery after three marks.
const paint=$('#paintCanvas'),pctx=paint.getContext('2d');let paintColor='#8d2638',drawing=false,stroke=null,strokes=[],paintDpr=1,markSurprise=false,eraserMode=false;function resizePaint(){if(!paint)return;const r=paint.getBoundingClientRect();if(!r.width||!r.height)return;const old=strokes;paintDpr=Math.min(devicePixelRatio||1,2);paint.width=Math.round(r.width*paintDpr);paint.height=Math.round(r.height*paintDpr);pctx.setTransform(paintDpr,0,0,paintDpr,0,0);redraw();}function redraw(){const w=paint.clientWidth,h=paint.clientHeight;pctx.clearRect(0,0,w,h);pctx.fillStyle='#fffaf0';pctx.fillRect(0,0,w,h);pctx.save();pctx.globalAlpha=.14;pctx.fillStyle='#6378c8';pctx.beginPath();pctx.ellipse(w*.72,h*.28,w*.15,h*.14,-.3,0,Math.PI*2);pctx.fill();pctx.fillStyle='#f2c94c';pctx.beginPath();pctx.arc(w*.25,h*.68,Math.min(w,h)*.12,0,Math.PI*2);pctx.fill();pctx.restore();strokes.forEach(s=>{if(!s.points.length)return;pctx.strokeStyle=s.color;pctx.lineCap='round';pctx.lineJoin='round';pctx.lineWidth=s.width;pctx.beginPath();pctx.moveTo(s.points[0].x,s.points[0].y);s.points.slice(1).forEach(pt=>pctx.lineTo(pt.x,pt.y));pctx.stroke();});$('#markCount').textContent=strokes.length;}
function paintPoint(e){const r=paint.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}paint.addEventListener('pointerdown',e=>{drawing=true;paint.setPointerCapture(e.pointerId);stroke={color:eraserMode?'#fcf8f0':paintColor,width:eraserMode?24:4+Math.random()*10,points:[paintPoint(e)]};strokes.push(stroke);redraw()});paint.addEventListener('pointermove',e=>{if(!drawing||!stroke)return;stroke.points.push(paintPoint(e));redraw()});['pointerup','pointercancel'].forEach(ev=>paint.addEventListener(ev,()=>{if(drawing&&strokes.length>=3&&!markSurprise){markSurprise=true;toast('You left a tiny signature. That mark is now part of the studio.');}drawing=false;stroke=null}));$$('.swatch').forEach(b=>b.addEventListener('click',()=>{paintColor=b.dataset.paint;eraserMode=false;$('#eraserBtn')?.classList.remove('active');$('#eraserBtn')?.setAttribute('aria-pressed','false');$$('.swatch').forEach(x=>x.classList.toggle('selected',x===b))}));$('#eraserBtn')?.addEventListener('click',()=>{eraserMode=!eraserMode;$('#eraserBtn').classList.toggle('active',eraserMode);$('#eraserBtn').setAttribute('aria-pressed',String(eraserMode));$$('.swatch').forEach(x=>x.classList.remove('selected'));toast(eraserMode?'Eraser selected. Rub out a little chaos.':'Pigment mode restored.');});$('#clearPaint').addEventListener('click',()=>{strokes=[];markSurprise=false;redraw();toast('Fresh canvas. No pressure.')});window.addEventListener('resize',()=>{if(current==='canvas')resizePaint()});
// Photo wall is a contact sheet, not a slideshow; shuffle rearranges the prints in place.
const photoCaptions=['taken accidentally. kept intentionally.','bright colours, tiny details, no explanation needed.','old buildings make me stop walking.','event mode: activated.','I stopped because the light looked right.','a little detour that deserved a frame.','an ordinary street, briefly extraordinary.','kept because the colours felt like a memory.'];$$('.photo-tile').forEach(b=>b.addEventListener('click',()=>{const img=$('img',b);$('#lightboxImg').src=img.src;$('#lightboxText').textContent=photoCaptions[+b.dataset.photo];$('#lightbox').classList.add('open')}));function closeLightbox(){$('#lightbox').classList.remove('open')}$('#closeLightbox').addEventListener('click',closeLightbox);$('#lightbox').addEventListener('click',e=>{if(e.target===$('#lightbox'))closeLightbox()});$('#shufflePhotos').addEventListener('click',()=>{const wall=$('#photoWall');const tiles=$$('.photo-tile',wall);for(let i=tiles.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[tiles[i],tiles[j]]=[tiles[j],tiles[i]]}tiles.forEach((t,i)=>{t.className='photo-tile';t.classList.add('tile'+(i+1));wall.appendChild(t)});toast('Contact sheet shuffled. Same memories, different order.')});
// Interactive mini personality test.
$$('.quiz-options button').forEach(b=>b.addEventListener('click',()=>{$('#quizResult').textContent=b.dataset.result;$$('.quiz-options button').forEach(x=>x.classList.toggle('picked',x===b));}));$('#flipNote').addEventListener('click',()=>{const n=$('#secretNote');n.classList.toggle('flipped');n.textContent=n.classList.contains('flipped')?'P.P.S. Give me a blank page, a messy palette and absolutely no instructions.':'P.S. I genuinely believe a good photo can explain a feeling faster than a paragraph.'});
// Connect the Dots: a compact, playable Dots & Boxes side quest.
const dotsBoard=$('#dotsBoard');
if(dotsBoard){
 const N=5; let edges=new Map(), boxes=new Map(), selectedTurn='human', scores={human:0,studio:0}, gameOver=false, busy=false;
 const edgeKey=(r1,c1,r2,c2)=>[[r1,c1],[r2,c2]].sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(p=>p.join(',')).join('|');
 function adjacentBoxes(r1,c1,r2,c2){const out=[];if(r1===r2){const c=Math.min(c1,c2);if(r1>0)out.push([r1-1,c]);if(r1<N-1)out.push([r1,c]);}else{const r=Math.min(r1,r2);if(c1>0)out.push([r,c1-1]);if(c1<N-1)out.push([r,c1]);}return out;}
 function allEdges(){const a=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(c<N-1)a.push({r1:r,c1:c,r2:r,c2:c+1});if(r<N-1)a.push({r1:r,c1:c,r2:r+1,c2:c});}return a;}
 const legalEdges=()=>allEdges().filter(e=>!edges.has(edgeKey(e.r1,e.c1,e.r2,e.c2)));
 function initDots(){edges=new Map();boxes=new Map();scores={human:0,studio:0};selectedTurn='human';gameOver=false;busy=false;renderDots();$('#dotsHint').textContent='Your move: choose any line connecting neighbouring dots.';}
 function renderDots(){dotsBoard.innerHTML='';dotsBoard.style.gridTemplateColumns=`repeat(${N*2-1},minmax(0,1fr))`;dotsBoard.style.gridTemplateRows=`repeat(${N*2-1},minmax(0,1fr))`;
  for(let gr=0;gr<N*2-1;gr++)for(let gc=0;gc<N*2-1;gc++){
   if(gr%2===0&&gc%2===0){const r=gr/2,c=gc/2,b=document.createElement('div');b.className='dot-cell';b.setAttribute('aria-hidden','true');b.style.gridRow=gr+1;b.style.gridColumn=gc+1;dotsBoard.appendChild(b);}
   else if((gr%2===0&&gc%2===1)||(gr%2===1&&gc%2===0)){const isH=gr%2===0,r=isH?gr/2:Math.floor(gr/2),c=isH?Math.floor(gc/2):gc/2;const r2=isH?r:r+1,c2=isH?c+1:c,key=edgeKey(r,c,r2,c2),b=document.createElement('button');b.type='button';b.className='dot-edge'+(isH?' horizontal':' vertical');b.style.gridRow=gr+1;b.style.gridColumn=gc+1;b.setAttribute('aria-label',`Connect dot ${r+1},${c+1} to ${r2+1},${c2+1}`);if(edges.has(key))b.classList.add(edges.get(key));else{b.addEventListener('click',()=>playEdge({r1:r,c1:c,r2,c2}));}dotsBoard.appendChild(b);}
   else{const r=Math.floor(gr/2),c=Math.floor(gc/2),b=document.createElement('div');b.className='dot-box'+(boxes.has(`${r},${c}`)?' claimed '+boxes.get(`${r},${c}`):'');b.style.gridRow=gr+1;b.style.gridColumn=gc+1;if(boxes.has(`${r},${c}`))b.textContent=boxes.get(`${r},${c}`)==='human'?'H':'S';dotsBoard.appendChild(b);}
  }
  $('#humanScore').textContent=scores.human;$('#studioScore').textContent=scores.studio;
 }
 function playEdge(e,player='human'){if(gameOver||edges.has(edgeKey(e.r1,e.c1,e.r2,e.c2)))return;edges.set(edgeKey(e.r1,e.c1,e.r2,e.c2),player==='human'?'red':'blue');let got=0;adjacentBoxes(e.r1,e.c1,e.r2,e.c2).forEach(([r,c])=>{const k=`${r},${c}`;if(boxes.has(k))return;const around=[edgeKey(r,c,r,c+1),edgeKey(r+1,c,r+1,c+1),edgeKey(r,c,r+1,c),edgeKey(r,c+1,r+1,c+1)];if(around.every(k=>edges.has(k))){boxes.set(k,player);scores[player]++;got++;}});renderDots();if(edges.size===allEdges().length){gameOver=true;const msg=scores.human===scores.studio?'A draw! Equally chaotic.':scores.human>scores.studio?'You win. The dots are on your side.':'The studio wins this round. Rematch?';$('#dotsHint').textContent=msg;toast(msg);return;}if(player==='human'){if(got){$('#dotsHint').textContent='Box claimed! You get another line.';toast('Box claimed — extra turn!');return;}busy=true;$('#dotsHint').textContent='Studio is thinking…';setTimeout(studioMove,420);}else{busy=false;$('#dotsHint').textContent=got?'Studio claimed a box and gets another turn. Your move.':'Your move: connect another line.';}}
 function studioMove(){if(gameOver)return;const avail=legalEdges();if(!avail.length)return;const completes=avail.filter(e=>adjacentBoxes(e.r1,e.c1,e.r2,e.c2).some(([r,c])=>{const around=[edgeKey(r,c,r,c+1),edgeKey(r+1,c,r+1,c+1),edgeKey(r,c,r+1,c),edgeKey(r,c+1,r+1,c+1)];return around.filter(k=>edges.has(k)).length===3;}));const safe=avail.filter(e=>adjacentBoxes(e.r1,e.c1,e.r2,e.c2).every(([r,c])=>{const around=[edgeKey(r,c,r,c+1),edgeKey(r+1,c,r+1,c+1),edgeKey(r,c,r+1,c),edgeKey(r,c+1,r+1,c+1)];return around.filter(k=>edges.has(k)).length<2;}));const choice=(completes.length?completes:safe.length?safe:avail)[Math.floor(Math.random()*(completes.length?completes:safe.length?safe:avail).length)];playEdge(choice,'studio');}
 $('#newDotsGame').addEventListener('click',initDots);initDots();
}

// Terminal is intentionally empty on arrival and supports all listed commands.
const responses={whoami:['Hiya. Third-year MBATech Data Science student. Photographer. Professional overthinker.'],interests:['Data, photography, films, painting, exploring. The list keeps growing.'],skills:['Python, machine learning, data analysis, cloud, visual storytelling. Still learning.'],projects:['CampusOS','F1 Analytics Dashboard','Quantum Circuit DBMS'],help:['whoami · interests · skills · projects · github · lens · about · hi · clear'],hi:['Hey, you found me. I’m Hiya — data-science student, camera-in-my-bag person, and collector of ideas that refuse to stay in one tab. Glad you stopped by.'],about:['Data brain. Camera heart. Curiosity problem.'],lens:['Try the Camera Roll. Eight frames, no explanations required.']};$('#terminalForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#terminalInput'),cmd=input.value.trim().toLowerCase();if(!cmd)return;const out=$('#terminalOutput');const line=document.createElement('p');line.textContent='› '+cmd;out.appendChild(line);if(cmd==='clear'){out.innerHTML='';}else if(cmd==='github'){const p=document.createElement('p');p.textContent='Opening github.com/hiyaudeshi in a new tab…';out.appendChild(p);window.open('https://github.com/hiyaudeshi','_blank','noopener')}else if(responses[cmd])responses[cmd].forEach(t=>{const p=document.createElement('p');p.textContent=t;out.appendChild(p)});else{const p=document.createElement('p');p.textContent='Command not found. Type help to see what works.';out.appendChild(p)}while(out.children.length>8)out.removeChild(out.firstChild);input.value='';});

// Downloadable personal data card — a real CSV, not a screenshot.
$('#downloadCsv')?.addEventListener('click',()=>{const rows=[['field','value'],['name','Hiya Udeshi'],['program','MBATech Data Science'],['year','Third year'],['primary_language','Python'],['secondary_language','Sarcasm'],['interests','Photography; painting; films; exploring; data science'],['internship','Colstay Limited — Finance and Public Relations'],['projects','CampusOS; F1 Analytics Dashboard; Quantum Circuit DBMS'],['github','https://github.com/hiyaudeshi'],['linkedin','https://in.linkedin.com/in/hiya-udeshi-7a3a47317'],['status','Probably making something']];const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hiya.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('hiya.csv downloaded. A tiny dataset about its creator.');});

$('#copyEmail').addEventListener('click',async()=>{const text='Hiya! I came across your portfolio and wanted to say hello.';try{await navigator.clipboard.writeText(text);$('#copyFeedback').textContent='Copied! Paste this into your email or LinkedIn message.'}catch(e){$('#copyFeedback').textContent=text}toast('A hello is ready to paste.')});
// Make objects feel tactile: a little tilt follows the pointer, without hijacking clicks.
if(matchMedia('(hover:hover) and (pointer:fine)').matches){$$('.object').forEach(o=>{o.addEventListener('pointermove',e=>{const r=o.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;o.style.setProperty('--rx',`${y*-3}deg`);o.style.setProperty('--ry',`${x*3}deg`)});o.addEventListener('pointerleave',()=>{o.style.removeProperty('--rx');o.style.removeProperty('--ry')})})}


// Starter doodles: choose a sketch to draw over, then keep making it your own.
const templateLibrary={
 flower:{color:'#8d2638',lines:[[[.50,.72],[.50,.54],[.48,.40]],[[.50,.58],[.36,.50],[.30,.52]],[[.50,.63],[.65,.54],[.70,.56]],[[.48,.40],[.42,.32],[.44,.23],[.52,.20],[.59,.27],[.56,.35],[.48,.40]],[[.43,.34],[.35,.31],[.31,.23],[.39,.22],[.43,.34]],[[.55,.36],[.64,.32],[.68,.23],[.59,.24],[.55,.36]],[[.40,.76],[.61,.76]]]},
 cat:{color:'#334d63',lines:[[[.30,.37],[.27,.22],[.42,.30],[.50,.28],[.59,.30],[.73,.22],[.70,.39]],[[.30,.37],[.27,.52],[.33,.63],[.50,.67],[.67,.63],[.73,.52],[.70,.37]],[[.39,.47],[.41,.47]],[[.59,.47],[.61,.47]],[[.46,.54],[.50,.57],[.54,.54]],[[.50,.57],[.50,.61]],[[.34,.55],[.22,.52]],[[.35,.59],[.23,.61]],[[.65,.55],[.77,.52]],[[.65,.59],[.77,.61]]]},
 coffee:{color:'#245b4b',lines:[[[.34,.32],[.37,.70],[.63,.70],[.66,.32]],[[.34,.32],[.66,.32]],[[.63,.42],[.75,.41],[.77,.54],[.65,.58]],[[.43,.23],[.40,.17],[.44,.12]],[[.51,.23],[.48,.17],[.52,.12]],[[.59,.23],[.56,.17],[.60,.12]],[[.42,.48],[.58,.48]]]} 
};
$$('[data-template]').forEach(btn=>btn.addEventListener('click',()=>{const t=templateLibrary[btn.dataset.template];if(!t||!paint.clientWidth||!paint.clientHeight)return;const w=paint.clientWidth,h=paint.clientHeight;const scale=Math.min(w,h)*.045;t.lines.forEach(line=>strokes.push({color:t.color,width:Math.max(2.5,scale),points:line.map(([x,y])=>({x:x*w,y:y*h}))}));paintColor=t.color;eraserMode=false;$('#eraserBtn')?.classList.remove('active');$('#eraserBtn')?.setAttribute('aria-pressed','false');redraw();toast('Starter sketch added. Draw over it, colour it in, or make it weird.');}));

// Project details open as a focused overlay; GitHub remains a separate explicit action.
const projectInfo={
 campus:{kicker:'PROJECT NOTES / 01 · ANDROID',title:'CampusOS',summary:'A campus-focused Android app project built with Kotlin.',detail:'CampusOS is presented as an Android project for campus use. Open the repository to inspect the source, implementation and the project structure directly; this portfolio description avoids guessing at features that are not documented here.',tags:['Android','Kotlin','Mobile app'],note:'Best next step: explore the repository README and source files for the implementation details.',url:'https://github.com/hiyaudeshi/CampusOs'},
 f1:{kicker:'PROJECT NOTES / 02 · DATA × RACING',title:'F1 Analytics Dashboard',summary:'A Formula 1 analytics project combining race data, strategy exploration and an XGBoost-based race prediction component.',detail:'This project brings race-data exploration and prediction together. The dashboard framing makes it easier to inspect patterns, compare strategy-related data and explore the output of a machine-learning prediction component.',tags:['Data analysis','Formula 1','XGBoost','Prediction'],note:'The repository is the source of truth for datasets, features, model setup and implementation specifics.',url:'https://github.com/hiyaudeshi/f1-dashboard'},
 quantum:{kicker:'PROJECT NOTES / 03 · DATABASES',title:'Quantum Circuit DBMS',summary:'A database-backed project for managing and exploring quantum-circuit records, with CRUD workflows and an analytics interface.',detail:'The project combines persistent records with an interface for managing and exploring circuit data. Its listed stack connects SQLite storage, FastAPI endpoints and a Streamlit-facing analytics experience.',tags:['SQLite','FastAPI','Streamlit','CRUD','Analytics'],note:'Use the repository to inspect the schema, routes, data model and the exact meaning of the circuit-record count shown in the project artwork.',url:'https://github.com/hiyaudeshi/quantum-circuit-dbms'}
};
function closeProjectModal(){const m=$('#projectModal');m.classList.remove('open');m.setAttribute('aria-hidden','true');}
$$('[data-project]').forEach(btn=>{btn.addEventListener('click',e=>{if(e.target.closest('a'))return;e.stopPropagation();const d=projectInfo[btn.dataset.project];if(!d)return;$('#projectModalKicker').textContent=d.kicker;$('#projectModalTitle').textContent=d.title;$('#projectModalSummary').textContent=d.summary;$('#projectModalDetail').textContent=d.detail;$('#projectModalNote').textContent=d.note;$('#projectModalTags').innerHTML='';d.tags.forEach(tag=>{const s=document.createElement('span');s.textContent=tag;$('#projectModalTags').appendChild(s)});$('#projectModalGithub').href=d.url;const m=$('#projectModal');m.classList.add('open');m.setAttribute('aria-hidden','false');});if(btn.matches('.project-file'))btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();btn.click();}});});
$$('[data-close-project]').forEach(el=>el.addEventListener('click',closeProjectModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#projectModal')?.classList.contains('open'))closeProjectModal()});

// Project cards are keyboard accessible; repository links open independently.


// About: open the detailed note on demand, keeping the main page compact.
(()=>{const modal=document.getElementById('aboutDetailModal');const trigger=document.getElementById('aboutReadMore');if(!modal||!trigger)return;const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true')};trigger.addEventListener('click',()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false')});modal.querySelectorAll('[data-close-about]').forEach(el=>el.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});})();
// FIX: Prevent the About popup from leaking onto other screens.
(() => {
  const modal = document.getElementById('aboutDetailModal');
  const trigger = document.getElementById('aboutReadMore');

  if (!modal) return;

  function closeAboutPopup() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
  }

  function openAboutPopup() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '9999';
  }

  closeAboutPopup();

  trigger?.addEventListener('click', openAboutPopup);

  modal.querySelectorAll('[data-close-about]').forEach(button => {
    button.addEventListener('click', closeAboutPopup);
  });

  document.querySelectorAll('[data-home], [data-open], .wordmark')
    .forEach(button => {
      button.addEventListener('click', closeAboutPopup);
    });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAboutPopup();
  });
})();
