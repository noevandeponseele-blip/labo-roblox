import json,subprocess,uuid,time,os,datetime
from concurrent.futures import ThreadPoolExecutor
def get(u):
    for i in range(5):
        try:
            d=json.loads(subprocess.run(["curl","-sS","-m","25",u],capture_output=True,text=True).stdout)
            if not (isinstance(d,dict) and d.get("errors")): return d
        except Exception: pass
        time.sleep(2*(i+1))
    return {}
S=str(uuid.uuid4());E="https://apis.roblox.com/explore-api/v1/get-sorts?sessionId="+S
f={x["filterId"]:[o["optionId"] for o in x["filterOptions"]] for x in get(E+"&device=computer&country=all")["sorts"][0]["filters"]}
P="all us br id ph mx gb de fr ca au ru tr th vn pl es it nl be jp kr ar cl co pe sa ae eg ma my sg in pk ua ro se no dk fi pt ch at nz za ng ke ve ec gt do pr il gr cz hu bg rs hr ie tw hk kz by lt lv ee sk si uy py bo cr pa sv hn ni jm tt dz tn jo kw qa om bh lb iq bd lk np mm kh la mn".split()
C=[c for c in P if c in f["country_filter_v3"]]
K=[(d,c) for c in C for d in (["all","computer","high_end_phone","low_end_phone","high_end_tablet","console"] if c in P[:30] else ["all"])]
code={"top-trending":"T","up-and-coming":"U","top-playing-now":"P","fun-with-friends":"F","top-revisited":"R"}
seen={}
def crawl(k):
    time.sleep(0.15)
    return get(E+"&device=%s&country=%s"%k)
with ThreadPoolExecutor(3) as ex:
    results=list(ex.map(crawl,K))
missing=[k for k,r in zip(K,results) if not r.get("sorts")]
for k in missing:  # deuxième passage, lentement, pour les classements refusés
    time.sleep(1)
    results.append(get(E+"&device=%s&country=%s"%k))
print("classements:",len(K),"| refusés au 1er passage:",len(missing))
if True:
    for res in results:
        for s in res.get("sorts",[]):
            for g in s.get("games") or []:
                e=seen.setdefault(g["universeId"],{"g":g.get("genreL1") or "","s":set()})
                e["s"].add(code.get(s.get("sortId"),"?"))
                if not e["g"]: e["g"]=g.get("genreL1") or ""
ids=list(seen);ch=[ids[i:i+50] for i in range(0,len(ids),50)]
det,vot={},{}
with ThreadPoolExecutor(3) as ex:
    for d in ex.map(lambda c:get("https://games.roblox.com/v1/games?universeIds="+",".join(map(str,c))).get("data",[]),ch):
        for g in d: det[g["id"]]=g
    for d in ex.map(lambda c:get("https://games.roblox.com/v1/games/votes?universeIds="+",".join(map(str,c))).get("data",[]),ch):
        for v in d: vot[v["id"]]=v
out=[]
for i,g in det.items():
    v=vot.get(i,{});u,dn=v.get("upVotes",0),v.get("downVotes",0)
    out.append({"i":i,"pl":g.get("rootPlaceId"),"n":g.get("name",""),"d":(g.get("description") or "")[:350],"c":(g.get("creator") or {}).get("name",""),
      "g":seen[i]["g"],"p":g.get("playing") or 0,"v":g.get("visits") or 0,"f":g.get("favoritedCount") or 0,
      "r":round(u/(u+dn)*100,1) if u+dn else None,"cr":(g.get("created") or "")[:10],"u":(g.get("updated") or "")[:10],"s":"".join(sorted(seen[i]["s"]))})
out.sort(key=lambda x:-x["p"])
# miniatures et icônes du top 1000 (pour le créateur de miniatures)
top_ids=[g["i"] for g in out[:1000]];tc=[top_ids[i:i+50] for i in range(0,len(top_ids),50)]
TH,IC={},{}
def th(c):
    return get("https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds="+",".join(map(str,c))+"&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false").get("data",[])
def ic(c):
    return get("https://thumbnails.roblox.com/v1/games/icons?universeIds="+",".join(map(str,c))+"&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false").get("data",[])
try:
    with ThreadPoolExecutor(3) as ex:
        for d in ex.map(th,tc):
            for x in d:
                t=(x.get("thumbnails") or [{}])[0]
                if t.get("state")=="Completed" and t.get("imageUrl"): TH[x.get("universeId")]=t["imageUrl"]
        for d in ex.map(ic,tc):
            for x in d:
                if x.get("state")=="Completed" and x.get("imageUrl"): IC[x.get("targetId")]=x["imageUrl"]
except Exception as e: print("miniatures indisponibles:",e)
for g in out[:1000]:
    if g["i"] in TH: g["t"]=TH[g["i"]]
    if g["i"] in IC: g["ic"]=IC[g["i"]]
print("miniatures:",len(TH),"icônes:",len(IC))
os.makedirs("data",exist_ok=True)
more=[[g["n"],g["pl"],g["p"]] for g in out[1000:]]
json.dump({"fetched":datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="minutes"),"pool":len(out),"games":out[:1000],"more":more},open("data/data.json","w"),ensure_ascii=False,separators=(",",":"))
print("OK",len(out[:1000]),"jeux sur",len(out),"| 1er:",out[0]["n"],out[0]["p"],"| 1000e:",out[min(999,len(out)-1)]["p"])
