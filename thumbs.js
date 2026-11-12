/* Labo des jeux Roblox — Créateur de miniatures (OpenAI, clé de l'utilisateur, appels directs depuis le navigateur).
   Utilise les globales du script principal : G, A, D, LOOPS, THEMES, GFR, gname, esc, fr, fmtK, store, gameUrl, $. */
(function(){
const API="https://api.openai.com/v1";
const TH={key:null,models:[],vision:"",image:"",shots:[],refs:[],refManual:new Set(),refOff:new Set(),rep:{},concepts:[],res:{},busy:false};
const KEY="labo-oai-key",MOD="labo-oai-models",FORM="labo-thumb-form";

/* ---------- OpenAI ---------- */
async function oai(path,{method="GET",json,form}={}){
  const h={Authorization:"Bearer "+TH.key};if(json)h["Content-Type"]="application/json";
  let r;try{r=await fetch(API+path,{method,headers:h,body:json?JSON.stringify(json):form})}catch(e){throw new Error("Impossible de joindre OpenAI. Vérifie ta connexion internet.")}
  let d=null;try{d=await r.json()}catch{}
  if(!r.ok){const m=(d&&d.error&&d.error.message)||("Erreur "+r.status);
    if(r.status===401)throw new Error("Clé refusée par OpenAI : vérifie qu'elle est complète et active.");
    if(r.status===429)throw new Error("OpenAI refuse pour l'instant (crédit insuffisant ou trop de demandes). Ajoute du crédit sur platform.openai.com ou réessaie dans une minute.");
    if(/verif/i.test(m))throw new Error("OpenAI demande de vérifier ton organisation pour utiliser ce modèle d'image : platform.openai.com → Settings → Organization → Verify. Détail : "+m);
    throw new Error(m)}
  return d;
}
const verNum=id=>{const m=id.match(/(\d+(?:\.\d+)?)/);return m?parseFloat(m[1]):0};
function pickVision(ids){
  const c=ids.filter(id=>/^(gpt-5|gpt-4\.1|gpt-4o|o4|o3)/.test(id)&&!/(audio|realtime|search|transcribe|tts|image|codex|nano|instruct|preview|\d{4}-\d{2}-\d{2})/.test(id));
  c.sort((a,b)=>verNum(b)-verNum(a)||a.length-b.length);return c[0]||"gpt-4o";
}
function pickImage(ids){
  const pref=["gpt-image-2.6-sunburst","gpt-image-2.5-sunburst","gpt-image-2.6-flare","gpt-image-2.5-flare","gpt-image-2","gpt-image-1.5","gpt-image-1","gpt-image-1-mini"];
  return pref.find(p=>ids.includes(p))||ids.find(i=>/^gpt-image/.test(i))||"gpt-image-2";
}
async function chatJSON(system,parts){
  const d=await oai("/chat/completions",{method:"POST",json:{model:TH.vision,response_format:{type:"json_object"},messages:[{role:"system",content:system},{role:"user",content:parts}]}});
  const txt=d.choices?.[0]?.message?.content||"{}";
  try{return JSON.parse(txt)}catch{const m=txt.match(/\{[\s\S]*\}/);return m?JSON.parse(m[0]):{}}
}
const sizeFor=(kind)=>{const old=/gpt-image-1/.test(TH.image);if(kind==="icon")return "1024x1024";const big=$("#tQual")?.value==="max";return old?"1536x1024":(big?"2048x1152":"1536x864")};
async function genImage(prompt,refBlobs,kind){
  const quality=$("#tQual")?.value==="draft"?"medium":"high";
  let d;
  if(refBlobs.length){const f=new FormData();f.append("model",TH.image);f.append("prompt",prompt);f.append("size",sizeFor(kind));f.append("quality",quality);f.append("n","1");
    refBlobs.slice(0,16).forEach((b,i)=>f.append("image[]",b,`ref${i}.png`));d=await oai("/images/edits",{method:"POST",form:f})}
  else d=await oai("/images/generations",{method:"POST",json:{model:TH.image,prompt,size:sizeFor(kind),quality,n:1}});
  const b64=d.data?.[0]?.b64_json;if(b64)return "data:image/png;base64,"+b64;
  if(d.data?.[0]?.url)return d.data[0].url;throw new Error("OpenAI n'a renvoyé aucune image.");
}

/* ---------- Images locales ---------- */
function loadImg(src){return new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ko(new Error("Image illisible"));i.src=src})}
async function shrink(file,max=1536){const url=URL.createObjectURL(file);const img=await loadImg(url);const s=Math.min(1,max/Math.max(img.width,img.height));
  const c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
  const data=c.toDataURL("image/jpeg",.88);const blob=await new Promise(r=>c.toBlob(r,"image/png"));return {data,blob,name:file.name}}
async function dataToBlob(data){const r=await fetch(data);return r.blob()}
async function exportPng(src,w,h,crop=true){const img=await loadImg(src);const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.imageSmoothingQuality="high";
  const ir=img.width/img.height,tr=w/h;let sw=img.width,sh=img.height,sx=0,sy=0;if(crop){if(ir>tr){sw=img.height*tr;sx=(img.width-sw)/2}else{sh=img.width/tr;sy=(img.height-sh)/2}}
  x.drawImage(img,sx,sy,sw,sh,0,0,w,h);return c.toDataURL("image/png")}
function download(data,name){const a=document.createElement("a");a.href=data;a.download=name;document.body.appendChild(a);a.click();a.remove()}

/* ---------- Références : meilleures miniatures du même type ---------- */
function guessLoop(){const v=$("#tLoop").value;if(v)return v;const t=($("#tName").value+" "+$("#tDesc").value).toLowerCase();
  return Object.keys(LOOPS).find(k=>LOOPS[k].re.test(t)||(typeof FR_LOOP!=="undefined"&&FR_LOOP[k]?.test(t)))||""}
function autoRefs(){
  const loop=guessLoop(),genre=$("#tGenre").value;
  const words=new Set(($("#tName").value+" "+$("#tDesc").value).toLowerCase().match(/[a-zà-ÿ]{4,}/g)||[]);
  const pool=G.filter(g=>g.t).map(g=>{let s=Math.log10(g.p+10);if(loop&&g.loops.includes(loop))s+=3;if(genre&&g.g===genre)s+=1.5;
    const tw=clean(g.n).toLowerCase().match(/[a-zà-ÿ]{4,}/g)||[];if(tw.some(w=>words.has(w)))s+=1;return {g,s}});
  pool.sort((a,b)=>b.s-a.s);
  const out=[];for(const x of pool){if(TH.refOff.has(x.g.i))continue;out.push(x.g);if(out.length>=10)break}
  TH.refManual.forEach(id=>{const g=G.find(x=>x.i===id);if(g&&!out.includes(g))out.push(g)});
  TH.refs=out;renderRefs();
}
function renderRefs(){
  const el=$("#tRefs");if(!el)return;
  if(!G.some(g=>g.t)){el.innerHTML=`<div class="note">Les miniatures des jeux arrivent avec la prochaine mise à jour des données (toutes les heures). Reviens un peu plus tard ou appuie sur « Actualiser » en haut.</div>`;return}
  el.innerHTML=`<div class="thumbgrid">${TH.refs.map(g=>`<figure class="tref"><img src="${esc(g.t)}" alt="Miniature de ${esc(g.tn)}" loading="lazy" referrerpolicy="no-referrer"><figcaption><a href="${gameUrl(g)}">${esc(g.tn)}</a><span class="src">#${g.rank} · ${fmtK(g.p)} joueurs</span></figcaption><button type="button" class="tx" data-off="${g.i}" aria-label="Retirer ${esc(g.tn)}">×</button></figure>`).join("")}</div>`;
  el.querySelectorAll("[data-off]").forEach(b=>b.onclick=()=>{const id=+b.dataset.off;TH.refOff.add(id);TH.refManual.delete(id);autoRefs()});
}

/* ---------- Interface ---------- */
function ui(){
  const el=$("#thumbApp");if(!el||el.dataset.ready)return;el.dataset.ready="1";
  const f=store.get(FORM)||{};
  el.innerHTML=`
  <div class="card" id="tStep1"><div class="steph"><span class="stepn">1</span><h3>Connecter ChatGPT (clé API OpenAI)</h3><span id="tConn" class="chip warn">Non connecté</span></div>
    <p class="src" style="margin:0">L'abonnement ChatGPT ne se branche pas sur un site : il faut une <b>clé API</b>, payée à l'usage sur <a href="https://platform.openai.com/api-keys">platform.openai.com/api-keys</a> (ajoute un peu de crédit dans Billing). La clé reste dans ton navigateur et n'est envoyée qu'à OpenAI.</p>
    <div class="controls"><label class="fld" for="tKey" style="flex:1;min-width:240px">Clé API <input type="password" id="tKey" placeholder="sk-…" autocomplete="off" spellcheck="false"></label>
      <label class="tick"><input type="checkbox" id="tRemember" checked> Se souvenir sur cet appareil</label>
      <button class="primary" type="button" id="tConnect">Connecter</button><button type="button" id="tForget">Oublier la clé</button></div>
    <div id="tModels" class="controls" hidden>
      <label class="fld" for="tVision">Modèle d'analyse <select id="tVision"></select></label>
      <label class="fld" for="tImage">Modèle d'image <select id="tImage"></select></label>
      <label class="fld" for="tQual">Qualité <select id="tQual"><option value="high">Haute (conseillé)</option><option value="max">Maximale, plus grande (plus cher)</option><option value="draft">Brouillon (moins cher)</option></select></label>
    </div>
    <div id="tConnMsg" class="src" role="status"></div></div>

  <div class="card"><div class="steph"><span class="stepn">2</span><h3>Ton jeu</h3></div>
    <div class="grid g2">
      <label class="fld" for="tName">Nom du jeu <input type="text" id="tName" value="${esc(f.name||"")}" placeholder="ex. Feed the Dragon"></label>
      <label class="fld" for="tLink">Lien Roblox du jeu (facultatif) <input type="text" id="tLink" value="${esc(f.link||"")}" placeholder="https://www.roblox.com/games/…"></label>
    </div>
    <div class="grid g2">
      <label class="fld" for="tLoop">Type de jeu <select id="tLoop"><option value="">Détecter automatiquement</option>${Object.entries(LOOPS).map(([k,l])=>`<option value="${k}" ${f.loop===k?"selected":""}>${esc(l.name)}</option>`).join("")}</select></label>
      <label class="fld" for="tGenre">Genre Roblox <select id="tGenre"><option value="">Je ne sais pas</option>${[...A.big].sort((a,b)=>b.n-a.n).map(s=>`<option value="${esc(s.k)}" ${f.genre===s.k?"selected":""}>${esc(gname(s.k))}</option>`).join("")}</select></label>
    </div>
    <label class="fld" for="tDesc">Décris ton jeu : ce qu'on y fait, les personnages, les objets importants, l'ambiance <textarea id="tDesc" rows="3" placeholder="ex. Tycoon où tu élèves des dragons sur une île volcanique. On voit le dragon géant, les œufs dorés, la lave et les nids.">${esc(f.desc||"")}</textarea></label>
    <label class="fld" for="tMust">À montrer absolument sur les miniatures (facultatif) <input type="text" id="tMust" value="${esc(f.must||"")}" placeholder="ex. le dragon doré légendaire, le nid niveau max"></label>
    <div class="drop" id="tDrop" tabindex="0" role="button" aria-label="Ajouter des captures d'écran du jeu"><b>Ajoute 3 à 10 captures d'écran de ton jeu</b><span class="src">Glisse-les ici ou appuie pour choisir. Montre les personnages, les modèles, la carte, les moments forts. Plus elles sont belles, meilleures seront les miniatures.</span><input type="file" id="tFiles" accept="image/*" multiple hidden></div>
    <div id="tShots" class="shotgrid"></div></div>

  <div class="card"><div class="steph"><span class="stepn">3</span><h3>Miniatures de référence</h3><span class="src">les jeux les plus joués du même type</span></div>
    <p class="src" style="margin:0">Le site prend les miniatures des jeux du top 1000 qui ressemblent le plus au tien. L'IA va analyser ce qu'elles ont en commun (cadrage, personnages, couleurs, texte, effets) pour faire les tiennes dans le même style, sans les copier. Retire celles qui ne collent pas avec ×.</p>
    <div class="controls"><button type="button" id="tRefresh">Rechercher à nouveau</button>
      <label class="fld" for="tAdd" style="min-width:240px">Ajouter un jeu du top 1000 <input type="text" id="tAdd" list="tAddList" placeholder="nom du jeu"></label><datalist id="tAddList"></datalist><button type="button" id="tAddGo">Ajouter</button></div>
    <div id="tRefs"></div></div>

  <div class="card"><div class="steph"><span class="stepn">4</span><h3>Analyse</h3></div>
    <div class="controls"><label class="fld" for="tCount">Nombre de miniatures <select id="tCount"><option>3</option><option selected>5</option><option>8</option></select></label>
      <label class="fld" for="tText">Texte sur l'image <select id="tText"><option value="auto">Comme les meilleurs jeux</option><option value="none">Aucun texte</option><option value="short">Un ou deux mots</option></select></label>
      <button class="primary" type="button" id="tAnalyze">Analyser le jeu et les références</button></div>
    <div id="tAnaMsg" class="src" role="status"></div>
    <div id="tReports" class="grid g2"></div></div>

  <div class="card"><div class="steph"><span class="stepn">5</span><h3>Miniatures</h3></div>
    <div class="controls"><button class="primary" type="button" id="tGenAll" disabled>Créer les miniatures une par une</button><button type="button" id="tIcon" disabled>Créer l'icône du jeu</button><span class="src">Chaque image est facturée par OpenAI sur ta clé : regarde le prix sur leur page de tarifs.</span></div>
    <div id="tOut" class="grid"></div></div>`;

  // clé
  const saved=(()=>{try{return localStorage.getItem(KEY)}catch{return null}})();
  if(saved){$("#tKey").value=saved;connect(true)}
  $("#tConnect").onclick=()=>connect(false);
  $("#tForget").onclick=()=>{try{localStorage.removeItem(KEY)}catch{};TH.key=null;$("#tKey").value="";setConn(false,"Clé effacée de cet appareil.");$("#tModels").hidden=true;updateButtons()};
  ["tVision","tImage"].forEach(id=>$("#"+id).onchange=()=>{TH.vision=$("#tVision").value;TH.image=$("#tImage").value;store.set(MOD,{vision:TH.vision,image:TH.image})});
  // formulaire
  const saveF=()=>store.set(FORM,{name:$("#tName").value,link:$("#tLink").value,loop:$("#tLoop").value,genre:$("#tGenre").value,desc:$("#tDesc").value,must:$("#tMust").value});
  ["tName","tLink","tDesc","tMust"].forEach(id=>$("#"+id).addEventListener("input",saveF));
  ["tLoop","tGenre"].forEach(id=>$("#"+id).addEventListener("change",()=>{saveF();autoRefs()}));
  let deb;$("#tDesc").addEventListener("input",()=>{clearTimeout(deb);deb=setTimeout(autoRefs,700)});
  $("#tLink").addEventListener("change",linkFill);
  // captures
  const drop=$("#tDrop"),files=$("#tFiles");
  drop.onclick=()=>files.click();drop.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();files.click()}};
  drop.ondragover=e=>{e.preventDefault();drop.classList.add("over")};drop.ondragleave=()=>drop.classList.remove("over");
  drop.ondrop=e=>{e.preventDefault();drop.classList.remove("over");addFiles(e.dataTransfer.files)};
  files.onchange=()=>addFiles(files.files);
  // références
  $("#tAddList").innerHTML=G.filter(g=>g.t).map(g=>`<option value="${esc(g.tn)}">`).join("");
  $("#tAddGo").onclick=()=>{const q=$("#tAdd").value.trim().toLowerCase();const g=G.find(x=>x.tn.toLowerCase()===q)||G.find(x=>x.tn.toLowerCase().includes(q));if(g&&g.t){TH.refManual.add(g.i);TH.refOff.delete(g.i);$("#tAdd").value="";autoRefs()}};
  $("#tRefresh").onclick=()=>{TH.refOff.clear();autoRefs()};
  $("#tAnalyze").onclick=analyze;$("#tGenAll").onclick=genAll;$("#tIcon").onclick=genIcon;
  autoRefs();updateButtons();
}
function setConn(ok,msg){const c=$("#tConn");c.className="chip "+(ok?"good":"warn");c.textContent=ok?"Connecté":"Non connecté";$("#tConnMsg").textContent=msg||""}
async function connect(silent){
  const k=$("#tKey").value.trim();if(!/^sk-/.test(k)){if(!silent)setConn(false,"La clé doit commencer par « sk- ».");return}
  TH.key=k;$("#tConnect").disabled=true;$("#tConnMsg").textContent="Vérification de la clé…";
  try{const d=await oai("/models");TH.models=(d.data||[]).map(m=>m.id).sort();
    const prev=store.get(MOD)||{};TH.vision=TH.models.includes(prev.vision)?prev.vision:pickVision(TH.models);TH.image=TH.models.includes(prev.image)?prev.image:pickImage(TH.models);
    const vis=TH.models.filter(id=>/^(gpt-|o\d)/.test(id)&&!/(image|audio|realtime|tts|transcribe|embedding|moderation|search|dall)/.test(id));
    const img=TH.models.filter(id=>/(gpt-image|chatgpt-image)/.test(id));if(!img.includes(TH.image))img.unshift(TH.image);
    $("#tVision").innerHTML=vis.map(id=>`<option ${id===TH.vision?"selected":""}>${esc(id)}</option>`).join("");
    $("#tImage").innerHTML=img.map(id=>`<option ${id===TH.image?"selected":""}>${esc(id)}</option>`).join("");
    $("#tModels").hidden=false;
    if($("#tRemember").checked){try{localStorage.setItem(KEY,k)}catch{}}else{try{localStorage.removeItem(KEY)}catch{}}
    setConn(true,`Clé valide. Analyse : ${TH.vision} · Images : ${TH.image}.`);
  }catch(e){TH.key=null;setConn(false,e.message)}
  $("#tConnect").disabled=false;updateButtons();
}
function linkFill(){const m=$("#tLink").value.match(/games\/(\d+)/);if(!m)return;const g=G.find(x=>String(x.pl)===m[1]);
  if(!g){$("#tLink").insertAdjacentHTML("afterend","");return}
  if(!$("#tName").value)$("#tName").value=g.tn;if(!$("#tDesc").value)$("#tDesc").value=clean(g.d).slice(0,300);
  if(g.loops[0]&&!$("#tLoop").value)$("#tLoop").value=g.loops[0];if(!$("#tGenre").value&&g.g)$("#tGenre").value=g.g;
  TH.refOff.add(g.i);autoRefs()}
async function addFiles(list){
  const arr=[...list].filter(f=>/^image\//.test(f.type)).slice(0,16-TH.shots.length);
  for(const f of arr){try{TH.shots.push(await shrink(f))}catch{}}
  renderShots();updateButtons();
}
function renderShots(){
  $("#tShots").innerHTML=TH.shots.map((s,i)=>`<figure class="shot"><img src="${s.data}" alt="Capture ${i+1}"><span class="badge">${i+1}</span><button type="button" class="tx" data-del="${i}" aria-label="Retirer la capture ${i+1}">×</button></figure>`).join("");
  $("#tShots").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{TH.shots.splice(+b.dataset.del,1);renderShots();updateButtons()});
}
function updateButtons(){
  const can=!!TH.key&&!TH.busy;
  $("#tAnalyze").disabled=!can||!TH.shots.length;
  $("#tGenAll").disabled=!can||!TH.concepts.length;$("#tIcon").disabled=!can||!TH.rep.game;
  $("#tAnaMsg").textContent=!TH.key?"Connecte d'abord ta clé (étape 1).":!TH.shots.length?"Ajoute au moins une capture d'écran de ton jeu (étape 2).":$("#tAnaMsg").textContent.startsWith("Connecte")||$("#tAnaMsg").textContent.startsWith("Ajoute")?"":$("#tAnaMsg").textContent;
}

/* ---------- Analyse (3 étapes) ---------- */
const RULES="Roblox rules: show only what really exists in the game (no misleading content), no Roblox logo, no real brands, no copyrighted characters from movies/anime/other games, no fake Robux or price claims, no real people. Characters must look like Roblox avatars or the game's own characters.";
async function analyze(){
  TH.busy=true;updateButtons();const msg=t=>$("#tAnaMsg").textContent=t;
  const name=$("#tName").value.trim()||"(sans nom)",desc=$("#tDesc").value.trim(),must=$("#tMust").value.trim(),loop=guessLoop();
  try{
    msg(`1/3 · Analyse des ${TH.refs.length} miniatures de référence…`);
    const refParts=[{type:"text",text:`These are the thumbnails of the most played Roblox games similar to my game (type: ${loop?LOOPS[loop].name:"unknown"}). Study them like a senior Roblox thumbnail artist.\n${TH.refs.map((g,i)=>`Image ${i+1}: "${g.tn}", ${g.p} concurrent players, rank #${g.rank}`).join("\n")}\nReturn JSON with French text values: {"resume": "2-3 phrases", "points_communs": [5-8 points précis], "composition": [patterns de cadrage], "camera": "", "personnages": "poses, expressions, taille à l'écran", "texte": "usage du texte : présence, police, couleurs, contours, taille", "couleurs": "", "lumiere_effets": "", "a_eviter": [], "par_miniature": [{"jeu": "", "ce_qui_marche": ""}]}`}];
    TH.refs.forEach(g=>refParts.push({type:"image_url",image_url:{url:g.t,detail:"high"}}));
    TH.rep.refs=await chatJSON("You are an expert Roblox thumbnail art director. You analyze what makes top Roblox game thumbnails get clicks. Answer only with valid JSON.",refParts);
    renderReports();
    msg("2/3 · Analyse de ton jeu à partir de tes captures…");
    const gameParts=[{type:"text",text:`My Roblox game: "${name}". Type: ${loop?LOOPS[loop].name:"?"}. Description from the creator: ${desc||"(none)"}. Must show: ${must||"(nothing specific)"}.\nThe images are real screenshots of my game. Analyze them precisely: list every important model, character, creature, building, object, the environment, colors, art style, lighting, mood, and what would make players want to click.\nReturn JSON with French text values: {"resume": "", "style_visuel": "", "elements_cles": [{"nom": "", "description_visuelle": "description précise de son apparence (formes, couleurs, matières)", "capture": numéro de la capture où on le voit le mieux, "pourquoi_le_montrer": ""}], "personnages": "", "environnement": "", "couleurs_dominantes": [""], "ambiance": "", "accroche": "ce qui donne envie de cliquer", "ne_pas_montrer": [""]}`}];
    TH.shots.forEach(s=>gameParts.push({type:"image_url",image_url:{url:s.data,detail:"high"}}));
    TH.rep.game=await chatJSON("You are an expert game artist who analyzes Roblox game screenshots in detail. Answer only with valid JSON.",gameParts);
    renderReports();
    msg("3/3 · Création des concepts de miniatures…");
    const n=+$("#tCount").value,txt=$("#tText").value;
    const c=await chatJSON("You are a senior Roblox thumbnail art director and prompt engineer for an image model. Answer only with valid JSON.",[{type:"text",text:`Create ${n} different thumbnail concepts for my Roblox game "${name}".\nGame analysis: ${JSON.stringify(TH.rep.game)}\nWhat top similar games do: ${JSON.stringify(TH.rep.refs)}\nRules:\n- Each concept must use the same proven style as the top thumbnails (composition, camera, character size, colors, lighting, effects), adapted to my game, never a copy of one of them.\n- Each concept must faithfully show my game's real models, characters and environment, described visually (shapes, colors, materials) so the image model reproduces them. The screenshots will be given to the image model as references.\n- Text on image: ${txt==="none"?"no text at all":txt==="short"?"at most 1-2 big words":"follow what the top thumbnails do (if they use text, short, bold, outlined)"}.\n- Concepts must be clearly different from each other (different moment, angle, character focus or emotion).\n- ${RULES}\nReturn JSON: {"concepts":[{"titre": "titre court en français", "idee": "l'idée en une phrase, en français", "pourquoi": "pourquoi ça marchera, en français, en citant les références", "texte_image": "exact words on the image or empty", "captures": [numéros des captures à donner au modèle d'image, 1 à 4], "prompt": "very detailed English prompt for the image model: Roblox game thumbnail, 16:9, subject, composition, camera, pose, expressions, environment, colors, lighting, effects, text styling, quality keywords"}]}`}]);
    TH.concepts=(c.concepts||[]).slice(0,n);TH.res={};
    msg(TH.concepts.length?`Analyse terminée : ${TH.concepts.length} concepts prêts. Vérifie-les puis crée les miniatures.`:"L'analyse n'a renvoyé aucun concept. Réessaie.");
    renderConcepts();
  }catch(e){msg("Erreur : "+e.message)}
  TH.busy=false;updateButtons();
}
const list=a=>Array.isArray(a)&&a.length?`<ul class="list">${a.map(x=>`<li>${esc(typeof x==="string"?x:(x.nom?`${x.nom} : ${x.description_visuelle||""}`:x.jeu?`${x.jeu} : ${x.ce_qui_marche}`:JSON.stringify(x)))}</li>`).join("")}</ul>`:"";
function renderReports(){
  const r=TH.rep.refs,g=TH.rep.game;
  $("#tReports").innerHTML=(r?`<div class="card" style="box-shadow:none;background:var(--bg2)"><h3>Ce qui marche chez les meilleurs</h3><p style="margin:0">${esc(r.resume||"")}</p>${list(r.points_communs)}
    <details><summary class="src">Détail : cadrage, personnages, texte, couleurs</summary><div class="src" style="display:grid;gap:6px;margin-top:6px">${["composition","camera","personnages","texte","couleurs","lumiere_effets"].map(k=>r[k]?`<div><b>${k.replace("_"," et ")} :</b> ${esc(Array.isArray(r[k])?r[k].join(" ; "):r[k])}</div>`:"").join("")}${r.a_eviter?.length?`<div><b>À éviter :</b> ${esc(r.a_eviter.join(" ; "))}</div>`:""}</div>${list(r.par_miniature)}</details></div>`:"")+
   (g?`<div class="card" style="box-shadow:none;background:var(--bg2)"><h3>Ce que l'IA voit dans ton jeu</h3><p style="margin:0">${esc(g.resume||"")}</p><div class="src"><b>Style :</b> ${esc(g.style_visuel||"")} · <b>Ambiance :</b> ${esc(g.ambiance||"")}</div>
    <b>Éléments clés</b>${list(g.elements_cles)}<div class="src"><b>Accroche :</b> ${esc(g.accroche||"")}</div>${(g.couleurs_dominantes||[]).length?`<div class="kv">${g.couleurs_dominantes.map(c=>`<span class="chip">${esc(c)}</span>`).join("")}</div>`:""}</div>`:"");
}
function renderConcepts(){
  $("#tOut").innerHTML=TH.concepts.map((c,i)=>`<article class="tcard" id="tc${i}">
    <div class="tcard-img" id="ti${i}">${TH.res[i]?.img?`<img src="${TH.res[i].img}" alt="Miniature ${i+1}">`:`<div class="ph"><span>${i+1}</span><small>pas encore créée</small></div>`}</div>
    <div class="tcard-body">
      <span class="stamp">Concept ${i+1}${c.texte_image?` · texte « ${esc(c.texte_image)} »`:""}</span><h3>${esc(c.titre||"")}</h3>
      <p style="margin:0">${esc(c.idee||"")}</p><p class="src" style="margin:0">${esc(c.pourquoi||"")}</p>
      <details><summary class="src">Prompt envoyé au modèle d'image</summary><textarea id="tp${i}" rows="5" style="margin-top:6px;font:12.5px/1.45 var(--mono)">${esc(c.prompt||"")}</textarea></details>
      <div id="tcrit${i}">${TH.res[i]?.crit?critHTML(TH.res[i].crit):""}</div>
      <div class="controls">
        <button class="primary" type="button" data-gen="${i}">${TH.res[i]?.img?"Recréer":"Créer"}</button>
        <button type="button" data-rate="${i}" ${TH.res[i]?.img?"":"disabled"}>Noter</button>
        <button type="button" data-dl="${i}" ${TH.res[i]?.img?"":"disabled"}>Télécharger 1920×1080</button>
      </div>
      <div class="controls"><label class="fld" for="tf${i}" style="flex:1;min-width:200px">Améliorer avec une consigne <input type="text" id="tf${i}" placeholder="ex. dragon plus gros, ciel plus orange, texte plus lisible"></label><button type="button" data-fix="${i}" ${TH.res[i]?.img?"":"disabled"}>Améliorer</button></div>
      <div class="src" id="ts${i}" role="status"></div>
    </div></article>`).join("");
  $("#tOut").querySelectorAll("[data-gen]").forEach(b=>b.onclick=()=>genOne(+b.dataset.gen));
  $("#tOut").querySelectorAll("[data-rate]").forEach(b=>b.onclick=()=>rate(+b.dataset.rate));
  $("#tOut").querySelectorAll("[data-dl]").forEach(b=>b.onclick=async()=>download(await exportPng(TH.res[+b.dataset.dl].img,1920,1080),`miniature-${slug()}-${+b.dataset.dl+1}.png`));
  $("#tOut").querySelectorAll("[data-fix]").forEach(b=>b.onclick=()=>fix(+b.dataset.fix));
  updateButtons();
}
const slug=()=>($("#tName").value||"jeu").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"jeu";
function refsFor(c){const idx=(c.captures||[]).map(n=>+n-1).filter(n=>n>=0&&n<TH.shots.length);const use=(idx.length?idx:TH.shots.map((_,i)=>i)).slice(0,6);return use.map(i=>TH.shots[i].blob)}
function fullPrompt(c,i){const p=$("#tp"+i)?.value||c.prompt;return `${p}\n\nThis is a Roblox game thumbnail (16:9). The attached images are real screenshots of the game: reuse its actual models, characters, creatures, buildings and environment faithfully (same shapes, colors and style), staged in a far more dramatic, polished, eye-catching composition with professional lighting and depth of field, like the best Roblox thumbnails. ${c.texte_image?`Text on the image, spelled exactly: "${c.texte_image}", big, bold, outlined, highly readable on a phone.`:"No text."} ${RULES}`}
async function genOne(i){
  if(TH.busy)return;const c=TH.concepts[i];const st=$("#ts"+i);TH.busy=true;updateButtons();
  $("#ti"+i).innerHTML=`<div class="ph busy"><span class="spin"></span><small>Création en cours… (jusqu'à 1 minute)</small></div>`;st.textContent="";
  try{const img=await genImage(fullPrompt(c,i),refsFor(c),"thumb");TH.res[i]={img};st.textContent="Miniature créée."}
  catch(e){st.textContent="Erreur : "+e.message}
  TH.busy=false;renderOneCard(i);
}
function renderOneCard(i,msg){const keep=msg??document.getElementById("ts"+i)?.textContent;renderConcepts();const st=document.getElementById("ts"+i);if(st&&keep)st.textContent=keep;document.getElementById("tc"+i)?.scrollIntoView({block:"nearest"})}
async function genAll(){for(let i=0;i<TH.concepts.length;i++){if(TH.res[i]?.img)continue;await genOne(i);if(!TH.res[i]?.img)break}}
async function fix(i){
  const fb=$("#tf"+i).value.trim();if(!fb){$("#ts"+i).textContent="Écris d'abord ce qu'il faut changer.";return}
  if(TH.busy)return;TH.busy=true;updateButtons();const prev=TH.res[i].img;
  $("#ti"+i).innerHTML=`<div class="ph busy"><span class="spin"></span><small>Amélioration…</small></div>`;
  try{const blobs=[await dataToBlob(prev),...refsFor(TH.concepts[i]).slice(0,3)];
    const img=await genImage(`Edit the first image (a Roblox game thumbnail). Change only this: ${fb}. Keep everything else identical (composition, characters, style, text). The other images are game screenshots for reference. ${RULES}`,blobs,"thumb");
    TH.res[i]={img,crit:null};$("#ts"+i).textContent="Miniature améliorée."}
  catch(e){TH.res[i].img=prev;$("#ts"+i).textContent="Erreur : "+e.message}
  TH.busy=false;renderOneCard(i);
}
function critHTML(c){const n=+c.note||0;return `<div class="orig ${n>=8?"ok":n>=6?"warn":"bad"}"><b>Note : ${n}/10 · ${esc(c.verdict||"")}</b>${c.points_forts?.length?`<span class="src"><b>Points forts :</b> ${esc(c.points_forts.join(" ; "))}</span>`:""}${c.a_ameliorer?.length?`<span class="src"><b>À améliorer :</b> ${esc(c.a_ameliorer.join(" ; "))}</span>`:""}</div>`}
async function rate(i){
  if(TH.busy)return;TH.busy=true;updateButtons();$("#ts"+i).textContent="L'IA compare ta miniature aux meilleures…";
  try{const parts=[{type:"text",text:`Rate this Roblox thumbnail (first image) for the game "${$("#tName").value}" against the top thumbnails of similar games (other images). Be strict like a professional. Criteria: readability on a phone, clear subject, emotion, composition, colors and contrast, faithfulness to the real game, click appeal compared to the references. Return JSON with French values: {"note": 0-10, "verdict": "une phrase", "points_forts": [], "a_ameliorer": ["consignes précises et actionnables"]}`},{type:"image_url",image_url:{url:TH.res[i].img,detail:"high"}}];
    TH.refs.slice(0,6).forEach(g=>parts.push({type:"image_url",image_url:{url:g.t,detail:"low"}}));
    const c=await chatJSON("You are a strict, expert Roblox thumbnail reviewer. Answer only with valid JSON.",parts);TH.res[i].crit=c;
    if(c.a_ameliorer?.length)setTimeout(()=>{const inp=$("#tf"+i);if(inp&&!inp.value)inp.value=c.a_ameliorer.slice(0,2).join(" ; ")},0);
    $("#ts"+i).textContent="";}
  catch(e){$("#ts"+i).textContent="Erreur : "+e.message}
  TH.busy=false;renderOneCard(i);
}
async function genIcon(){
  if(TH.busy)return;TH.busy=true;updateButtons();
  const box=document.getElementById("tIconBox")||(()=>{$("#tOut").insertAdjacentHTML("afterbegin",`<article class="tcard" id="tIconBox"><div class="tcard-img sq" id="tIconImg"></div><div class="tcard-body"><span class="stamp">Icône du jeu</span><h3>Icône 512×512</h3><div class="controls"><button type="button" id="tIconDl" disabled>Télécharger 512×512</button></div><div class="src" id="tIconSt"></div></div></article>`);return document.getElementById("tIconBox")})();
  $("#tIconImg").innerHTML=`<div class="ph busy"><span class="spin"></span><small>Création de l'icône…</small></div>`;
  try{const g=TH.rep.game||{};
    const img=await genImage(`Roblox game icon, square, for the game "${$("#tName").value}". One iconic subject from the game, big and centered, filling the frame: ${(g.elements_cles||[]).slice(0,2).map(e=>e.nom+": "+e.description_visuelle).join("; ")}. Bold readable silhouette at small size, vivid colors, strong rim light, simple background, professional quality like the best Roblox game icons. ${$("#tText").value==="none"?"No text.":"At most one short word if it helps."} The attached images are real screenshots of the game: reuse its actual models faithfully. ${RULES}`,TH.shots.slice(0,4).map(s=>s.blob),"icon");
    $("#tIconImg").innerHTML=`<img src="${img}" alt="Icône du jeu">`;$("#tIconDl").disabled=false;$("#tIconDl").onclick=async()=>download(await exportPng(img,512,512),`icone-${slug()}.png`);$("#tIconSt").textContent=""}
  catch(e){$("#tIconImg").innerHTML="";$("#tIconSt").textContent="Erreur : "+e.message}
  TH.busy=false;updateButtons();
}

/* ---------- Branchement ---------- */
function onRoute(){if(location.hash==="#miniatures"&&typeof G!=="undefined"&&G.length){ui();renderRefs()}}
window.addEventListener("hashchange",onRoute);
const prevAfter=window.LABO_AFTER_LOAD;window.LABO_AFTER_LOAD=()=>{prevAfter&&prevAfter();if(document.getElementById("thumbApp")?.dataset.ready)autoRefs();onRoute()};
})();
