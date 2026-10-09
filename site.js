(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const S={get:k=>{try{return JSON.parse(localStorage.getItem('rk:'+k))}catch(e){return null}},
set:(k,v)=>{try{localStorage.setItem('rk:'+k,JSON.stringify(v))}catch(e){}},
del:k=>{try{localStorage.removeItem('rk:'+k)}catch(e){}},
keys:re=>{const o=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);
if(k.startsWith('rk:')&&re.test(k.slice(3)))o.push(k.slice(3))}}catch(e){}return o}};
const pass=n=>Math.ceil(n*4/5);   // the real exam: 32 of 40
const e=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ── progress on series tiles, pack cards, pack summary ──
$$('.series a[data-k]').forEach(a=>{const r=S.get('s:'+a.dataset.k),w=S.get('run:'+a.dataset.k),m=$('small',a);
if(r){m.textContent=r.best+'/'+r.n;a.classList.add(r.best>=pass(r.n)?'pass':'fail')}
else if(w)m.textContent='…'+(w.a.filter(Boolean).length)+'/'+w.a.length});
$$('[data-pack]').forEach(el=>{const p=el.dataset.pack,t=+el.dataset.total,ks=S.keys(new RegExp('^s:'+p+'_\\d+$')).map(k=>S.get(k)).filter(Boolean);
const m=$('.meter i',el);if(m)m.style.width=(100*ks.length/t)+'%';
const d=$('.done-n',el);if(d&&ks.length)d.textContent='كمّلتي '+ks.length+' من '+t;
const s=$('#psum');if(s&&ks.length){const ok=ks.filter(r=>r.best>=pass(r.n)).length,
av=ks.reduce((a,r)=>a+r.best/r.n,0)/ks.length;s.innerHTML='<span>كمّلتي <b>'+ks.length+'</b> من '+t+'</span><span>نجحتي ف <b>'+ok+
'</b></span><span>المعدل <b>'+Math.round(av*40)+'/40</b></span>';s.hidden=false}});

// ── home: resume where you left off ──
const R=$('#resume'),L=S.get('last');
if(R&&L){R.href=R.dataset.base+(L.done?L.nx:L.u);$('b',R).textContent=L.done?'السلسلة الجاية من '+L.p:L.t;
$('small',R).textContent=L.done?'آخر نتيجة: '+L.score+'/'+L.n+' ف '+L.t:'وقفتي ف السؤال '+(L.i+1)+' من '+L.n;R.hidden=false}

// ── search (index loaded on first focus) ──
const q=$('#q'),o=$('#results');
if(q){let D=null;
const n=s=>s.toLowerCase().replace(/[ً-ْـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه')
.replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي');
const load=()=>D||(D=new Promise(ok=>{const s=document.createElement('script');s.src='search.js';
s.onload=()=>ok(window.SEARCH.map(x=>[n(x[0]),x[0],x[1],x[2]]));document.head.appendChild(s)}));
const snip=(raw,norm,t)=>{const k=norm.indexOf(t[0]),a=Math.max(0,k-40);
return(a?'… ':'')+e(raw.slice(a,a+150))+(raw.length>a+150?' …':'')};
q.addEventListener('focus',load,{once:true});
q.addEventListener('input',async()=>{const v=n(q.value.trim());if(v.length<2){o.innerHTML='';return}
const t=v.split(/\s+/),d=await load(),r=[];for(const x of d){if(t.every(w=>x[0].includes(w))){r.push(x);if(r.length>=60)break}}
o.innerHTML=r.length?r.map(x=>`<li><a href="${x[2]}">${snip(x[1],x[0],t)}<small>${e(x[3])}</small></a></li>`).join('')
:'<li class="none">ما لقينا والو. جرّب كلمة أخرى.</li>'});
const f=()=>{if(location.hash==='#search'){q.focus();q.scrollIntoView({block:'center'})}};f();addEventListener('hashchange',f)}

// ── one shared player for every little "listen" button ──
const say=new Audio();let sayB=null;
const sayOff=()=>{if(sayB)sayB.classList.remove('on');sayB=null};
say.onended=sayOff;say.onpause=sayOff;
$$('.say').forEach(b=>b.addEventListener('click',ev=>{ev.stopPropagation();
if(sayB===b){say.pause();return}say.pause();say.src=b.dataset.src;say.play().catch(()=>{});sayB=b;b.classList.add('on')}));

// ── signs: hide meanings, tap a card to reveal ──
const hm=$('#hidem');
if(hm){hm.addEventListener('click',()=>{const on=document.body.classList.toggle('hidem');hm.setAttribute('aria-pressed',on);
hm.textContent=on?'بيّن المعاني':'اختبر راسك: خبّي المعاني';$$('.sg.shown').forEach(x=>x.classList.remove('shown'))});
$$('.sg').forEach(c=>c.addEventListener('click',()=>{if(document.body.classList.contains('hidem'))c.classList.toggle('shown')}))}

// ── review lists: open / close every answer ──
$$('[data-all]').forEach(b=>b.addEventListener('click',()=>{const d=$$('details',$(b.dataset.all)),op=d.some(x=>!x.open);
d.forEach(x=>x.open=op);b.textContent=op?'خبّي كل الأجوبة':'بيّن كل الأجوبة'}));

// ── exam player ──
const P=$('#P');if(!P)return;
const qs=$$('.q',P),N=qs.length,K=P.dataset.k,C=qs.map(x=>x.dataset.c.split(',').map(Number));
const shot=$('#shot'),go=$('#go'),clr=$('#clr'),fb=$('#fb'),vd=$('#vd'),ex=$('#ex'),pb=$('#pb'),au=new Audio(),
keys=$$('.play .key'),prog=$('#prog'),auto=$('#auto');
let i=0,A=Array(N).fill(null),sel=new Set(),checked=false;
const right=j=>A[j]&&A[j].length===C[j].length&&A[j].every(x=>C[j].includes(x));
const score=()=>A.filter((_,j)=>right(j)).length;
const state=s=>{P.dataset.state=s;if(s!=='play')au.pause()};
const ans=c=>c.join(' و ');
prog.innerHTML='<i></i>'.repeat(N);
const bars=()=>$$('i',prog).forEach((b,j)=>b.className=A[j]?(right(j)?'ok':'bad'):j===i?'cur':'');
const save=()=>{S.set('run:'+K,{i,a:A});S.set('last',{k:K,u:P.dataset.u,t:P.dataset.t,p:P.dataset.p,i,n:N})};
let ap=S.get('auto');auto.checked=ap!==false;auto.onchange=()=>S.set('auto',auto.checked);
au.onplay=()=>pb.classList.add('on');au.onpause=au.onended=()=>pb.classList.remove('on');
pb.onclick=()=>au.paused?au.play().catch(()=>{}):au.pause();
function show(j){i=j;checked=false;sel.clear();const x=qs[i];
keys.forEach(k=>{k.className='key';k.disabled=false;k.setAttribute('aria-pressed','false')});
const im=$$('.qm img',x).map(m=>{const c=m.cloneNode();c.loading='eager';return c});
shot.replaceChildren(...im);shot.classList.toggle('two',im.length>1);
const s=$('audio',x);pb.hidden=!s;$('.au>span').textContent=s?'سمع السؤال':'هاد السؤال بلا صوت';
au.pause();if(s){au.src=s.getAttribute('src');if(auto.checked)au.play().catch(()=>{})}
$('#cnt').textContent='السؤال '+(i+1)+' / '+N;$('#sc').textContent='صحيح: '+score();
fb.hidden=true;go.textContent='تأكيد';go.disabled=true;clr.disabled=true;bars();save();
if(qs[i+1])$$('.qm img',qs[i+1]).forEach(m=>{new Image().src=m.src});
if(P.getBoundingClientRect().top<0||Math.max($('.play .keys').getBoundingClientRect().bottom,shot.getBoundingClientRect().bottom)>innerHeight)P.scrollIntoView({block:'start'})}
function toggle(v){if(checked)return;sel.has(v)?sel.delete(v):sel.add(v);
keys[v-1].setAttribute('aria-pressed',sel.has(v));go.disabled=clr.disabled=!sel.size}
function check(){if(!sel.size)return;A[i]=[...sel].sort();checked=true;const c=C[i],ok=right(i);
keys.forEach((k,j)=>{const v=j+1,inC=c.includes(v),inS=sel.has(v);k.disabled=true;
if(inC&&inS)k.classList.add('ok');else if(inS)k.classList.add('bad');else if(inC)k.classList.add('miss')});
vd.className='vd '+(ok?'ok':'bad');vd.innerHTML=(ok?'جواب صحيح':'جواب غالط')+(ok?'':'<small>الجواب الصحيح: '+ans(c)+'</small>');
const xp=$('.ex',qs[i]);ex.innerHTML=xp?xp.innerHTML:'';fb.hidden=false;clr.disabled=true;
go.textContent=i<N-1?'السؤال الجاي':'شوف النتيجة';go.disabled=false;$('#sc').textContent='صحيح: '+score();bars();save()}
function finish(){const s=score(),r=S.get('s:'+K),ok=s>=pass(N);
S.set('s:'+K,{best:Math.max(s,r?r.best:0),last:s,n:N});S.del('run:'+K);
S.set('last',{k:K,u:P.dataset.u,t:P.dataset.t,p:P.dataset.p,done:1,score:s,n:N,nx:P.dataset.nx});
$('#ds').textContent=s;const dv=$('#dv');dv.className='dv '+(ok?'ok':'bad');
dv.textContent=ok?'ناجح! كمّل هكا.':'خاصك '+pass(N)+' باش تنجح. عاود السلسلة ولا راجع الأخطاء.';
$('#dc').innerHTML=A.map((_,j)=>`<a href="#q${j+1}" class="${right(j)?'ok':'bad'}">${j+1}</a>`).join('');
state('done');scrollTo(0,0)}
function review(){qs.forEach((x,j)=>{const r=$('.r',x);if(A[j]){r.className='r '+(right(j)?'ok':'bad');
r.textContent=(right(j)?'✓ ':'✗ ')+'جاوبتي '+ans(A[j])}else r.textContent=''});state('review')}
function start(fresh){if(fresh){A=Array(N).fill(null);S.del('run:'+K)}const f=A.findIndex(x=>!x);state('play');show(f<0?N-1:f)}
go.onclick=()=>checked?(i<N-1?show(i+1):finish()):check();
clr.onclick=()=>{sel.clear();keys.forEach(k=>k.setAttribute('aria-pressed','false'));go.disabled=clr.disabled=true};
keys.forEach((k,j)=>k.onclick=()=>toggle(j+1));
$$('[data-go]',P).forEach(b=>b.addEventListener('click',ev=>{const g=b.dataset.go;
if(g==='review'){review();scrollTo(0,0)}else if(g==='intro'){intro();scrollTo(0,0)}else start(g==='restart')}));
$('#dc').addEventListener('click',ev=>{const a=ev.target.closest('a');if(!a)return;ev.preventDefault();review();
const t=$(a.getAttribute('href'));t.scrollIntoView();const d=$('details',t);if(d)d.open=true});
addEventListener('keydown',ev=>{if(P.dataset.state!=='play'||ev.target.matches('input,textarea')||ev.ctrlKey||ev.metaKey||ev.altKey)return;
const v='1234١٢٣٤'.indexOf(ev.key);if(v>=0){toggle(v%4+1);ev.preventDefault()}
else if(ev.key==='Enter'){ev.preventDefault();if(!go.disabled)go.click()}});
function intro(){const w=S.get('run:'+K),r=S.get('s:'+K);
if(w&&w.a&&w.a.length===N){A=w.a;i=w.i}const n=A.filter(Boolean).length;
$('#ib').textContent=n?'كمّل من السؤال '+(Math.min(n,N-1)+1):'ابدأ السلسلة';$('#ir').hidden=!n;
const b=$('#best');if(r){b.textContent='أحسن نتيجة ديالك: '+r.best+'/'+r.n+' · آخر مرة: '+r.last+'/'+r.n;b.hidden=false}
state('intro')}
if(/^#q\d+$/.test(location.hash)){review();const t=$(location.hash);if(t){t.scrollIntoView();const d=$('details',t);if(d)d.open=true}}
else intro();
})();