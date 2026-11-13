/* Labo des jeux Roblox — script principal */
/* ---------- OUTILS ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fr=n=>Math.round(n).toLocaleString("fr-BE");
const fmtK=n=>n>=1e9?(n/1e9).toFixed(1).replace(".",",")+" Md":n>=1e6?(n/1e6).toFixed(n>=1e7?0:1).replace(".",",")+" M":n>=1e3?Math.round(n/1e3)+" K":String(Math.round(n));
const pct=x=>Math.round(x*100)+" %";
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const tip=$("#tip");
function showTip(t,x,y){tip.textContent=t;tip.style.opacity=1;tip.style.left=Math.min(x+14,innerWidth-290)+"px";tip.style.top=(y+14)+"px"}
document.addEventListener("mousemove",e=>{const t=e.target.closest("[data-tip]");t?showTip(t.dataset.tip,e.clientX,e.clientY):tip.style.opacity=0});
document.addEventListener("touchstart",e=>{const t=e.target.closest("[data-tip]");if(t){const p=e.touches[0];showTip(t.dataset.tip,p.clientX-120,p.clientY-60);clearTimeout(window._tt);window._tt=setTimeout(()=>tip.style.opacity=0,2200)}},{passive:true});
function bars(el,rows,{max,fmt=v=>v,cls=""}={}){
  const m=max??Math.max(...rows.map(r=>r[1]),1);
  el.innerHTML=rows.length?rows.map(([name,v,t,c])=>`<div class="bar" data-tip="${esc(t||name+" : "+fmt(v))}"><span class="name">${esc(name)}</span><span class="track"><span class="fill ${c||cls}" style="width:${Math.max(.5,v/m*100)}%"></span></span><span class="val">${esc(fmt(v))}</span></div>`).join(""):`<p class="src">Pas assez de données.</p>`;
}
const clean=n=>n.replace(/\[[^\]]*\]|\([^)]*\)/g," ").replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{200D}]/gu," ").replace(/\s+/g," ").trim();
const gameUrl=g=>`https://www.roblox.com/games/${g.pl}`;

const GFR={"Simulation":"Simulation","Survival":"Survie / horreur","Roleplay & Avatar Sim":"Roleplay & avatar","Action":"Action / combat","RPG":"RPG","Obby & Platformer":"Obby & plateforme","Shooter":"Tir","Strategy":"Stratégie","Sports & Racing":"Sport & course","Party & Casual":"Party & casual","Adventure":"Aventure","Social":"Social","Shopping":"Shopping","Puzzle":"Puzzle","Entertainment":"Divertissement","Education":"Éducation","Utility & Other":"Utilitaire","":"Non classé","All":"Non classé"};
const gname=g=>GFR[g]??g;

/* ---------- RECETTES (détection) ---------- */
const LOOPS={
 steal:{name:"Collectionner, voler, protéger",re:/\bsteal\b|\brob\b|\braid\b/i,desc:"Tu ramasses des objets rares, les autres peuvent te les voler, tu défends ta base.",risk:"Le format le plus cloné : il faut un vrai twist.",solo:1,titles:["Steal a {N}","Break and Steal a {N}","Rob the {N} Base"]},
 stat:{name:"Une stat qui monte sans arrêt",re:/\+1\b|every (second|click|step)|per second|\bspeed\b|incremental|clicker|\brebirth/i,desc:"Chaque seconde ou chaque clic ajoute +1 (vitesse, saut, force). Le chiffre visible fait tout le travail.",risk:"Les pics retombent vite quand les copies arrivent.",solo:1,titles:["+1 {N} Every Second","{N} Speed Run","Every Click +1 {N}"]},
 collect:{name:"Collection, rareté et mutations",re:/\bhatch|\bgrow\b|garden|\bpets?\b|mutation|\brng\b|\begg/i,desc:"Œufs, graines, pets ou objets avec des raretés et des mutations, qu'on peut échanger.",risk:"Prévois les échanges et l'économie dès le départ.",solo:1,titles:["Grow a {N}","Hatch a {N}","{N} RNG"]},
 throwfeed:{name:"Lancer, nourrir, faire grandir",re:/\bthrow\b|\bfeed\b|evolution|\bevolve|\bgrow up\b/i,desc:"Une action simple répétée (lancer, nourrir) qui fait évoluer quelque chose qu'on voit grandir.",risk:"Il faut une évolution visible et satisfaisante, sinon on s'ennuie vite.",solo:1,titles:["Feed the {N}","Throw Food to the {N}","{N} Evolution"]},
 rounds:{name:"Manches courtes à rôles",re:/murder|sheriff|innocent|impostor|hide (and|&|n) seek|\bhide\b|tag\b|duels?\b/i,desc:"Parties de 2 à 4 minutes avec des rôles (tueur, shérif…) et des cosmétiques à échanger.",risk:"Murder Mystery 2 domine : il faut une règle vraiment nouvelle.",solo:1,titles:["{N} Mystery","Hide the {N}","{N} Duels"]},
 survive:{name:"Survie avec une ligne d'arrivée",re:/surviv|\bnights?\b|\bdays\b|\bescape\b|horror|scary/i,desc:"Un objectif clair (tenir X nuits, s'échapper) : chaque partie a un début et une fin.",risk:"Ambiance et son font tout : sans eux, ça ne fait peur qu'une fois.",solo:1,titles:["99 Nights with the {N}","Survive the {N}","Escape the {N}"]},
 rp:{name:"Ville ou vie en roleplay",re:/\brp\b|roleplay|\blife\b|\bcity\b|\btown\b/i,desc:"Pas d'objectif imposé : maisons, métiers, véhicules ; les joueurs inventent l'histoire.",risk:"Vide en solo : il faut un lieu qui donne envie d'inviter ses amis.",solo:0,titles:["{N} RP","{N} Town Roleplay","Life as a {N}"]},
 fashion:{name:"Style, avatar et concours",re:/dress|outfit|fashion|\bstyle|avatar|makeover/i,desc:"S'habiller ou décorer sur un thème, puis comparer ou voter.",risk:"C'est un jeu de contenu : beaucoup d'objets à créer.",solo:1,titles:["Dress Up: {N} Edition","{N} Style Battle","Design a {N}"]},
 build:{name:"Construire et tester",re:/\bbuild|\bcraft|sandbox|\bplane\b|\bboat\b|\bcar\b/i,desc:"Construire un véhicule ou une base, puis le tester dans un défi.",risk:"La physique doit être fiable, sinon c'est frustrant.",solo:0,titles:["Build a {N}","Build and Launch a {N}","{N} Builder"]},
 tycoon:{name:"Tycoon / gérer un business",re:/tycoon|\bsell\b|\bshop\b|restaurant|\bstore\b|factory|business/i,desc:"Gagner de l'argent, acheter des améliorations, agrandir son business.",risk:"Genre en baisse dans les recherches : le thème doit être frais.",solo:1,titles:["{N} Tycoon","Sell {N}s","{N} Factory"]},
 td:{name:"Tower defense",re:/tower defen|\btd\b|defense/i,desc:"Des unités à collectionner, des vagues d'ennemis, du coop.",risk:"Vit de mises à jour fréquentes avec de nouvelles unités.",solo:1,titles:["{N} Tower Defense","{N} Defenders TD","Protect the {N}"]},
 arena:{name:"Arène de combat",re:/battleground|\bfight|combat|\bpvp\b|\barena\b|\bbattles?\b|ragdoll|\bslap/i,desc:"Des pouvoirs ou des armes différents, des combats rapides, de la physique drôle.",risk:"Le combat doit être bon au toucher.",solo:0,titles:["{N} Battlegrounds","{N} Ragdoll Arena","{N} Fighters"]},
 shooter:{name:"Tir compétitif",re:/shoot|\bgun\b|\bfps\b|sniper|\bwar\b|\barmy\b/i,desc:"Matchs courts, armes et cosmétiques, contrôles pensés pour mobile.",risk:"Technique (réseau, armes) plus lourde que la moyenne.",solo:0,titles:["{N} Rivals","{N} Showdown","{N} War"]},
 sport:{name:"Sport arcade",re:/soccer|football|basket|\bball\b|tennis|volley|racing|\brace\b|kart|\bgolf/i,desc:"Foot, basket ou course en équipes, avec des règles ou des pouvoirs fous.",risk:"Il faut assez de joueurs par serveur : prévois des bots ou de petites équipes.",solo:0,titles:["Illegal {N}","{N} Chaos League","Super {N} 2v2"]},
 obby:{name:"Obby / parcours",re:/\bobby\b|\btower\b|parkour|\bjump\b|\bclimb/i,desc:"Un parcours d'obstacles, souvent avec un chrono ou des niveaux.",risk:"Le format le plus encombré de toute la plateforme.",solo:1,titles:["{N} Obby","{N} Tower","Climb the {N}"]},
 fish:{name:"Pêche ou récolte calme",re:/\bfish|\bcatch\b|\breel\b|\bdig\b|\bmine\b|mining/i,desc:"Lancer, attendre, attraper du rare ; ambiance détente.",risk:"Genre copié depuis Fish It!.",solo:1,titles:["Catch a {N}","{N} Fishing","Dig for {N}"]}
};
const THEMES={
 animaux:{label:"Animaux",re:/\banimal|\bpet\b|\bpets\b|\bdog|\bcat\b|\bcats\b|bunny|capybara|dino|\bfarm/i,nouns:["Capybara","Bunny","Puppy","Axolotl","Dino"]},
 oeufs:{label:"Œufs",re:/\beggs?\b/i,nouns:["Egg","Golden Egg","Dragon Egg"]},
 horreur:{label:"Horreur",re:/horror|scary|haunted|ghost|monster|killer|nightmare|\bnight/i,nouns:["Haunted Doll","Mascot","Shadow","Night Guard"]},
 brainrot:{label:"Brainrot / mèmes",re:/brainrot|skibidi|\bmeme|sahur|tralalero|67\b/i,nouns:["Brainrot","Meme","Noob"]},
 anime:{label:"Anime",re:/\banime|ninja|\bsword|\baura|jujutsu|demon|\bsoul|\bblox/i,nouns:["Ninja","Aura","Sword","Spirit"]},
 cute:{label:"Mignon / cute",re:/\bcute|kawaii|boba|mochi|\bpink|princess|bunny|sweet/i,nouns:["Mochi","Boba","Bunny","Cupcake"]},
 nourriture:{label:"Nourriture",re:/\bfood|\bcook|burger|pizza|lemon|sushi|\bcake|candy|restaurant|\bfruit/i,nouns:["Lemon","Burger","Pizza","Cake"]},
 vehicules:{label:"Voitures & véhicules",re:/\bcar\b|\bcars\b|\bdrive|\btruck|\bplane|\bboat|\btrain|\bbike/i,nouns:["Car","Truck","Plane","Rocket"]},
 sport:{label:"Sport",re:/soccer|football|basket|\bball\b|\bsport/i,nouns:["Soccer","Basketball","Dodgeball"]},
 armee:{label:"Armée & guerre",re:/\barmy|\bwar\b|military|soldier|\btank/i,nouns:["Army","Tank","Soldier"]},
 noel:{label:"Noël & hiver",re:/christmas|\bxmas|\bsnow|winter|\bsanta|\bice\b|frozen|\bgift/i,nouns:["Snowman","Santa","Gift","Reindeer","Elf"]},
 prison:{label:"Prison & évasion",re:/prison|\bjail|\bcops?\b|police|criminal/i,nouns:["Prison","Cop","Heist"]},
 espace:{label:"Espace & science",re:/\bspace|\bplanet|\balien|\brocket|\bmoon|\bscience/i,nouns:["Alien","Planet","Rocket"]}
};
const TWISTS=["un mode coop à 2 où chaque joueur a un rôle différent","une mise à jour fixe chaque samedi","des contrôles pensés pour le téléphone d'abord","une carte qui change à chaque partie","des échanges entre joueurs dès le premier jour","un classement du serveur toujours visible","une vraie fin à atteindre, puis un mode « nouvelle partie + »","un événement de saison prévu dès la sortie","de la physique ragdoll pour les moments drôles","un deuxième genre mélangé dedans"];

/* La recette se lit surtout dans le titre ; la description ne sert que pour des mots sans ambiguïté, et le genre Roblox complète. */
const DESC_RE={steal:/\bsteal\b/i,collect:/\bhatch|mutation|\bgarden\b/i,td:/tower defen/i,rounds:/murder|sheriff|innocent/i,fashion:/dress up|outfit|fashion/i,fish:/\bfishing\b|\brod\b/i,stat:/\+1 /i,throwfeed:/\bfeed\b.*\bgrow|evolve/i};
const GENRE_LOOP={"Shooter":"shooter","Sports & Racing":"sport","Roleplay & Avatar Sim":"rp","Survival":"survive"};
function detectLoops(g){const t=clean(g.n),out=new Set();
  for(const k in LOOPS){if(LOOPS[k].re.test(t)||(DESC_RE[k]&&DESC_RE[k].test(g.d)))out.add(k)}
  if(GENRE_LOOP[g.g]&&!(g.g==="Roleplay & Avatar Sim"&&out.has("fashion")))out.add(GENRE_LOOP[g.g]);
  if(g.g==="RPG"&&!out.size)out.add("arena");
  return [...out]}
/* ---------- MOTS ---------- */
const STOP=new Set(("the and for you your with from are new this that all can get our join play free not but has have was will its it's just more most out now one two who what when how get got any per into each than then only also every like game games roblox experience update updates upd group discord codes code server servers private vip please thanks thank sure make sure "+
 "a an of to in on at by be is it or as me my we us do so up if no yes de la le les des du et en un une el los las y que por para con em um uma do da dos das o e é ã pra").split(" "));
function toks(s,desc){const w=clean(s).toLowerCase().replace(/[^a-z0-9+'À-ɏ\s-]/g," ").split(/[\s\-_]+/).map(x=>x.replace(/^'+|'+$/g,"")).filter(x=>x.length>(desc?3:2)&&!STOP.has(x)&&!/^\d+$/.test(x));return w}
function grams(s,n,desc){const t=toks(s,desc);if(n==1)return [...new Set(t)];const o=[];for(let i=0;i<t.length-1;i++)o.push(t[i]+" "+t[i+1]);return [...new Set(o)]}

/* ---------- ÉTAT ---------- */
let D=null,G=[],NOW=Date.now(),A={};
async function load(manual){
  const b=$("#reload");b.disabled=true;b.textContent="…";
  try{
    const r=await fetch("data/data.json?t="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw new Error(r.status);
    D=await r.json();
  }catch(e){$("#stamp").textContent="Impossible de charger les données. Vérifie ta connexion puis appuie sur Actualiser.";b.disabled=false;b.textContent="Actualiser";return}
  NOW=new Date(D.fetched).getTime();
  G=D.games.map((g,i)=>({...g,rank:i+1,age:g.cr?Math.max(0,Math.floor((NOW-new Date(g.cr))/864e5)):9999,tn:clean(g.n),tr:/[TU]/.test(g.s)}));
  G.forEach(g=>{g.loops=detectLoops(g);g.themes=Object.keys(THEMES).filter(k=>THEMES[k].re.test(g.n+" "+g.d))});
  analyse();renderAll();
  const mins=Math.round((Date.now()-NOW)/6e4);
  $("#stamp").textContent="Relevé "+new Date(NOW).toLocaleString("fr-BE",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
  const lv=$("#live");lv.hidden=false;lv.className="live"+(mins>150?" old":"");lv.textContent=mins<2?"à l'instant":mins<60?`il y a ${mins} min`:`il y a ${Math.round(mins/60)} h`;
  $("#loading").hidden=true;b.disabled=false;b.textContent="Actualiser";
  route();
  if(window.LABO_AFTER_LOAD)window.LABO_AFTER_LOAD();
}
$("#reload").onclick=()=>load(true);

/* ---------- ANALYSE ---------- */
function median(a){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]}
function analyse(){
  const total=G.reduce((s,g)=>s+g.p,0);
  // genres
  const by={};G.forEach(g=>{const k=g.g&&g.g!=="All"?g.g:"";(by[k]=by[k]||[]).push(g)});
  const gstats=Object.entries(by).map(([k,L])=>{const nw=L.filter(g=>g.age<=90);const rs=L.filter(g=>g.r!=null).map(g=>g.r);
    return {k,n:L.length,p:L.reduce((s,g)=>s+g.p,0),med:median(L.map(g=>g.p)),newN:nw.length,newShare:nw.length/L.length,newP:nw.reduce((s,g)=>s+g.p,0),rating:rs.length?rs.reduce((a,b)=>a+b,0)/rs.length:null,top:[...L].sort((a,b)=>b.p-a.p)[0]}});
  const big=gstats.filter(s=>s.n>=5&&s.k);
  const mMed=Math.max(...big.map(s=>s.med)),mNew=Math.max(...big.map(s=>s.newShare)),mN=Math.max(...big.map(s=>s.n));
  big.forEach(s=>{s.pot=Math.round(40*s.med/mMed+40*s.newShare/mNew+20*(1-s.n/mN))});
  // recettes
  const loops=Object.keys(LOOPS).map(k=>{const L=G.filter(g=>g.loops.includes(k));const nw=L.filter(g=>g.age<=90);
    return {k,n:L.length,p:L.reduce((s,g)=>s+g.p,0),med:median(L.map(g=>g.p)),newN:nw.length,newShare:L.length?nw.length/L.length:0,trN:L.filter(g=>g.tr).length,ex:[...L].sort((a,b)=>b.p-a.p).slice(0,3),genre:topKey(L.map(g=>g.g))}});
  // thèmes
  const themes=Object.keys(THEMES).map(k=>{const L=G.filter(g=>g.themes.includes(k));const hot=L.filter(g=>g.age<=90||g.tr).length;const hotAll=G.filter(g=>g.age<=90||g.tr).length;
    return {k,n:L.length,p:L.reduce((s,g)=>s+g.p,0),lift:L.length?((hot+.5)/hotAll)/(((L.length-hot)+.5)/(G.length-hotAll)):0,ex:[...L].sort((a,b)=>b.p-a.p).slice(0,3)}});
  A={total,gstats,big,loops,themes,newN:G.filter(g=>g.age<=90).length,new30:G.filter(g=>g.age<=30),newP:G.filter(g=>g.age<=90).reduce((s,g)=>s+g.p,0)};
}
function topKey(arr){const c={};arr.forEach(x=>c[x]=(c[x]||0)+1);return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]||""}
function kwTable(src,n){
  const hot=g=>g.age<=90||g.tr; const H=G.filter(hot).length,O=G.length-H;
  const m={};G.forEach(g=>grams(src=="t"?g.n:g.d,n,src=="d").forEach(w=>{const e=m[w]||(m[w]={w,c:0,p:0,h:0,games:[]});e.c++;e.p+=g.p;if(hot(g))e.h++;e.games.push(g)}));
  const L=Object.values(m);L.forEach(e=>{e.lift=((e.h+.5)/H)/(((e.c-e.h)+.5)/O)});return L;
}

/* ---------- RENDU ---------- */
function renderAll(){renderApercu();renderPercees();renderGenres();renderKw();renderLoops();renderGames(true);renderIdeasSetup()}

function renderApercu(){
  const g1=G[0];
  $("#kpis").innerHTML=[
    [fmtK(A.total),"joueurs connectés dans ces 1000 jeux"],
    [fr(A.newN),"jeux du top 1000 créés il y a moins de 90 jours"],
    [pct(A.newP/A.total),"des joueurs sont dans ces jeux récents"],
    [fr(G[G.length-1].p),"joueurs suffisent pour entrer dans le top 1000"]
  ].map(([n,l])=>`<div class="card tile"><div class="num">${n}</div><div class="lab">${l}</div></div>`).join("");
  bars($("#top20"),G.slice(0,20).map(g=>[g.tn,g.p/1000,`${g.tn} — ${fr(g.p)} joueurs · ${gname(g.g)} · créé ${g.age<=90?"il y a "+g.age+" j":g.cr.slice(0,4)}`,g.age<=90?"hot":""]),{fmt:v=>fr(v)+" K"});
  const bestG=[...A.big].sort((a,b)=>b.pot-a.pot), loopsR=[...A.loops].filter(l=>l.n>=5).sort((a,b)=>b.newN-a.newN), rise=kwTable("t",1).filter(e=>e.c>=5).sort((a,b)=>b.lift-a.lift).slice(0,5);
  const satur=[...A.loops].sort((a,b)=>b.n-a.n)[0];
  const t=[
    `<b>Le top est ouvert aux nouveaux.</b> ${A.newN} jeux sur 1000 ont moins de 90 jours et rassemblent ${pct(A.newP/A.total)} des joueurs. Il suffit de ${fr(G[G.length-1].p)} joueurs connectés pour entrer dans le top 1000.`,
    `<b>Genres où il y a le plus de place :</b> ${bestG.slice(0,3).map(s=>`${gname(s.k)} (${pct(s.newShare)} de jeux récents)`).join(", ")}.`,
    `<b>Mots qui montent dans les titres :</b> ${rise.map(e=>`« ${e.w} »`).join(", ")}.`,
    `<b>Recettes qui font percer des jeux récents :</b> ${loopsR.slice(0,3).map(l=>`${LOOPS[l.k].name.toLowerCase()} (${l.newN} jeux récents)`).join(" ; ")}.`,
    `<b>Le plus encombré :</b> ${LOOPS[satur.k].name.toLowerCase()}, avec ${satur.n} jeux dans le top 1000. Si tu y vas, il faut un vrai twist.`,
    `<b>Calendrier :</b> ${seasonText()}`
  ];
  $("#takeaways").innerHTML=t.map(x=>`<li>${x}</li>`).join("");
  // depuis ta dernière visite
  const prev=store.get("labo-prev");
  if(prev&&prev.f!==D.fetched){
    const pm=prev.m||{};const movers=G.filter(g=>pm[g.i]).map(g=>({g,d:g.p-pm[g.i],r:(g.p-pm[g.i])/pm[g.i]})).filter(x=>x.g.p>3000);
    const ups=[...movers].sort((a,b)=>b.r-a.r).slice(0,6),downs=[...movers].sort((a,b)=>a.r-b.r).slice(0,4);
    const entered=G.slice(0,200).filter(g=>!pm[g.i]).slice(0,6);
    $("#sinceCard").hidden=false;
    $("#since").innerHTML=`<div><div class="src">Comparé au relevé du ${new Date(prev.f).toLocaleString("fr-BE",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
     <ul class="list">${ups.map(x=>`<li><a href="${gameUrl(x.g)}">${esc(x.g.tn)}</a> <span class="up">+${Math.round(x.r*100)} %</span> <span class="src">(${fr(x.g.p)})</span></li>`).join("")}</ul></div>
     <div><b>Nouveaux dans le top 200</b><ul class="list">${entered.length?entered.map(g=>`<li><a href="${gameUrl(g)}">${esc(g.tn)}</a> <span class="src">#${g.rank}</span></li>`).join(""):"<li class='src'>Aucun</li>"}</ul>
     <b>En baisse</b><ul class="list">${downs.map(x=>`<li>${esc(x.g.tn)} <span class="down">${Math.round(x.r*100)} %</span></li>`).join("")}</ul></div>`;
  }
  if(!prev||prev.f!==D.fetched){const m={};G.forEach(g=>m[g.i]=g.p);const old=store.get("labo-cur");if(old&&old.f!==D.fetched)store.set("labo-prev",old);store.set("labo-cur",{f:D.fetched,m})}
}
function nextSeason(){
  const d=new Date(NOW),y=d.getFullYear();
  const w=[["Halloween",new Date(y,9,15),new Date(y,10,2)],["Noël",new Date(y,11,15),new Date(y+1,0,5)],["Noël",new Date(y-1,11,15),new Date(y,0,5)],["les vacances d'été",new Date(y,5,10),new Date(y,7,20)],["Halloween",new Date(y+1,9,15),new Date(y+1,10,2)],["les vacances d'été",new Date(y+1,5,10),new Date(y+1,7,20)]];
  const cur=w.find(x=>x[1]<=d&&x[2]>=d);if(cur)return {name:cur[0],start:cur[1],now:true};
  const up=w.filter(x=>x[1]>d).sort((a,b)=>a[1]-b[1])[0];return {name:up[0],start:up[1],now:false};
}
const dfmt=d=>d.toLocaleDateString("fr-BE",{day:"numeric",month:"long"});
function seasonText(){const s=nextSeason();if(s.now)return `on est en plein pic de ${s.name} : mets les mots de saison dans ta description maintenant.`;const ship=new Date(s.start);ship.setDate(ship.getDate()-14);return `le prochain pic de recherche est ${s.name}, à partir du ${dfmt(s.start)}. Vise une sortie vers le ${dfmt(ship)}.`}

function renderPercees(){
  const n30=A.new30.length,n7=G.filter(g=>g.age<=7).length;
  $("#newKpis").innerHTML=[[fr(n7),"jeux de moins de 7 jours dans le top 1000"],[fr(n30),"jeux de moins de 30 jours"],[fr(A.newN),"jeux de moins de 90 jours"],[fr(G.filter(g=>g.tr).length),"jeux mis en avant par Roblox"]].map(([n,l])=>`<div class="card tile"><div class="num">${n}</div><div class="lab">${l}</div></div>`).join("");
  const row=g=>[g.tn,g.p/1000,`${g.tn} — ${fr(g.p)} joueurs · ${gname(g.g)} · ${g.age} jours · note ${g.r??"—"} %`];
  bars($("#new30"),G.filter(g=>g.age<=30).slice(0,15).map(row),{fmt:v=>fr(v)+" K",cls:"hot"});
  bars($("#new90"),G.filter(g=>g.age>30&&g.age<=90).slice(0,15).map(row),{fmt:v=>fr(v)+" K"});
  const T=G.filter(g=>g.tr);
  $("#trendTable").innerHTML=`<thead><tr><th class="n">#</th><th>Jeu</th><th>Genre</th><th class="n">Joueurs</th><th class="n">Âge</th><th class="n hide-sm">Note</th><th class="hide-sm">Recettes</th></tr></thead><tbody>`+T.slice(0,80).map(g=>`<tr><td class="n">${g.rank}</td><td><a href="${gameUrl(g)}">${esc(g.tn)}</a> ${g.s.includes("U")?'<span class="chip hot">ascension</span>':'<span class="chip">tendance</span>'}</td><td>${esc(gname(g.g))}</td><td class="n">${fr(g.p)}</td><td class="n">${ageTxt(g.age)}</td><td class="n hide-sm">${g.r??"—"}</td><td class="hide-sm">${g.loops.slice(0,2).map(k=>`<span class="chip">${esc(LOOPS[k].name)}</span>`).join(" ")}</td></tr>`).join("")+"</tbody>";
}
const ageTxt=a=>a>=9999?"—":a<60?a+" j":a<730?Math.round(a/30)+" mois":Math.round(a/365)+" ans";

function renderGenres(){
  const S=[...A.gstats].filter(s=>s.k).sort((a,b)=>b.p-a.p);
  bars($("#gPlayers"),S.map(s=>[gname(s.k),s.p/1000,`${gname(s.k)} : ${fr(s.p)} joueurs dans ${s.n} jeux`]),{fmt:v=>fr(v)});
  bars($("#gNew"),[...A.big].sort((a,b)=>b.newShare-a.newShare).map(s=>[gname(s.k),s.newShare*100,`${gname(s.k)} : ${s.newN} jeux récents sur ${s.n}`,s.newShare>=.35?"hot":""]),{fmt:v=>Math.round(v)+" %",max:100});
  $("#genreTable").innerHTML=`<thead><tr><th>Genre</th><th class="n">Jeux</th><th class="n">Joueurs</th><th class="n">Part</th><th class="n">Jeu médian</th><th class="n">Récents</th><th class="n hide-sm">Note moy.</th><th>Plus joué</th><th>Potentiel</th></tr></thead><tbody>`+
   [...A.big].sort((a,b)=>b.pot-a.pot).map(s=>`<tr><td>${esc(gname(s.k))}</td><td class="n">${s.n}</td><td class="n">${fr(s.p)}</td><td class="n">${pct(s.p/A.total)}</td><td class="n">${fr(s.med)}</td><td class="n">${s.newN} (${pct(s.newShare)})</td><td class="n hide-sm">${s.rating?s.rating.toFixed(0)+" %":"—"}</td><td><a href="${gameUrl(s.top)}">${esc(s.top.tn)}</a></td><td>${verdict(s.pot)}</td></tr>`).join("")+"</tbody>";
}
const verdict=p=>p>=60?`<span class="chip good">${p} · place à prendre</span>`:p>=40?`<span class="chip warn">${p} · disputé</span>`:`<span class="chip bad">${p} · difficile</span>`;

function renderKw(){
  const src=$("#kwSrc").value,n=+$("#kwN").value,L=kwTable(src,n),min=src=="d"?12:(n==1?5:3);
  const rise=L.filter(e=>e.c>=min).sort((a,b)=>b.lift-a.lift).slice(0,15);
  bars($("#kwRise"),rise.map(e=>[e.w,e.lift,`« ${e.w} » : ${e.h} jeux récents ou en tendance sur ${e.c}`]),{fmt:v=>"×"+v.toFixed(1).replace(".",","),cls:"hot"});
  bars($("#kwFreq"),[...L].sort((a,b)=>b.c-a.c).slice(0,15).map(e=>[e.w,e.c]),{fmt:v=>v+" jeux"});
  bars($("#kwWeight"),[...L].filter(e=>e.c>=2).sort((a,b)=>b.p-a.p).slice(0,15).map(e=>[e.w,e.p,`« ${e.w} » : ${fr(e.p)} joueurs dans ${e.c} jeux`]),{fmt:fmtK,cls:"alt"});
  A.kw=L;
  // stats titres
  const top100=G.slice(0,100),rest=G.slice(100);
  const st=L2=>({tag:L2.filter(g=>/\[|UPD|UPDATE/i.test(g.n)).length/L2.length,len:L2.reduce((s,g)=>s+g.tn.split(" ").length,0)/L2.length,emo:L2.filter(g=>/[\u{1F000}-\u{1FAFF}]/u.test(g.n)).length/L2.length});
  const a=st(top100),b=st(rest);
  $("#titleStats").innerHTML=`<div class="card tile"><div class="num">${pct(a.tag)} / ${pct(b.tag)}</div><div class="lab">titres avec un tag de mise à jour [🎃], [UPD] (top 100 / les 900 autres)</div></div>
   <div class="card tile"><div class="num">${pct(a.emo)} / ${pct(b.emo)}</div><div class="lab">titres avec un emoji (top 100 / les 900 autres)</div></div>
   <div class="card tile"><div class="num">${a.len.toFixed(1).replace(".",",")} / ${b.len.toFixed(1).replace(".",",")}</div><div class="lab">mots par titre (top 100 / les 900 autres)</div></div>`;
  kwDetail();
}
function kwDetail(){
  const q=$("#kwQ").value.trim().toLowerCase();const el=$("#kwDetail");
  if(!q){el.innerHTML=`<p class="src">Tape un mot pour voir combien de jeux l'utilisent, combien de joueurs ils rassemblent et lesquels.</p>`;return}
  const L=G.filter(g=>(g.n+" "+g.d).toLowerCase().includes(q));
  if(!L.length){el.innerHTML=`<p class="src">Aucun des 1000 jeux n'utilise « ${esc(q)} ». C'est peut-être une niche libre, ou un mot que personne ne cherche.</p>`;return}
  const nw=L.filter(g=>g.age<=90).length,p=L.reduce((s,g)=>s+g.p,0);
  el.innerHTML=`<div class="grid g4"><div class="tile"><div class="num">${L.length}</div><div class="lab">jeux sur 1000</div></div><div class="tile"><div class="num">${fmtK(p)}</div><div class="lab">joueurs connectés</div></div><div class="tile"><div class="num">${fr(median(L.map(g=>g.p)))}</div><div class="lab">joueurs pour le jeu médian</div></div><div class="tile"><div class="num">${nw}</div><div class="lab">jeux récents (−90 j)</div></div></div>
   <div class="kv" style="margin-top:10px">${L.slice(0,12).map(g=>`<a class="chip" href="${gameUrl(g)}">#${g.rank} ${esc(g.tn)}</a>`).join("")}</div>`;
}
$("#kwSrc").onchange=renderKw;$("#kwN").onchange=renderKw;$("#kwQ").oninput=kwDetail;

function renderLoops(){
  const L=[...A.loops].sort((a,b)=>b.p-a.p);
  $("#loopTable").innerHTML=`<thead><tr><th>Recette</th><th class="n">Jeux</th><th class="n">Joueurs</th><th class="n">Jeu médian</th><th class="n">Récents</th><th class="n hide-sm">Mis en avant</th><th>Concurrence</th></tr></thead><tbody>`+
   L.map(l=>`<tr><td>${esc(LOOPS[l.k].name)}</td><td class="n">${l.n}</td><td class="n">${fr(l.p)}</td><td class="n">${fr(l.med)}</td><td class="n">${l.newN}</td><td class="n hide-sm">${l.trN}</td><td>${l.n>=90?'<span class="chip bad">très encombré</span>':l.n>=45?'<span class="chip warn">disputé</span>':'<span class="chip good">peu de concurrents</span>'}</td></tr>`).join("")+"</tbody>";
  $("#recipes").innerHTML=L.map(l=>`<div class="card"><h3>${esc(LOOPS[l.k].name)}</h3><p>${esc(LOOPS[l.k].desc)}</p>
   <div class="src"><b>Les plus joués :</b> ${l.ex.map(g=>`<a href="${gameUrl(g)}">${esc(g.tn)}</a> (${fmtK(g.p)})`).join(", ")||"—"}</div>
   <div class="src"><b>Attention :</b> ${esc(LOOPS[l.k].risk)}</div></div>`).join("");
}

let SORT={k:"rank",dir:1};
function renderGames(first){
  if(first){
    $("#gGenre").innerHTML=`<option value="">Tous</option>`+[...A.gstats].filter(s=>s.k).sort((a,b)=>b.n-a.n).map(s=>`<option value="${esc(s.k)}">${esc(gname(s.k))} (${s.n})</option>`).join("");
    $("#gLoop").innerHTML=`<option value="">Toutes</option>`+Object.entries(LOOPS).map(([k,l])=>`<option value="${k}">${esc(l.name)}</option>`).join("");
  }
  const gf=$("#gGenre").value,af=+$("#gAge").value,lf=$("#gLoop").value,q=$("#gSearch").value.trim().toLowerCase();
  let R=G.filter(g=>(!gf||g.g===gf)&&(!af||g.age<=af)&&(!lf||g.loops.includes(lf))&&(!q||(g.n+" "+g.d).toLowerCase().includes(q)));
  const k=SORT.k;R=[...R].sort((a,b)=>{const x=a[k]??-1,y=b[k]??-1;return (typeof x=="string"?x.localeCompare(y):x-y)*SORT.dir});
  $("#gCount").textContent=`${R.length} jeux · ${fr(R.reduce((s,g)=>s+g.p,0))} joueurs connectés`;
  const H=(key,lab,cls="")=>`<th class="${cls}"><button data-sort="${key}">${lab}${SORT.k==key?(SORT.dir>0?" ↑":" ↓"):""}</button></th>`;
  $("#gamesTable").innerHTML=`<thead><tr>${H("rank","#","n")}${H("tn","Jeu")}${H("g","Genre","hide-sm")}${H("p","Joueurs","n")}${H("v","Visites","n hide-sm")}${H("r","Note","n")}${H("age","Âge","n")}<th class="hide-sm">Recettes</th></tr></thead><tbody>`+
   R.slice(0,400).map(g=>`<tr><td class="n">${g.rank}</td><td><a href="${gameUrl(g)}">${esc(g.tn||g.n)}</a>${g.tr?' <span class="chip hot">↑</span>':""}<div class="src">${esc(g.c)}</div></td><td class="hide-sm">${esc(gname(g.g))}</td><td class="n">${fr(g.p)}</td><td class="n hide-sm">${fmtK(g.v)}</td><td class="n">${g.r!=null?Math.round(g.r)+" %":"—"}</td><td class="n">${ageTxt(g.age)}</td><td class="hide-sm">${g.loops.slice(0,2).map(k=>`<span class="chip">${esc(LOOPS[k].name)}</span>`).join(" ")}</td></tr>`).join("")+
   (R.length>400?`<tr><td colspan="8" class="src">… ${R.length-400} autres : affine les filtres pour les voir.</td></tr>`:"")+(R.length?"":`<tr><td colspan="8">Aucun jeu ne correspond. Essaie d'enlever un filtre.</td></tr>`)+"</tbody>";
}
$("#gamesTable").addEventListener("click",e=>{const b=e.target.closest("[data-sort]");if(!b)return;const k=b.dataset.sort;SORT=SORT.k==k?{k,dir:-SORT.dir}:{k,dir:["p","v","r"].includes(k)?-1:1};renderGames()});
["#gGenre","#gAge","#gLoop"].forEach(s=>$(s).onchange=()=>renderGames());$("#gSearch").oninput=()=>renderGames();

/* ---------- IDÉES ---------- */
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function pick(items,wf){const ws=items.map(x=>Math.max(.01,wf(x)));let r=Math.random()*ws.reduce((a,b)=>a+b,0);for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i]}return items.at(-1)}
function renderIdeasSetup(){
  const gsel=$("#iGenre"),tsel=$("#iTheme"),gv=gsel.value,tv=tsel.value;
  gsel.innerHTML=`<option value="">Au hasard (pondéré)</option>`+[...A.big].sort((a,b)=>b.pot-a.pot).map(s=>`<option value="${esc(s.k)}">${esc(gname(s.k))} · potentiel ${s.pot}</option>`).join("");
  tsel.innerHTML=`<option value="">Au hasard (pondéré)</option>`+[...A.themes].sort((a,b)=>b.lift-a.lift).map(t=>`<option value="${t.k}">${esc(THEMES[t.k].label)} · ${t.lift>=1.3?"monte":t.lift>=.8?"stable":"calme"}</option>`).join("");
  gsel.value=gv;tsel.value=tv;
  if(!CURRENT.length)topIdeas();
  renderSaved();
}
function makeIdea(){let close=null,last=null;
  for(let i=0;i<12;i++){const I=makeIdeaRaw();I.orig=typeof originality==="function"?originality(I):{level:"original",matches:[],checked:0};last=I;if(I.orig.level==="original")return I;if(I.orig.level==="close"&&!close)close=I}
  return close||last}
function makeIdeaRaw(){
  const size=$("#iSize").value,gf=$("#iGenre").value,tf=$("#iTheme").value;
  const gs=Object.fromEntries(A.big.map(s=>[s.k,s]));
  let pool=A.loops.filter(l=>l.n>=3&&(size=="small"||LOOPS[l.k].solo));
  if(gf){const f=pool.filter(l=>G.some(g=>g.g===gf&&g.loops.includes(l.k)));if(f.length)pool=f}
  const maxMed=Math.max(...pool.map(l=>l.med)),maxN=Math.max(...A.loops.map(l=>l.n));
  const loop=pick(pool,l=>(l.newShare+.1)*(l.med/maxMed+.2)*(1.2-l.n/maxN));
  const genre=gf&&gs[gf]?gf:(()=>{const c={};G.filter(g=>g.loops.includes(loop.k)&&gs[g.g]).forEach(g=>c[g.g]=(c[g.g]||0)+g.p);return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]||loop.genre})();
  const th=tf?A.themes.find(t=>t.k===tf):pick(A.themes.filter(t=>t.n>=1||THEMES[t.k]===THEMES.noel),t=>Math.pow(t.lift,1.5)+(t.k=="noel"&&nextSeason().name=="Noël"?1.5:0));
  const T=THEMES[th.k],noun=rnd(T.nouns),twist=rnd(TWISTS),title=rnd(LOOPS[loop.k].titles).replace("{N}",noun).replace(/\b([Aa]) ([AEIOUaeiou])/g,"$1n $2");
  const gsx=gs[genre];
  const sGenre=gsx?Math.round(gsx.pot/100*30):12;
  const sLoop=Math.round(Math.min(1,(loop.newN/Math.max(...A.loops.map(l=>l.newN))))*25);
  const sTheme=Math.round(Math.min(1,th.lift/2)*20);
  const sSeason=(th.k=="noel"&&nextSeason().name=="Noël")?10:twist.includes("saison")?5:0;
  const sat=Math.round(loop.n/maxN*20);
  const score=Math.max(5,Math.min(99,sGenre+sLoop+sTheme+sSeason+15-sat));
  const sameTheme=G.filter(g=>g.loops.includes(loop.k)&&g.themes.includes(th.k));
  return {loop,genre,gsx,th,T,noun,twist,title,score,parts:{sGenre,sLoop,sTheme,sSeason,sat},sameTheme};
}
let CURRENT=[];
function ring(score,label="sur 100"){const r=36,c=2*Math.PI*r,col=score>=70?"var(--good)":score>=50?"var(--accent)":score>=35?"var(--warn)":"var(--bad)";
  return `<div class="ring" role="img" aria-label="${score} ${label}"><svg viewBox="0 0 84 84" width="100%" height="100%"><circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c*score/100} ${c}"/></svg><div><b>${score}</b><small>${label}</small></div></div>`}
function ideaHTML(I,idx){
  const p=I.parts,L=LOOPS[I.loop.k],meter=(v,m,c="")=>`<div class="meter"><i style="width:${Math.max(4,v/m*100)}%;${c}"></i></div>`;
  return `<article class="idea">
   <div class="top">
     <div class="grid" style="gap:8px;flex:1;min-width:220px"><span class="stamp">${esc(gname(I.genre))} · ${esc(L.name)} · ${esc(I.T.label)}</span><div class="title">${esc(I.title)}</div>
     <p class="pitch">${esc(L.desc.replace(/\.$/,""))}, sur le thème « ${esc(I.T.label.toLowerCase())} », avec ${esc(I.twist)}.</p></div>
     ${ring(I.score,"potentiel")}
   </div>
   ${typeof origHTML==="function"?origHTML(I):""}
   <div class="scorebar">
     <div>Place dans le genre<b>${p.sGenre}/30</b>${meter(p.sGenre,30)}</div>
     <div>Recette qui perce<b>${p.sLoop}/25</b>${meter(p.sLoop,25)}</div>
     <div>Thème qui monte<b>${p.sTheme}/20</b>${meter(p.sTheme,20)}</div>
     <div>Bonus saison<b>${p.sSeason}/10</b>${meter(p.sSeason,10)}</div>
     <div>Concurrence<b>−${p.sat}</b>${meter(p.sat,20,"background:var(--bad)")}</div>
   </div>
   <div class="grid" style="gap:6px">
     <div class="src"><b>Les chiffres :</b> ${I.loop.n} jeux du top 1000 utilisent cette recette (${fr(I.loop.p)} joueurs), dont ${I.loop.newN} créés il y a moins de 90 jours.${I.gsx?` En ${esc(gname(I.genre))}, ${pct(I.gsx.newShare)} des jeux du top sont récents.`:""} Le thème « ${esc(I.T.label.toLowerCase())} » est ${I.th.lift>=1.3?`${I.th.lift.toFixed(1).replace(".",",")} fois plus présent chez les jeux récents ou en tendance`:"stable"}.</div>
     <div class="src"><b>Modèle à étudier :</b> ${I.loop.ex.map(g=>`<a href="${gameUrl(g)}">${esc(g.tn)}</a>`).join(", ")}. <b>Attention :</b> ${esc(L.risk)}</div>
     <div class="src"><b>Timing :</b> ${seasonText()}</div>
   </div>
   <div class="controls"><button data-save="${idx}">Garder</button><button data-info="${idx}">Info</button><button class="primary" data-choose="${idx}">Choisir</button></div>
   <div id="info-${idx}"></div></article>`;
}
function showIdeas(list){CURRENT=list;$("#ideaOut").innerHTML=list.map(ideaHTML).join("")}
function topIdeas(){const pool=[];for(let i=0;i<60;i++)pool.push(makeIdea());pool.sort((a,b)=>({original:0,close:1,copy:2}[a.orig.level])-({original:0,close:1,copy:2}[b.orig.level]));const seen=new Set();showIdeas(pool.filter(x=>x.orig.level!=="copy").sort((a,b)=>(b.score-(b.orig.level=="close"?6:0))-(a.score-(a.orig.level=="close"?6:0))).filter(x=>{if(seen.has(x.loop.k))return false;seen.add(x.loop.k);return true}).slice(0,5))}
$("#iGo").onclick=()=>showIdeas([makeIdea()]);
$("#iTop").onclick=topIdeas;
$("#ideaOut").addEventListener("click",e=>{const b=e.target.closest("[data-save]");if(!b)return;const I=CURRENT[+b.dataset.save];const S=store.get("labo-ideas")||[];
  S.push({t:I.title,s:I.score,g:gname(I.genre),l:LOOPS[I.loop.k].name,th:I.T.label,tw:I.twist,d:D.fetched});store.set("labo-ideas",S);b.textContent="Gardée ✓";b.disabled=true;renderSaved()});
function renderSaved(){const S=store.get("labo-ideas")||[];$("#saved").innerHTML=S.length?S.map(I=>`<div><b>${esc(I.t)}</b> <span class="chip">${I.s}/100</span> <span class="src">${esc(I.g)} · ${esc(I.l)} · ${esc(I.th)} · ${esc(I.tw)}</span></div>`).join(""):`<p class="src">Clique sur « Garder » sous une idée pour la mettre ici.</p>`}
$("#copySaved").onclick=async()=>{const S=store.get("labo-ideas")||[];const txt=S.map(I=>`${I.t} (${I.g}, ${I.s}/100) — ${I.l}. Thème : ${I.th}. Twist : ${I.tw}.`).join("\n");try{await navigator.clipboard.writeText(txt||"(aucune idée gardée)");$("#copyMsg").textContent="Copié."}catch{$("#copyMsg").textContent="Le navigateur a bloqué la copie."}};
$("#clearSaved").onclick=()=>{store.set("labo-ideas",[]);renderSaved()};

/* ---------- STATIQUE + ROUTAGE ---------- */
bars($("#searchCats"),[["Mots de genre",34],["Noms de jeux",28],["Verbes d'action",18],["Style / esthétique",12],["Pratique (codes…)",8]],{fmt:v=>v+" %",max:40});
const VIEWS=["apercu","percees","genres","mots-cles","recettes","jeux","idees","mon-idee","plan","miniatures"];
function route(){if(!D)return;const h=location.hash.slice(1);const v=VIEWS.includes(h)?h:"apercu";VIEWS.forEach(x=>$("#v-"+x).classList.toggle("on",x===v));document.querySelectorAll("nav.tabs a").forEach(a=>{if(a.getAttribute("href")==="#"+v){a.setAttribute("aria-current","page");const n=a.parentElement;n.scrollTo({left:a.offsetLeft-n.clientWidth/2+a.clientWidth/2,behavior:"smooth"})}else a.removeAttribute("aria-current")})}
addEventListener("hashchange",()=>{route();scrollTo({top:0})});
/* on attend que tous les fichiers du site soient chargés avant de traiter les données */
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>load());else load();
setInterval(()=>{if(document.visibilityState==="visible")load()},20*60*1000);
