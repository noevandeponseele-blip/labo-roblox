/* Labo des jeux Roblox — noter une idée, fiche « Info », plan de production multi-agents.
   Utilise les variables globales du script principal : G, A, D, LOOPS, THEMES, TWISTS, GFR, gname, esc, fr, fmtK, pct, store, gameUrl, nextSeason, seasonText, dfmt, toks, clean. */

/* ---------- Reconnaissance en français ---------- */
const FR_LOOP={
 steal:/vol(er|e|eur)?\b|piquer|d[ée]rob|braqu/i, stat:/\+1|vitesse|chaque seconde|chaque clic|cliquer|incr[ée]ment|rebirth|renaissance/i,
 collect:/oeuf|pet\b|pets\b|collection|collectionn|rare|raret[ée]|mutation|jardin|pousser|graine|[ée]clo/i,
 throwfeed:/lancer|nourrir|nourris|[ée]volu|grandir|faire grandir/i, rounds:/meurtr|sh[ée]rif|r[ôo]le|cache-cache|manche|imposteur|duel/i,
 survive:/surviv|nuit|horreur|peur|[ée]chapp|fuir|s'enfuir/i, rp:/\brp\b|roleplay|jeu de r[ôo]le|ville|m[ée]tier|maison|vie de/i,
 fashion:/habill|tenue|mode\b|style|d[ée]fil[ée]|maquill|avatar/i, build:/constru|b[âa]tir|fabriqu|assembl/i,
 tycoon:/tycoon|magasin|vendre|entreprise|usine|restaurant|business|boutique/i, td:/tower defense|d[ée]fense|d[ée]fendre|vagues?\b/i,
 arena:/combat|bagarre|ar[èe]ne|pouvoir|ragdoll|claque|frapper|battle/i, shooter:/\btir\b|tirer|arme|pistolet|fusil|guerre|sniper/i,
 sport:/foot|basket|sport|course\b|ballon|karting|tennis|volley/i, obby:/obby|parcours|sauter|grimper|tour\b|plateforme/i,
 fish:/p[êe]che|p[êe]cher|poisson|creuser|miner|mine\b/i
};
const FR_THEME={
 animaux:/animal|animaux|chien|chat\b|chats\b|lapin|dino|ferme|capybara/i, oeufs:/oeuf/i,
 horreur:/horreur|peur|fant[ôo]me|monstre|hant[ée]|tueur|cauchemar/i, brainrot:/brainrot|m[èe]me|skibidi/i,
 anime:/anime|manga|ninja|[ée]p[ée]e|aura|d[ée]mon/i, cute:/mignon|kawaii|rose\b|princesse|doux/i,
 nourriture:/nourriture|cuisine|burger|pizza|g[âa]teau|bonbon|fruit|citron|sushi/i, vehicules:/voiture|camion|avion|bateau|train\b|moto|fus[ée]e/i,
 sport:/foot|basket|sport|ballon/i, armee:/arm[ée]e|guerre|soldat|tank/i, noel:/no[ëe]l|neige|hiver|p[èe]re no[ëe]l|cadeau|glace/i,
 prison:/prison|police|policier|voleur|braquage|flic/i, espace:/espace|plan[èe]te|alien|fus[ée]e|lune|[ée]toile/i
};
const fixA=t=>t.replace(/\b([Aa]) ([AEIOUaeiou])/g,"$1n $2");
const pitchOf=I=>I.text?I.text:`${LOOPS[I.loop.k].desc.replace(/\.$/,"")}, sur le thème « ${I.T.label.toLowerCase()} », avec ${I.twist}.`;
const norm=s=>s.toLowerCase().replace(/œ/g,"oe").replace(/æ/g,"ae");

/* ---------- Conception par recette ---------- */
const LOOP_DESIGN={
 steal:{core:["Le joueur récupère des objets qui apparaissent ou qui sont produits dans sa base","Les objets rapportent de l'argent chaque seconde tant qu'ils sont dans sa base","Il dépense l'argent pour améliorer sa base, sa vitesse et ses défenses","Il peut entrer chez les autres pour voler un objet et le ramener chez lui avant d'être touché","Les objets plus rares rapportent plus et attirent les voleurs"],
  systems:["Bases personnelles (une par joueur, 6 à 8 joueurs par serveur)","Objets avec 6 raretés (Commun → Secret) et revenu par seconde","Vol : porter l'objet ralentit, le propriétaire peut le reprendre en touchant le voleur","Verrou de base temporaire (60 s) après achat ou rebirth","Rebirth : remise à zéro contre un multiplicateur permanent","Marché ou échanges entre joueurs (optionnel en v1)"],
  zones:["Rangée de bases identiques autour d'une zone centrale","Tapis roulant ou point d'apparition central des objets","Boutique d'améliorations près du spawn","Zone de spawn protégée"],
  ui:["Argent et revenu/seconde en haut","Bouton Verrouiller la base avec compte à rebours","Fiche d'objet (rareté, revenu)","Alerte « On te vole ! » avec flèche vers le voleur","Boutique et Rebirth"],
  save:["Argent","Objets possédés et leur emplacement","Niveau d'améliorations","Nombre de rebirths"],
  money:["Game pass x2 argent","Game pass vitesse +","Produit : verrou de base instantané","Produit : objet rare garanti (afficher clairement ce qu'on achète)"],
  sfx:["Ramassage d'objet","Pièces qui tombent (revenu)","Alarme de vol","Verrou qui se ferme","Rebirth (montée magique)"],
  first5:"Le joueur reçoit un objet gratuit, voit l'argent monter, achète sa première amélioration en moins d'une minute, puis voit un autre joueur voler et comprend qu'il peut faire pareil."},
 stat:{core:["Le joueur gagne +1 à une stat (vitesse, saut, force) automatiquement ou en cliquant","La stat lui permet d'aller plus loin sur un parcours ou une piste","Plus loin = zones avec de meilleures récompenses","Il dépense les récompenses en multiplicateurs","Rebirth pour un bonus permanent"],
  systems:["Stat principale qui monte chaque seconde (affichée en très grand)","Mondes ou zones débloqués à des paliers de stat","Multiplicateurs (pets, trails, boosts)","Rebirth avec multiplicateur permanent","Classement du serveur"],
  zones:["Piste ou couloir très long avec portes de paliers","Zone de départ avec boutique","Chaque palier change de décor"],
  ui:["Stat géante au centre-haut","Barre vers le prochain palier","Boutique de boosts","Bouton Rebirth","Classement"],
  save:["Stat","Rebirths","Boosts achetés","Zone max atteinte"],
  money:["Game pass x2 stat","Game pass auto-clic","Produit boost x3 pendant 15 min","Produit saut de zone"],
  sfx:["Petit tick à chaque +1","Passage de palier","Rebirth","Vent / vitesse"],
  first5:"Le chiffre monte dès la première seconde, le premier palier arrive en moins de 30 secondes et la première porte s'ouvre devant le joueur."},
 collect:{core:["Le joueur obtient des œufs, graines ou boîtes avec la monnaie du jeu","Il les ouvre ou les fait pousser et obtient un objet d'une rareté aléatoire","Les objets lui rapportent de la monnaie ou des bonus","Des mutations rares rendent certains objets uniques","Il échange avec d'autres joueurs pour compléter sa collection"],
  systems:["Table de raretés avec probabilités affichées","Mutations (doré, arc-en-ciel…) qui multiplient la valeur","Index de collection à compléter","Échanges sécurisés entre joueurs (double confirmation)","Événements à durée limitée avec objets exclusifs"],
  zones:["Hub central avec boutique d'œufs ou de graines","Parcelles ou enclos personnels","Zone d'échange","Zone d'événement"],
  ui:["Ouverture d'œuf animée","Inventaire avec filtres par rareté","Index de collection","Fenêtre d'échange","Probabilités affichées sur chaque œuf"],
  save:["Monnaie","Inventaire complet (objet, rareté, mutation)","Index débloqué","Historique d'échanges récent"],
  money:["Game pass chance +","Game pass emplacements d'inventaire","Produit pack de monnaie","Produit ouverture triple (afficher les probabilités)"],
  sfx:["Ouverture d'œuf / éclosion","Fanfare de rareté (plus forte pour les rares)","Pousse de plante","Échange réussi"],
  first5:"Le joueur ouvre un premier œuf gratuit dans les 20 premières secondes, obtient un objet, voit qu'il en existe des plus rares et découvre l'index à compléter."},
 throwfeed:{core:["Le joueur ramasse ou achète de la nourriture ou des objets","Il les lance ou les donne à une créature ou un personnage","La créature grandit ou évolue à chaque palier","L'évolution débloque de nouvelles zones ou de meilleures récompenses","Il recommence avec une créature plus rare"],
  systems:["Créature qui change visiblement de taille et de forme","Paliers d'évolution (5 à 10)","Types de nourriture avec valeur différente","Créatures à collectionner","Lancer avec physique (trajectoire visible)"],
  zones:["Enclos ou arène centrale","Zones de nourriture","Boutique","Zone d'exposition des créatures évoluées"],
  ui:["Barre d'évolution","Sélecteur de nourriture","Galerie des créatures","Boutique"],
  save:["Créatures et leur stade","Monnaie","Nourriture en stock"],
  money:["Game pass nourriture x2","Produit nourriture légendaire","Game pass emplacement de créature"],
  sfx:["Lancer (whoosh)","Croc / miam","Évolution (montée)","Cri de la créature"],
  first5:"Le joueur lance sa première nourriture en 10 secondes et voit la créature grandir avant la fin de la première minute."},
 rounds:{core:["Les joueurs attendent dans un lobby puis sont envoyés sur une carte","Chacun reçoit un rôle secret","La manche dure 2 à 4 minutes avec un objectif par rôle","Fin de manche : récompenses et cosmétiques","Retour au lobby, nouvelle carte"],
  systems:["Gestionnaire de manches (lobby → carte → fin)","Rôles attribués au hasard (avec garantie de rotation)","Plusieurs cartes en rotation","Monnaie gagnée par manche","Cosmétiques (skins d'arme, effets) et échanges"],
  zones:["Lobby avec boutique et classement","3 à 5 cartes de taille moyenne avec cachettes","Zone spectateur pour les éliminés"],
  ui:["Annonce du rôle en début de manche","Chrono de manche","Écran de fin avec récompenses","Inventaire de cosmétiques"],
  save:["Monnaie","Cosmétiques","Statistiques (victoires par rôle)"],
  money:["Produits cosmétiques","Game pass effets de victoire","Pass saisonnier (cosmétiques seulement)"],
  sfx:["Révélation du rôle","Musique de tension","Élimination","Victoire / défaite"],
  first5:"Le joueur rejoint une manche en moins de 30 secondes, comprend son rôle grâce à une phrase claire, et finit sa première manche en 3 minutes."},
 survive:{core:["Les joueurs commencent ensemble dans un lieu dangereux","Ils collectent des ressources ou accomplissent des tâches","Une menace (monstre, nuit, catastrophe) monte en intensité","Ils doivent tenir jusqu'à un objectif clair (X nuits, sortie)","Récompenses et déblocages pour la partie suivante"],
  systems:["Cycle jour/nuit ou phases de danger","Monstre avec IA (patrouille, poursuite, perte de trace)","Ressources et artisanat simple","Objectif final visible (compteur de nuits, sortie)","Classes ou objets de départ à débloquer"],
  zones:["Point de départ sûr (feu de camp, abri)","Zones de ressources plus dangereuses en s'éloignant","Lieu final ou boss","Repères visuels pour s'orienter"],
  ui:["Compteur d'objectif (nuit 3/99)","Santé et faim si besoin","Inventaire léger","Indicateur de danger"],
  save:["Objets et classes débloqués","Record (nuits survécues)","Monnaie"],
  money:["Classes de départ","Produit réanimation","Cosmétiques"],
  sfx:["Ambiance de forêt / bâtiment","Pas du monstre","Battement de cœur (danger proche)","Cri / jumpscare (rare)","Feu de camp (sécurité)"],
  first5:"Le joueur découvre l'abri, ramasse une première ressource, entend le monstre au loin et comprend l'objectif affiché en haut de l'écran."},
 rp:{core:["Le joueur choisit une maison, un métier ou un rôle","Il se déplace librement dans la ville ou le lieu","Il interagit avec les objets (portes, véhicules, téléphone)","Il invente des histoires avec les autres joueurs","Il personnalise sa maison et son avatar"],
  systems:["Maisons à réclamer et décorer","Véhicules","Métiers avec tenue et outils","Objets interactifs (portes, lits, cuisines)","Outils de roleplay : nom affiché, statut, téléphone"],
  zones:["Quartier résidentiel","Centre-ville (magasins, hôpital, école, police)","Lieu signature lié au thème","Routes pour les véhicules"],
  ui:["Menu Maisons","Menu Véhicules","Menu Métiers / tenues","Nom et biographie au-dessus de la tête"],
  save:["Décoration de maison","Véhicules et objets achetés","Tenue favorite"],
  money:["Game pass véhicules premium","Game pass maisons premium","Game pass objets spéciaux (animal de compagnie, téléphone avancé)"],
  sfx:["Portes","Moteurs","Sonnette","Ambiance de ville","Musique de radio"],
  first5:"Le joueur réclame une maison en un clic, prend un véhicule et voit d'autres joueurs déjà en train de jouer une histoire."},
 fashion:{core:["Un thème est annoncé","Les joueurs ont un temps limité pour s'habiller ou décorer","Ils défilent ou présentent leur création","Tout le monde vote","Classement et récompenses"],
  systems:["Garde-robe avec catégories","Annonce de thème aléatoire","Défilé avec caméra","Vote de 1 à 5 étoiles","Niveaux qui débloquent des vêtements"],
  zones:["Loge d'habillage","Podium","Salle d'attente"],
  ui:["Garde-robe","Chrono","Écran de vote","Classement de fin"],
  save:["Niveau","Vêtements débloqués","Tenues favorites"],
  money:["Game pass vêtements VIP","Produit vote bonus non (éviter) → préférer cosmétiques","Pass saisonnier de tenues"],
  sfx:["Musique de défilé","Flash photo","Applaudissements","Étoiles de vote"],
  first5:"Le thème s'affiche, le joueur s'habille avec des objets gratuits et défile dans les deux premières minutes."},
 build:{core:["Le joueur collecte ou achète des pièces","Il assemble un véhicule ou une structure","Il le lance dans un défi (distance, survie, course)","Il gagne de l'argent selon le résultat","Il achète de meilleures pièces"],
  systems:["Système de construction sur grille (placer, tourner, supprimer)","Pièces avec propriétés (moteur, roue, aile)","Physique du test","Sauvegarde des constructions","Défi avec score"],
  zones:["Atelier de construction personnel","Rampe ou zone de lancement","Parcours de test"],
  ui:["Inventaire de pièces","Outils de construction","Bouton Lancer","Résultat du test"],
  save:["Pièces possédées","Constructions sauvegardées","Meilleur score"],
  money:["Game pass pièces premium","Game pass emplacements de sauvegarde","Produit argent"],
  sfx:["Pose de pièce","Moteur","Crash","Résultat"],
  first5:"Le joueur pose trois pièces, lance sa première construction et voit le résultat en moins de deux minutes."},
 tycoon:{core:["Le joueur réclame un terrain","Des machines produisent de l'argent","Il achète des boutons pour construire son business étape par étape","Il débloque de nouveaux étages et zones","Rebirth pour un multiplicateur"],
  systems:["Terrains à réclamer","Boutons d'achat qui construisent la suite","Production automatique","Collecteur d'argent","Rebirth"],
  zones:["4 à 8 terrains autour d'une place centrale","Chaque terrain se construit en couches"],
  ui:["Argent","Bouton Collecter","Prix au-dessus de chaque bouton","Rebirth"],
  save:["Argent","Boutons achetés","Rebirths"],
  money:["Game pass x2 argent","Game pass auto-collecte","Produit argent instantané"],
  sfx:["Achat","Machine qui tourne","Caisse enregistreuse","Construction"],
  first5:"Le joueur réclame un terrain, achète son premier bouton en 10 secondes et voit la première machine apparaître."},
 td:{core:["Des vagues d'ennemis suivent un chemin","Le joueur place des unités qui attaquent automatiquement","Il gagne de l'argent par ennemi pour améliorer ses unités","Il survit à toutes les vagues ou au boss","Il gagne des invocations pour débloquer de nouvelles unités"],
  systems:["Chemin et générateur de vagues","Unités avec portée, dégâts, cadence, améliorations","Invocation d'unités avec probabilités affichées","Coop jusqu'à 4 joueurs","Modes de difficulté"],
  zones:["Lobby avec invocation et équipe","Cartes avec chemin lisible et emplacements"],
  ui:["Barre d'unités","Vague et vie de la base","Améliorer / vendre","Écran d'invocation"],
  save:["Unités possédées et niveaux","Monnaie","Cartes terminées"],
  money:["Produit invocations (probabilités affichées)","Game pass emplacement d'unité","Game pass vitesse x2"],
  sfx:["Pose d'unité","Tirs / attaques","Mort d'ennemi","Boss","Victoire"],
  first5:"Le joueur reçoit trois unités gratuites, lance la première carte et gagne la première vague en moins de deux minutes."},
 arena:{core:["Le joueur choisit un personnage ou un pouvoir","Il entre dans une arène avec les autres","Il combat avec des attaques simples et une attaque spéciale","Il gagne des points par élimination","Il débloque de nouveaux personnages"],
  systems:["Kit d'attaques par personnage (3 à 4 capacités)","Barres de vie et d'énergie","Physique ragdoll","Combos et esquive","Classement du serveur"],
  zones:["Arène principale avec obstacles","Zone d'entraînement","Lobby de sélection"],
  ui:["Boutons de capacité (grands sur mobile)","Vie et énergie","Fil des éliminations","Sélection de personnage"],
  save:["Personnages débloqués","Monnaie","Statistiques"],
  money:["Personnages premium (sans être plus forts)","Cosmétiques et effets","Game pass emote"],
  sfx:["Coups","Capacités spéciales","Ragdoll / chute","Élimination"],
  first5:"Le joueur choisit un personnage, apprend ses trois attaques dans une zone d'essai et entre dans l'arène en moins d'une minute."},
 shooter:{core:["Le joueur choisit son équipement","Il rejoint un match court (2 à 5 minutes)","Il élimine les adversaires et accomplit l'objectif","Il gagne de l'expérience et de la monnaie","Il débloque armes et cosmétiques"],
  systems:["Armes avec cadence, dégâts, recul (calcul côté serveur)","Modes de jeu (duel, équipe)","Matchmaking simple par serveur","Contrôles mobiles (visée assistée légère)","Cosmétiques d'armes"],
  zones:["Lobby","2 à 3 cartes symétriques et lisibles","Champ de tir pour s'entraîner"],
  ui:["Viseur","Munitions","Score","Boutons mobiles tir / visée / saut","Écran de fin"],
  save:["Armes débloquées","Cosmétiques","Niveau"],
  money:["Skins d'armes","Pass saisonnier cosmétique","Game pass emote"],
  sfx:["Tirs par arme","Rechargement","Impact","Élimination","Musique de fin"],
  first5:"Le joueur entre dans un duel ou une partie en moins de 30 secondes avec une arme de base équilibrée."},
 sport:{core:["Le joueur rejoint une équipe","Un match court commence","Il utilise des capacités ou des règles spéciales pour marquer","Fin de match, récompenses","Il améliore son joueur ou débloque des styles"],
  systems:["Ballon avec physique (contrôle côté serveur)","Équipes équilibrées automatiquement","Capacités spéciales","Bots si pas assez de joueurs","Classement"],
  zones:["Terrain avec tribunes","Zone d'entraînement","Lobby"],
  ui:["Score et chrono","Boutons de tir / passe / capacité","Écran de fin"],
  save:["Niveau","Capacités et styles","Statistiques"],
  money:["Styles et célébrations","Game pass capacité cosmétique","Pass saisonnier"],
  sfx:["Frappe de balle","Sifflet","Foule","But"],
  first5:"Le joueur rejoint un match en cours et marque ou fait une passe dans la première minute."},
 obby:{core:["Le joueur traverse des étapes d'obstacles","Chaque étape est un point de sauvegarde","La difficulté monte doucement","Il gagne des récompenses à des étapes clés","Il termine et recommence en mode plus dur"],
  systems:["Points de sauvegarde par étape","Obstacles variés (sauts, plateformes mobiles, laser)","Compteur d'étape","Mode difficile","Classement de vitesse"],
  zones:["Suite d'étapes thématiques","Zone de départ","Zone de fin avec récompense"],
  ui:["Étape actuelle","Bouton Passer l'étape","Chrono"],
  save:["Étape atteinte","Meilleur temps","Récompenses"],
  money:["Produit passer une étape","Game pass vitesse","Game pass gravité"],
  sfx:["Saut","Point de sauvegarde","Chute","Fin"],
  first5:"Le joueur passe trois étapes faciles en 30 secondes, puis la première vraie difficulté arrive."},
 fish:{core:["Le joueur lance sa ligne ou creuse","Un mini-jeu de timing pour attraper","Il obtient un poisson ou objet d'une rareté aléatoire","Il vend ou collectionne","Il achète une meilleure canne pour des zones plus rares"],
  systems:["Mini-jeu d'attrape","Table de raretés par zone","Cannes ou outils améliorables","Index de collection","Événements météo qui changent les prises"],
  zones:["Quai de départ","Zones de pêche de plus en plus rares","Marchand","Aquarium ou musée"],
  ui:["Mini-jeu d'attrape","Fiche de prise","Index","Boutique"],
  save:["Index","Outils","Monnaie","Inventaire"],
  money:["Game pass chance +","Produit appât rare","Game pass inventaire +"],
  sfx:["Lancer","Plouf","Moulinet","Prise rare","Ambiance d'eau"],
  first5:"Le joueur lance sa ligne dans les 10 premières secondes et attrape un premier poisson grâce au mini-jeu."}
};
const THEME_ART={
 animaux:{style:"cartoon arrondi, formes douces, grands yeux",palette:"vert prairie #6BCB77, bleu ciel #74C0FC, crème #FFF3D6, orange chaud #FFA94D",mood:"joyeux et chaleureux",props:["enclos","arbres ronds","bottes de foin","gamelles","panneaux en bois"],music:"happy farm, cheerful ukulele",amb:"birds, meadow"},
 oeufs:{style:"cartoon brillant, œufs très lisibles avec motifs par rareté",palette:"blanc nacré #F8F9FA, or #FFD43B, violet #9775FA, turquoise #3BC9DB",mood:"excitant et précieux",props:["nids","socles","incubateurs","coffres"],music:"playful, magical",amb:"sparkle, chimes"},
 horreur:{style:"réaliste stylisé, éclairage sombre, brouillard",palette:"noir bleuté #10131C, gris #495057, rouge sang #C92A2A, jaune lampe #FCC419",mood:"tendu, oppressant",props:["lampes torches","portes grinçantes","meubles abîmés","traces"],music:"dark ambient, horror tension",amb:"wind, creak, distant footsteps"},
 brainrot:{style:"mème, couleurs saturées, personnages absurdes",palette:"rose fluo #F06595, jaune #FFE066, cyan #22B8CF, vert acide #94D82D",mood:"absurde et drôle",props:["socles de présentation","néons","confettis"],music:"funny, phonk, upbeat",amb:"cartoon, crowd"},
 anime:{style:"anime cel-shading, effets d'énergie",palette:"bleu nuit #1C2541, blanc #F8F9FA, cyan #4DABF7, magenta #E64980",mood:"épique et dynamique",props:["temples","bannières","arbres de cerisier","rochers"],music:"epic, japanese, battle",amb:"wind, energy"},
 cute:{style:"kawaii, pastel, formes rondes",palette:"rose pastel #FFC9DE, lavande #D0BFFF, menthe #B2F2BB, crème #FFF9DB",mood:"doux et mignon",props:["nuages","bonbons","coussins","étoiles"],music:"cute, kawaii, bubbly",amb:"chimes, soft pop"},
 nourriture:{style:"cartoon appétissant, aliments surdimensionnés",palette:"jaune citron #FFE066, rouge tomate #FA5252, vert #51CF66, brun pain #D9A066",mood:"gourmand et coloré",props:["comptoirs","stands","fours","caisses de fruits"],music:"cheerful kitchen, jazzy",amb:"kitchen, sizzling"},
 vehicules:{style:"cartoon semi-réaliste, carrosseries brillantes",palette:"rouge #E03131, bleu #1971C2, gris asphalte #343A40, jaune #FCC419",mood:"rapide et énergique",props:["routes","garages","rampes","cônes"],music:"rock, driving, energetic",amb:"engine, traffic"},
 sport:{style:"cartoon sportif, terrain très lisible",palette:"vert pelouse #37B24D, blanc #FFFFFF, bleu équipe #1C7ED6, rouge équipe #F03E3E",mood:"compétitif et festif",props:["buts","tribunes","drapeaux","projecteurs"],music:"sport, stadium, energetic",amb:"crowd, whistle"},
 armee:{style:"low-poly militaire, silhouettes nettes",palette:"kaki #5C6B3C, sable #D9C8A0, gris acier #495057, orange signal #FD7E14",mood:"tactique et intense",props:["sacs de sable","caisses","tours de guet","véhicules"],music:"military, epic drums",amb:"wind, distant explosions"},
 noel:{style:"cartoon hivernal, neige douce, lumières chaudes",palette:"blanc neige #F8F9FA, rouge #E03131, vert sapin #2B8A3E, or #FAB005",mood:"festif et chaleureux",props:["sapins","cadeaux","guirlandes","bonhommes de neige"],music:"christmas, jingle, sleigh bells",amb:"snow, fireplace"},
 prison:{style:"cartoon urbain, contrastes forts",palette:"orange combinaison #FD7E14, gris béton #868E96, bleu police #1864AB, jaune #FCC419",mood:"tendu mais drôle",props:["cellules","grillages","voitures de police","projecteurs"],music:"heist, tension, funk",amb:"alarm, radio"},
 espace:{style:"sci-fi cartoon, lumières émissives",palette:"bleu nuit #0B1026, violet #7048E8, cyan #3BC9DB, blanc #F8F9FA",mood:"mystérieux et aventureux",props:["fusées","modules","cratères","planètes en fond"],music:"space, synth, ambient",amb:"hum, beeps"}
};

/* ---------- Idée : construction commune ---------- */
function buildIdea({loopK,genre,thK,twist,title,noun,text}){
  const loop=A.loops.find(l=>l.k===loopK)||A.loops[0];
  const gs=Object.fromEntries(A.big.map(s=>[s.k,s]));
  if(!genre||!gs[genre]){const c={};G.filter(g=>g.loops.includes(loop.k)&&gs[g.g]).forEach(g=>c[g.g]=(c[g.g]||0)+g.p);genre=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]||loop.genre}
  const th=A.themes.find(t=>t.k===thK)||A.themes[0];const T=THEMES[th.k];
  noun=noun||T.nouns[0];twist=twist||TWISTS[0];title=fixA(title||LOOPS[loop.k].titles[0].replace("{N}",noun));
  const maxN=Math.max(...A.loops.map(l=>l.n)),gsx=gs[genre];
  const sGenre=gsx?Math.round(gsx.pot/100*30):12;
  const sLoop=Math.round(Math.min(1,loop.newN/Math.max(...A.loops.map(l=>l.newN)))*25);
  const sTheme=Math.round(Math.min(1,th.lift/2)*20);
  const sSeason=(th.k=="noel"&&nextSeason().name=="Noël")?10:/saison/.test(twist)?5:0;
  const sat=Math.round(loop.n/maxN*20);
  const score=Math.max(5,Math.min(99,sGenre+sLoop+sTheme+sSeason+15-sat));
  const sameTheme=G.filter(g=>g.loops.includes(loop.k)&&g.themes.includes(th.k));
  return {loop,genre,gsx,th,T,noun,twist,title,score,parts:{sGenre,sLoop,sTheme,sSeason,sat},sameTheme,text:text||""};
}
const ideaKey=I=>({loopK:I.loop.k,genre:I.genre,thK:I.th.k,twist:I.twist,title:I.title,noun:I.noun,text:I.text||""});

/* ---------- Originalité : l'idée existe-t-elle déjà ? ---------- */
const TSTOP=new Set("a an the of in on to and or my your for with vs x de la le les des du un une et".split(" "));
const ttoks=n=>new Set(clean(n).toLowerCase().replace(/[^a-z0-9+À-ɏ\s]/g," ").split(/\s+/).filter(w=>w&&!TSTOP.has(w)).map(w=>w.replace(/s$/,"")));
let TIDX=null;
function titleIndex(){if(TIDX&&TIDX.f===D.fetched)return TIDX.list;
  const list=G.map(g=>({n:g.tn,url:gameUrl(g),p:g.p,rank:g.rank,t:ttoks(g.n),loops:g.loops,themes:g.themes}));
  (D.more||[]).forEach(([n,pl,p])=>list.push({n:clean(n),url:`https://www.roblox.com/games/${pl}`,p,rank:null,t:ttoks(n)}));
  TIDX={f:D.fetched,list};return list}
function originality(I){
  const list=titleIndex(),it=ttoks(I.title),nounT=ttoks(I.noun||""),norm2=x=>[...x].sort().join(" ");
  const key=norm2(it);const out=[];let copy=false;
  for(const g of list){
    let inter=0;it.forEach(w=>{if(g.t.has(w))inter++});
    const uni=it.size+g.t.size-inter,jac=uni?inter/uni:0;
    const exact=key&&norm2(g.t)===key;
    const nounHit=[...nounT].some(w=>g.t.has(w));
    const loopHit=LOOPS[I.loop.k].re.test(g.n);
    const concept=nounHit&&loopHit;
    const sameCombo=g.loops&&g.loops.includes(I.loop.k)&&g.themes&&g.themes.includes(I.th.k)&&nounHit;
    let why="";
    if(exact){why="même titre";copy=true}
    else if(jac>=.67){why="titre presque identique";if(g.p>=1000)copy=true}
    else if(concept){why="même action et même sujet dans le titre";if(g.p>=3000)copy=true}
    else if(sameCombo){why="même recette et même thème"}
    else if(jac>=.4&&inter>=2){why="titre très proche"}
    if(why)out.push({...g,why,score:(exact?10:0)+jac*4+(concept?3:0)+(sameCombo?1:0)});
  }
  out.sort((a,b)=>b.score-a.score||b.p-a.p);
  const level=copy?"copy":out.length?"close":"original";
  return {level,matches:out.slice(0,5),checked:list.length};
}
const searchUrl=t=>`https://www.roblox.com/discover/?Keyword=${encodeURIComponent(t)}`;
function origHTML(I){const o=I.orig||(I.orig=originality(I));
  const m=o.matches.map(g=>`<a class="chip" href="${g.url}">${esc(g.n)}${g.rank?` · #${g.rank}`:""} · ${fmtK(g.p)}</a> <span class="src">(${esc(g.why)})</span>`).join("<br>");
  if(o.level=="original")return `<div class="orig ok"><b>✓ Originale</b><span class="src">Aucun des ${fr(o.checked)} jeux relevés n'a ce titre ou ce concept. <a href="${searchUrl(I.title)}">Vérifier aussi dans la recherche Roblox</a> pour les petits jeux qui ne sont dans aucun classement.</span></div>`;
  if(o.level=="close")return `<div class="orig warn"><b>Ressemble à des jeux existants</b><span class="src">Je pense que ces jeux sont proches de cette idée. Regarde-les pour être sûr que la tienne est différente :</span><div style="line-height:2">${m}</div><span class="src"><a href="${searchUrl(I.title)}">Chercher « ${esc(I.title)} » sur Roblox</a></span></div>`;
  return `<div class="orig bad"><b>Copie probable</b><span class="src">Ce titre ou ce concept existe déjà :</span><div style="line-height:2">${m}</div><span class="src">Change le nom et ajoute un vrai twist.</span></div>`;
}
/* ---------- Fiche Info ---------- */
function infoHTML(I){
  const L=LOOPS[I.loop.k],LD=LOOP_DESIGN[I.loop.k],ART=THEME_ART[I.th.k];
  const sims=similarGames(I.title+" "+(I.text||"")+" "+L.name,I).slice(0,6);
  const best=I.loop.ex[0];
  return `<div class="grid" style="gap:12px;border-top:1px solid var(--line);padding-top:12px">
   <div class="grid g2" style="gap:12px">
    <div><b>La boucle de jeu</b><ol class="list">${LD.core.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>
    <div><b>Les 5 premières minutes</b><p style="margin:4px 0 8px">${esc(LD.first5)}</p>
     <b>Direction artistique</b><p class="src" style="margin:4px 0">${esc(ART.style)} · ambiance ${esc(ART.mood)}<br>Palette : ${esc(ART.palette)}</p></div>
   </div>
   <div class="grid g3" style="gap:12px">
    <div><b>Systèmes à coder</b><ul class="list">${LD.systems.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div><b>Carte</b><ul class="list">${LD.zones.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div><b>Monétisation</b><ul class="list">${LD.money.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
   </div>
   <div><b>Jeux du top 1000 les plus proches</b>
    <div class="tablebox" style="margin-top:6px"><table><thead><tr><th>Jeu</th><th class="n">#</th><th class="n">Joueurs</th><th class="n">Âge</th><th class="n">Note</th></tr></thead><tbody>
    ${sims.map(g=>`<tr><td><a href="${gameUrl(g)}">${esc(g.tn)}</a></td><td class="n">${g.rank}</td><td class="n">${fr(g.p)}</td><td class="n">${ageTxt(g.age)}</td><td class="n">${g.r!=null?Math.round(g.r)+" %":"—"}</td></tr>`).join("")||`<tr><td colspan="5" class="src">Aucun jeu proche : c'est une niche.</td></tr>`}
    </tbody></table></div></div>
   <div class="grid g2" style="gap:12px">
    <div><b>Les chiffres de la recette</b><p class="src" style="margin:4px 0">${I.loop.n} jeux · ${fr(I.loop.p)} joueurs · jeu médian ${fr(I.loop.med)} joueurs · ${I.loop.newN} jeux récents · ${I.loop.trN} mis en avant par Roblox. Le plus gros : ${best?`<a href="${gameUrl(best)}">${esc(best.tn)}</a> (${fmtK(best.p)})`:"—"}.</p></div>
    <div><b>Taille du projet</b><p class="src" style="margin:4px 0">${projectSize(I.loop.k)}</p></div>
   </div>
  </div>`;
}
function projectSize(k){const s={steal:"Moyen : 3 à 5 semaines seul pour une première version jouable.",stat:"Petit : 1 à 2 semaines pour une première version.",collect:"Moyen : 3 à 5 semaines (l'économie et les échanges prennent du temps).",throwfeed:"Petit à moyen : 2 à 3 semaines.",rounds:"Moyen : 3 à 4 semaines (gestion des manches et des rôles).",survive:"Moyen à gros : 4 à 6 semaines (IA du monstre et ambiance).",rp:"Gros : beaucoup de contenu (maisons, véhicules, métiers).",fashion:"Moyen : surtout du contenu (vêtements).",build:"Moyen à gros : système de construction et physique.",tycoon:"Petit à moyen : 2 à 3 semaines.",td:"Moyen à gros : unités, vagues et équilibrage.",arena:"Moyen : combat qui doit être bon au toucher.",shooter:"Gros : armes, réseau et anti-triche.",sport:"Moyen : physique du ballon et équipes.",obby:"Petit : 1 à 2 semaines.",fish:"Moyen : 2 à 4 semaines."};return s[k]||""}
const ageTxt2=a=>a>=9999?"—":a<60?a+" j":a<730?Math.round(a/30)+" mois":Math.round(a/365)+" ans";
if(typeof ageTxt==="undefined")window.ageTxt=ageTxt2;

/* ---------- Jeux similaires ---------- */
let IDF=null;
function buildIdf(){IDF={};G.forEach(g=>{new Set(toks(g.n+" "+g.d,true).concat(toks(g.n,false))).forEach(w=>IDF[w]=(IDF[w]||0)+1)});for(const w in IDF)IDF[w]=Math.log(1000/IDF[w])}
function similarGames(text,I){
  if(!IDF)buildIdf();
  const q=new Set(toks(text,false).concat(toks(text,true)));
  const out=G.map(g=>{const t=new Set(toks(g.n,false)),d=new Set(toks(g.d,true));let s=0;q.forEach(w=>{if(t.has(w))s+=2*(IDF[w]||1);else if(d.has(w))s+=(IDF[w]||1)});
    if(I){if(g.loops.includes(I.loop.k))s+=2;if(g.themes.includes(I.th.k))s+=2}return {g,s}}).filter(x=>x.s>0);
  return out.sort((a,b)=>b.s-a.s||b.g.p-a.g.p).map(x=>x.g);
}

const FR_EN={chat:"Cat",chats:"Cat",chien:"Dog",chiens:"Dog",lapin:"Bunny",oeuf:"Egg",oeufs:"Egg",poisson:"Fish",poissons:"Fish",voiture:"Car",voitures:"Car",maison:"House",ville:"City",monstre:"Monster",monstres:"Monster",fantome:"Ghost",citron:"Lemon",gateau:"Cake",bonbon:"Candy",bonbons:"Candy",robot:"Robot",robots:"Robot",ninja:"Ninja",epee:"Sword",cheval:"Horse",licorne:"Unicorn",requin:"Shark",singe:"Monkey",ours:"Bear",loup:"Wolf",renard:"Fox",tigre:"Tiger",lion:"Lion",pingouin:"Penguin",pizza:"Pizza",burger:"Burger",fusee:"Rocket",planete:"Planet",zombie:"Zombie",zombies:"Zombie",sorciere:"Witch",magicien:"Wizard",pirate:"Pirate",pirates:"Pirate",tresor:"Treasure",ile:"Island",prison:"Prison",ecole:"School",hopital:"Hospital",dragon:"Dragon",dragons:"Dragon",dino:"Dino",dinosaure:"Dino",slime:"Slime",banane:"Banana",pomme:"Apple",neige:"Snow",sapin:"Tree",abeille:"Bee",abeilles:"Bee",fourmi:"Ant",araignee:"Spider",serpent:"Snake",vache:"Cow",cochon:"Pig",poule:"Chicken",canard:"Duck",capybara:"Capybara",axolotl:"Axolotl",chevalier:"Knight",chateau:"Castle",avion:"Plane",bateau:"Boat",train:"Train",tank:"Tank",soldat:"Soldier",policier:"Cop",voleur:"Thief",cuisinier:"Chef",restaurant:"Restaurant",magasin:"Shop",diamant:"Diamond",or:"Gold",cristal:"Crystal",potion:"Potion",cadeau:"Gift",pere:"",noel:"Santa"};
const unacc=w=>w.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/œ/g,"oe");
function nounFrom(raw){if(!IDF)buildIdf();const c={};const words=norm(raw).match(/[a-zà-ÿ0-9]+/g)||[];
  words.forEach((w,i)=>{const u=unacc(w);let n=null;if(FR_EN[u])n=FR_EN[u];else if(u.length>=4&&IDF[u]!==undefined&&IDF[u]>1.5&&!/^(avec|dans|pour|plus|tous|tout|leur|elle|sont|fait|faire|game|games|jeux|play|joueur|joueurs|peut|peuvent|super|mega|ultra|best|simulator|tycoon|obby|roblox|world|life|real|realistic|ultimate|epic|legends?|evolution|battle|battles|arena|escape|survive|steal|grow|build|feed|throw|catch|duels?|tower|race)$/.test(u))n=u[0].toUpperCase()+u.slice(1);
    if(n){c[n]=c[n]||{n:0,i};c[n].n++}});
  const best=Object.entries(c).sort((a,b)=>b[1].n-a[1].n||a[1].i-b[1].i)[0];return best?best[0]:null}
/* ---------- Noter MON idée (fiche détaillée) ---------- */
const SOCIAL=[["coop","Coopération"],["pvp","Combat / compétition"],["trade","Échanges"],["steal","Vol entre joueurs"],["rank","Classement"],["rp","Roleplay"]];
const MONEY=[["gp","Game passes"],["dp","Achats répétables"],["cos","Cosmétiques"],["season","Pass de saison"],["rng","Objets aléatoires payants"],["none","Rien pour l'instant"]];
const PLAT=[["mobile","Téléphone"],["pc","Ordinateur"],["console","Console"],["vr","VR"]];
const FIELDS=["fName","fUniverse","fGenre","fLoop","fTheme","fCore","fGoal","fProg","fUnique","fTeam"];
const ticks=(id,list,name)=>{document.getElementById(id).innerHTML=list.map(([v,l])=>`<label class="tick"><input type="checkbox" name="${name}" value="${v}"> ${esc(l)}</label>`).join("")};
const checked=name=>[...document.querySelectorAll(`input[name="${name}"]:checked`)].map(x=>x.value);
let FORM_READY=false;
function setupForm(){
  if(FORM_READY)return;FORM_READY=true;
  ticks("fSocial",SOCIAL,"soc");ticks("fMoney",MONEY,"mon");ticks("fPlat",PLAT,"plat");
  $("#fGenre").innerHTML+=[...A.big].sort((a,b)=>b.n-a.n).map(s=>`<option value="${esc(s.k)}">${esc(gname(s.k))}</option>`).join("");
  $("#fLoop").innerHTML+=Object.entries(LOOPS).map(([k,l])=>`<option value="${k}">${esc(l.name)}</option>`).join("");
  $("#fTheme").innerHTML+=Object.entries(THEMES).map(([k,t])=>`<option value="${k}">${esc(t.label)}</option>`).join("")+`<option value="autre">Autre (mon univers)</option>`;
  const d=store.get("labo-form");
  if(d){FIELDS.forEach(f=>{if(d[f]!=null)document.getElementById(f).value=d[f]});[["soc",d.soc],["mon",d.mon],["plat",d.plat]].forEach(([n,v])=>(v||[]).forEach(x=>{const el=document.querySelector(`input[name="${n}"][value="${x}"]`);if(el)el.checked=true}))}
  else document.querySelector('input[name="plat"][value="mobile"]').checked=true;
  const f=$("#myForm");
  f.addEventListener("input",saveForm);f.addEventListener("change",saveForm);
  f.addEventListener("submit",e=>{e.preventDefault();rateForm()});
  $("#fExample").onclick=()=>{const ex={fName:"Feed the Dragon",fUniverse:"dragons, île volcanique",fGenre:"",fLoop:"throwfeed",fTheme:"",fCore:"Le joueur lance de la nourriture à son bébé dragon. Le dragon grandit à chaque palier et pond des œufs qui rapportent de l'or chaque seconde. Avec l'or, il achète de meilleure nourriture et agrandit son nid.",fGoal:"Faire évoluer son dragon au stade suivant avant la tombée de la nuit (8 minutes).",fProg:"10 stades d'évolution, 30 dragons à collectionner avec des mutations rares, récompense quotidienne, rebirth avec multiplicateur.",fUnique:"La nuit, les autres joueurs peuvent entrer dans ton nid pour voler tes œufs : il faut défendre son nid avec son dragon.",fTeam:"small"};
    FIELDS.forEach(k=>document.getElementById(k).value=ex[k]);document.querySelectorAll('#myForm input[type=checkbox]').forEach(x=>x.checked=["trade","steal","rank","gp","dp","cos","mobile","pc"].includes(x.value));saveForm();rateForm()};
  $("#fClear").onclick=()=>{FIELDS.forEach(k=>{const el=document.getElementById(k);el.value=el.tagName=="SELECT"?el.options[0].value:""});document.querySelectorAll('#myForm input[type=checkbox]').forEach(x=>x.checked=x.value=="mobile");saveForm();$("#myOut").innerHTML=""};
  if(d&&d.fCore)rateForm();
}
function saveForm(){const d={};FIELDS.forEach(f=>d[f]=document.getElementById(f).value);d.soc=checked("soc");d.mon=checked("mon");d.plat=checked("plat");store.set("labo-form",d)}
const words=t=>(t.trim().match(/\S+/g)||[]).length;
const hasAny=(t,re)=>re.test(norm(t));
function bandLen(t,a,b){const w=words(t);return w>=b?1:w>=a?.6:w>0?.3:0}

function rateForm(){
  const v=id=>document.getElementById(id).value.trim();
  const name=v("fName"),uni=v("fUniverse"),core=v("fCore"),goal=v("fGoal"),prog=v("fProg"),uniq=v("fUnique"),team=v("fTeam");
  const soc=checked("soc"),mon=checked("mon"),plat=checked("plat");
  const out=$("#myOut");
  if(!name&&!core){out.innerHTML=`<div class="note">Donne au moins un nom et décris ce que fait le joueur pour avoir une note.</div>`;return}
  const all=norm([name,uni,core,goal,prog,uniq].join(" . "));
  // recette et thème : choix de l'utilisateur, sinon détection
  const pos=(re,t)=>{const m=re&&re.exec(t);return m?m.index:1e9};
  let loopK=v("fLoop");const loopAuto=!loopK;
  const coreN=norm(core+" "+name);
  const loopHits=Object.keys(LOOPS).filter(k=>LOOPS[k].re.test(all)||FR_LOOP[k]?.test(all)).sort((a,b)=>Math.min(pos(LOOPS[a].re,coreN),pos(FR_LOOP[a],coreN))-Math.min(pos(LOOPS[b].re,coreN),pos(FR_LOOP[b],coreN)));
  if(!loopK)loopK=loopHits[0]||"collect";
  let thK=v("fTheme");const themeAuto=!thK||thK=="autre";
  const themeHits=Object.keys(THEMES).filter(k=>THEMES[k].re.test(all)||FR_THEME[k]?.test(all));
  if(themeAuto)thK=themeHits[0]||[...A.themes].sort((a,b)=>b.lift-a.lift)[0].k;
  const noun=nounFrom(name+" "+uni+" "+core)||THEMES[thK].nouns[0];
  const text=[core&&`Ce que fait le joueur : ${core}`,goal&&`Objectif d'une partie : ${goal}`,prog&&`Progression : ${prog}`,uniq&&`Ce qui le rend différent : ${uniq}`,uni&&`Univers : ${uni}`,soc.length&&`Avec les autres joueurs : ${soc.map(x=>SOCIAL.find(s=>s[0]==x)[1].toLowerCase()).join(", ")}`,mon.length&&`Monétisation prévue : ${mon.map(x=>MONEY.find(s=>s[0]==x)[1].toLowerCase()).join(", ")}`,plat.length&&`Plateformes : ${plat.map(x=>PLAT.find(s=>s[0]==x)[1].toLowerCase()).join(", ")}`].filter(Boolean).join("\n");
  const I=buildIdea({loopK,genre:v("fGenre")||null,thK,twist:"les éléments décrits par le créateur",title:name||LOOPS[loopK].titles[0].replace("{N}",noun),noun,text});
  const sims=similarGames([name,uni,core,uniq].join(" "),I);
  const maxN=Math.max(...A.loops.map(l=>l.n)),maxNew=Math.max(...A.loops.map(l=>l.newN));
  const C=[];const add=(group,label,max,score,why,tip)=>C.push({group,label,max,score:Math.max(0,Math.min(max,Math.round(score))),why,tip});
  // ---- MARCHÉ (40)
  const gsx=I.gsx;
  add("Marché","Place dans le genre",12,gsx?gsx.pot/100*12:5,gsx?`En ${gname(I.genre)}, le jeu médian du top a ${fr(gsx.med)} joueurs et ${pct(gsx.newShare)} des jeux ont moins de 90 jours (${gsx.n} jeux dans le top 1000).`:"Genre peu présent dans le top 1000.",gsx&&gsx.pot<40?`Ce genre est difficile en ce moment. Les genres les plus ouverts : ${[...A.big].sort((a,b)=>b.pot-a.pot).slice(0,3).map(s=>gname(s.k)).join(", ")}.`:"");
  const noLoop=loopAuto&&!loopHits.length,noTheme=themeAuto&&!themeHits.length&&!uni;
  add("Marché","Recette qui perce",12,noLoop?0:I.loop.newN/maxNew*12,noLoop?"Aucune recette reconnue dans ta fiche : choisis-en une dans la liste ou décris mieux ce que fait le joueur.":`« ${LOOPS[loopK].name} » : ${I.loop.n} jeux dans le top, dont ${I.loop.newN} créés il y a moins de 90 jours.${loopAuto?" (recette détectée dans ton texte)":""}`,noLoop?"Choisis la recette principale dans la liste en haut de la fiche.":I.loop.newN/maxNew<.4?"Peu de jeux récents percent avec cette recette : ajoute une deuxième mécanique plus en vogue en bonus.":"");
  add("Marché","Thème qui monte",8,noTheme?0:Math.min(1,I.th.lift/2)*8,noTheme?"Aucun thème ni univers donné.":`« ${THEMES[thK].label} » est ${I.th.lift>=1.3?`${I.th.lift.toFixed(1).replace(".",",")} fois plus présent chez les jeux récents ou en tendance`:I.th.lift>=.8?"stable":"plutôt en baisse"}.${themeAuto?" (thème détecté)":""}`,I.th.lift<1?`Les thèmes qui montent : ${[...A.themes].sort((a,b)=>b.lift-a.lift).slice(0,3).map(x=>THEMES[x.k].label.toLowerCase()).join(", ")}.`:"");
  const bigClone=sims.slice(0,5).filter(g=>g.p>30000);
  add("Marché","Concurrence directe",8,noLoop?2:8-I.loop.n/maxN*5-Math.min(3,bigClone.length),`${I.sameTheme.length} jeu${I.sameTheme.length>1?"x":""} du top combine${I.sameTheme.length>1?"nt":""} déjà cette recette et ce thème.${bigClone.length?` Proches et déjà gros : ${bigClone.slice(0,2).map(g=>`${g.tn} (${fmtK(g.p)})`).join(", ")}.`:""}`,bigClone.length?"Écris clairement ce que ton jeu fait que ces jeux-là ne font pas, et mets-le dans ton titre ou ton icône.":"");
  // ---- CONCEPTION (60)
  const verbs=/lanc|nourri|vol|collect|constru|combat|tir|surviv|cours|saut|p[êe]ch|achet|vend|am[ée]lior|ouvr|fuir|cach|d[ée]fend|explor|throw|feed|steal|build|fight|shoot|run|jump|catch|buy|sell|upgrade|hatch|grow/;
  add("Conception","Boucle de jeu claire",10,bandLen(core,15,35)*8+(hasAny(core,verbs)?2:0),core?`${words(core)} mots. ${hasAny(core,verbs)?"Les actions du joueur sont claires.":"On ne voit pas bien l'action que le joueur répète."}`:"Pas encore décrite.",words(core)<35?"Décris la boucle en 3 temps : le joueur fait X → il obtient Y → il dépense Y pour faire X mieux.":"");
  add("Conception","Objectif d'une partie",7,bandLen(goal,6,15)*5+(hasAny(goal,/\d|avant|survi|gagn|finir|atteindre|battre|record|manche|win|reach|before/)?2:0),goal?`${words(goal)} mots.`:"Pas d'objectif court décrit.",!goal||words(goal)<6?"Donne un but visible pour une session de 5 à 15 minutes (atteindre un palier, survivre jusqu'au matin, finir la manche).":"");
  const progKw=(norm(prog).match(/niveau|am[ée]lior|d[ée]bloqu|rare|collection|collectionn|[ée]volu|rebirth|quotidien|journali|saison|stade|monde|zone|upgrade|unlock|level|daily/g)||[]).length;
  add("Conception","Progression (revenir demain)",10,bandLen(prog,6,18)*6+Math.min(4,progKw*1.5),prog?`${progKw} mécanique(s) de progression repérée(s).`:"Rien qui fait revenir le joueur.",progKw<2?"Ajoute au moins deux raisons de revenir : paliers ou niveaux, collection à compléter, récompense quotidienne, événements.":"");
  add("Conception","Jouer avec les autres",10,[0,5,8,10][Math.min(3,soc.length)],soc.length?`${soc.length} façon(s) de jouer ensemble.`:"Aucune interaction entre joueurs cochée.",soc.length<2?"Les gros jeux Roblox sont sociaux : ajoute des échanges, du vol, de la coop ou un classement visible.":"");
  const uniqWords=words(uniq),overlap=bigClone.length;
  add("Conception","Ce qui te rend différent",10,(uniqWords>=18?7:uniqWords>=8?5:uniqWords>0?2:0)+(I.sameTheme.length<=3?3:I.sameTheme.length<=10?1.5:0)-(overlap>=2?2:0),uniq?`${I.sameTheme.length<=3?"Combinaison rare dans le top 1000.":`${I.sameTheme.length} jeux du top combinent déjà cette recette et ce thème.`}`:"Rien d'écrit : c'est le point le plus important.",uniqWords<8?"Écris en une ou deux phrases la chose que ton jeu est le seul à faire. C'est ce qui donnera envie de cliquer.":"");
  const monOk=mon.length&&!mon.includes("none");
  add("Conception","Monétisation et téléphone",6,(monOk?3:mon.includes("none")?1:0)+(plat.includes("mobile")?3:0)-(mon.includes("rng")?0:0),`${monOk?mon.length+" source(s) de revenus":"Pas de monétisation prévue"} · ${plat.includes("mobile")?"pensé pour téléphone":"téléphone non coché"}.`,[!plat.includes("mobile")?"La majorité des joueurs sont sur téléphone : coche-le et prévois de gros boutons.":"",!monOk?`Idées pour cette recette : ${LOOP_DESIGN[loopK].money.slice(0,3).join(" ; ")}.`:"",mon.includes("rng")?"Objets aléatoires payants : Roblox impose d'afficher les probabilités.":""].filter(Boolean).join(" "));
  // nom
  let nScore=0;const nameTips=[];const nw=words(name);
  const exact=name&&G.find(g=>norm(g.tn)===norm(name));
  if(name){nScore+=2;if(!exact)nScore+=1;else nameTips.push(`« ${exact.tn} » existe déjà (#${exact.rank} du top) : change de nom.`);
    const first3=name.split(/\s+/).slice(0,3).join(" ");const kw=Object.values(LOOPS).some(l=>l.re.test(first3))||Object.values(THEMES).some(t=>t.re.test(first3));
    if(kw)nScore+=2;else nameTips.push("Mets un mot que les joueurs cherchent (Steal, Grow, Escape, Dragon, Pet…) dans les 3 premiers mots.");
    if(nw<=5)nScore+=1;else nameTips.push("Raccourcis : 2 à 5 mots, c'est ce qui marche dans le top.");
    if(!/[àâçéèêëîïôûùœ]/i.test(name)&&!/\b(le|la|les|des|du|un|une|et)\b/i.test(name))nScore+=1;else nameTips.push("La plupart des joueurs cherchent en anglais : un titre en anglais touchera plus de monde.");}
  else nameTips.push("Donne un nom à ton jeu.");
  add("Conception","Nom du jeu",7,nScore,name?`« ${name} »`:"Pas de nom.",nameTips.join(" "));
  I.orig=originality(I);
  if(I.orig.level=="copy"&&name){const c=C.find(c=>c.label=="Nom du jeu");c.score=Math.min(c.score,1);c.tip=(c.tip?c.tip+" ":"")+`Le nom ou le concept existe déjà (${I.orig.matches[0].n}) : change-le.`}
  const total=C.reduce((s,c)=>s+c.score,0);I.score=total;
  const verdict=total>=75?["Excellente base","good"]:total>=60?["Idée solide","good"]:total>=45?["À retravailler","warn"]:["Encore fragile","bad"];
  const prios=[...C].filter(c=>c.tip).sort((a,b)=>a.score/a.max-b.score/b.max).slice(0,3);
  const big=["rp","shooter","survive","td","build"].includes(loopK);
  const titles=[...new Set(LOOPS[loopK].titles.map(x=>fixA(x.replace("{N}",noun))))];
  MY=I;
  const crit=c=>`<div class="crit"><div><b>${esc(c.label)}</b></div><div class="why"><div class="meter" style="margin:6px 0"><i style="width:${c.score/c.max*100}%;background:${c.score/c.max>=.7?"var(--good)":c.score/c.max>=.4?"var(--warn)":"var(--bad)"}"></i></div><div class="src">${esc(c.why)}</div>${c.tip?`<div class="src" style="color:var(--ink);margin-top:3px">→ ${esc(c.tip)}</div>`:""}</div><div class="n" style="font:600 15px var(--mono);text-align:right">${c.score}/${c.max}</div></div>`;
  out.innerHTML=`<article class="idea">
   <div class="top">
    <div class="grid" style="gap:6px"><span class="stamp">Ta fiche · ${esc(gname(I.genre))} · ${esc(LOOPS[loopK].name)} · ${esc(themeAuto&&uni?uni:THEMES[thK].label)}</span><div class="title">${esc(name||"Sans nom")}</div><div><span class="chip ${verdict[1]}">${verdict[0]}</span></div></div>
    ${ring(total)}
   </div>
   ${prios.length?`<div class="card" style="gap:6px;border-left:3px solid var(--warn)"><b>Tes 3 priorités pour gagner des points</b><ol class="list">${prios.map(c=>`<li><b>${esc(c.label)}</b> (${c.score}/${c.max}) : ${esc(c.tip)}</li>`).join("")}</ol></div>`:""}
   ${big&&team=="solo"?`<div class="note">Attention : « ${esc(LOOPS[loopK].name)} » est un gros projet (${esc(projectSize(loopK))}). Seul, commence par une version très réduite, ou utilise le plan multi-agents.</div>`:""}
   <div><b>Marché</b> <span class="src">· ${C.filter(c=>c.group=="Marché").reduce((s,c)=>s+c.score,0)}/40, calculé sur le top 1000 du moment</span>${C.filter(c=>c.group=="Marché").map(crit).join("")}</div>
   <div><b>Conception</b> <span class="src">· ${C.filter(c=>c.group=="Conception").reduce((s,c)=>s+c.score,0)}/60, calculé sur ta fiche</span>${C.filter(c=>c.group=="Conception").map(crit).join("")}</div>
   ${origHTML(I)}
   <div><b>Jeux du top 1000 les plus proches</b><div class="kv" style="margin-top:6px">${sims.slice(0,8).map(g=>`<a class="chip" href="${gameUrl(g)}">#${g.rank} ${esc(g.tn)} · ${fmtK(g.p)}</a>`).join("")||"<span class='src'>Aucun : c'est une niche.</span>"}</div></div>
   ${!name||nameTips.length?`<div><b>Idées de nom</b><div class="kv" style="margin-top:6px">${titles.map(x=>`<button type="button" class="chip" data-usename="${esc(x)}" style="border:0;cursor:pointer">${esc(x)}</button>`).join("")}</div><div class="src" style="margin-top:4px">Appuie sur un nom pour l'utiliser.</div></div>`:""}
   <div class="controls"><button data-myinfo>Info</button><button class="primary" data-mychoose>Choisir cette idée</button></div>
   <div id="myInfo"></div>
  </article>`;
  out.querySelectorAll("[data-usename]").forEach(b=>b.onclick=()=>{$("#fName").value=b.dataset.usename;saveForm();rateForm()});
  out.querySelector("[data-myinfo]").onclick=e=>{const box=$("#myInfo");if(box.innerHTML){box.innerHTML="";e.target.textContent="Info"}else{box.innerHTML=infoHTML(I);e.target.textContent="Masquer"}};
  out.querySelector("[data-mychoose]").onclick=()=>chooseIdea(I);
  out.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}
let MY=null;

/* ---------- Choisir → plan de production ---------- */
function chooseIdea(I){store.set("labo-chosen",{...ideaKey(I),score:I.text?I.score:undefined,at:Date.now()});location.hash="plan"}
function currentChosen(){const k=store.get("labo-chosen");if(!k||!G.length)return null;try{const I=buildIdea(k);if(k.score!=null)I.score=k.score;return I}catch{return null}}

function brief(I){
  const L=LOOPS[I.loop.k],LD=LOOP_DESIGN[I.loop.k],ART=THEME_ART[I.th.k];
  const refs=I.loop.ex.map(g=>`${g.tn} (${fr(g.p)} joueurs)`).join(", ");
  return `BRIEF DU JEU « ${I.title} » (plateforme : Roblox, moteur : Roblox Studio, langage : Luau)

Pitch : ${pitchOf(I)}${I.text?`\n(Idée décrite par le créateur : respecte-la en priorité. La recette « ${L.name} » et le thème « ${I.T.label} » ont été reconnus dans son texte pour guider les choix.)`:""}
Genre Roblox : ${gname(I.genre)}. Recette principale : ${L.name}.
Jeux de référence du top 1000 actuel : ${refs}.
Public : joueurs Roblox de 9 à 16 ans, majoritairement sur téléphone. Sessions de 10 à 20 minutes.

Boucle de jeu :
${LD.core.map((x,i)=>`${i+1}. ${x}`).join("\n")}

Les 5 premières minutes : ${LD.first5}

Structure de l'expérience : ${(()=>{const st=structOf(I.loop.k);return st.places.map(([n,r],i)=>`place « ${n} » (max ${st.max[i]??st.max[0]} joueurs) : ${r}`).join(" ; ")+". "+st.why})()} Les IDs des places et des game passes sont fournis par le créateur.
Systèmes : ${LD.systems.join(" ; ")}.
Carte : ${LD.zones.join(" ; ")}.
Interface : ${LD.ui.join(" ; ")}.
Données sauvegardées : ${LD.save.join(" ; ")}.
Monétisation (jamais « payer pour gagner » contre les autres joueurs) : ${LD.money.join(" ; ")}.

Direction artistique : style ${ART.style}. Ambiance ${ART.mood}. Palette : ${ART.palette}. Éléments de décor : ${ART.props.join(", ")}.

Règles de production pour toute l'équipe :
- Modèles 3D : faits dans Blender, exportés en FBX, importés avec le 3D Importer de Roblox Studio. Pas de modèles générés par IA, pas de modèles gratuits de la Toolbox dans le jeu final.
- Sons et musiques : uniquement depuis la bibliothèque audio de Roblox (Creator Store / Toolbox → Audio). Ne générer aucun son, ne pas importer de son extérieur.
- Code : Luau, logique importante côté serveur uniquement (ne jamais faire confiance au client).
- Respecter les règles de la communauté Roblox et afficher les probabilités de tout objet aléatoire payant.
- Le téléphone est la plateforme n°1 : gros boutons, interface lisible sur petit écran, bonnes performances.`;
}
/* ---------- Équipe d'agents qui FONT le jeu ---------- */
const LOOP_OBJECTS={
 steal:["base de joueur (plateforme + murs bas + porte)","socle d'exposition d'objet","tapis roulant d'apparition","porte-laser de verrouillage","boutique d'améliorations (stand)"],
 stat:["porte de palier (arche avec chiffre)","tapis de course","podium de rebirth","panneaux de zone"],
 collect:["œufs ou graines (une version par rareté)","incubateur / pot","stand de boutique","table d'échange","créatures ou objets à collectionner (au moins 6)"],
 throwfeed:["créature à chaque stade d'évolution (au moins 4 stades)","aliments (au moins 5)","enclos ou nid","distributeur de nourriture"],
 rounds:["lobby (salle d'attente)","armes ou outils des rôles","accessoires de cachette","3 cartes de manche (structures principales)"],
 survive:["abri / feu de camp","monstre (modèle + rig)","ressources (bois, ferraille…)","bâtiments de la carte","objets de survie (lampe, outils)"],
 rp:["maisons (au moins 3 modèles)","véhicules (au moins 3)","mobilier (lit, cuisine, canapé…)","bâtiments du centre-ville"],
 fashion:["podium","loge avec miroirs","vêtements et accessoires (en accessoires Roblox)","décor de défilé"],
 build:["pièces de construction (au moins 10)","rampe de lancement","atelier"],
 tycoon:["terrain de base","machines de production (au moins 5)","convoyeur","boutons d'achat (socle)","décor du business"],
 td:["unités (au moins 6)","ennemis (au moins 5)","boss","éléments de chemin et décor des cartes","portail d'invocation"],
 arena:["arène et obstacles","effets d'armes ou de pouvoirs (support visuel)","accessoires des personnages"],
 shooter:["armes (au moins 4)","éléments de couverture","cartes (bâtiments, murs)"],
 sport:["terrain","buts / paniers","ballon","tribunes"],
 obby:["plateformes et obstacles (au moins 15 types)","checkpoints","décor de chaque étape"],
 fish:["cannes à pêche (au moins 4)","poissons (au moins 12)","quai et bateaux","stand du marchand","aquarium"]
};
/* ---------- Équipe calculée selon l'idée ---------- */
function chunk(arr,n){const o=[];for(let i=0;i<arr.length;i+=n)o.push(arr.slice(i,i+n));return o}
const ANIMS={steal:["courir en portant un objet","voler (saisir)","se faire toucher / lâcher l'objet","célébration"],stat:["course rapide","saut","rebirth (montée)"],collect:["éclosion d'œuf","créatures : attente, marche, joie","échange (poignée de main)"],throwfeed:["lancer","créature : manger, grandir, joie, attente","évolution (transformation)"],rounds:["attaque du rôle méchant","tir / action du rôle gentil","mort / ragdoll","victoire"],survive:["monstre : marche, course, attaque, cri","joueur : ramasser, fabriquer, se cacher"],rp:["s'asseoir, dormir, cuisiner","conduire","emotes"],fashion:["marche de défilé","poses (au moins 6)"],build:["construire (outil)","éjection / crash"],tycoon:["machines qui tournent","PNJ clients"],td:["unités : attente, attaque (une par unité)","ennemis : marche, mort","boss : attaque spéciale"],arena:["attaques de base","capacités spéciales","esquive","ragdoll"],shooter:["visée, tir, rechargement (par arme)","mort"],sport:["frappe, passe, tacle","célébrations"],obby:["checkpoint atteint","chute"],fish:["lancer de ligne","moulinet / combat","prise (brandir le poisson)"]};
const NEEDS_SOCIAL=new Set(["steal","collect","rp","rounds","fashion","td","sport","arena","shooter"]);
function roster(I){
  const L=LOOPS[I.loop.k],LD=LOOP_DESIGN[I.loop.k],ART=THEME_ART[I.th.k],st=structOf(I.loop.k),multi=st.places.length>1;
  const models=[...(LOOP_OBJECTS[I.loop.k]||[]),...ART.props.map(x=>"décor : "+x)];
  const refs=I.loop.ex.map(g=>g.tn).join(", ");
  const R=[];const add=(id,name,phase,owns,deps,mission,dod)=>R.push({id,name,phase,owns,deps,mission,dod});
  add("chef","Chef de projet","Phase 0 · démarre en premier",["la structure de l'Explorer","les places de l'expérience","Workspace/_Build (version de test)"],[],
`1. Avant tout, joue (ou regarde des vidéos de gameplay sur internet de) ${refs} pour avoir en tête le niveau de qualité visé.
2. Dans Roblox Studio, crée TOUT DE SUITE la structure de l'Explorer : un dossier vide pour chaque agent, exactement aux chemins de la liste « Organisation »${multi?`, dans chaque place (${st.places.map(([n])=>n).join(", ")})`:""}.
3. Envoie à chaque agent un message de départ : ce qu'il livre en premier pour la version 1 et qui l'attend.
4. Version 1 = la boucle complète jouable de bout en bout + les 5 premières minutes + l'interface principale + la sauvegarde, au niveau de qualité final (pas un prototype moche).
5. Toutes les 30 à 60 minutes : lance une partie de test, note ce qui casse ou n'a pas le niveau, envoie un message précis à l'agent propriétaire.
6. Tu ne déclares le jeu terminé que quand la liste « Fini » de chaque agent est validée et que le testeur confirme zéro bug connu.`,
["Structure de l'Explorer créée dans chaque place","Chaque agent a reçu son départ","Version 1 jouable de A à Z","Zéro bug connu au moment de la sortie"]);
  add("da","Directeur artistique (DA)","Phase 1",["Lighting, Atmosphere, Sky, effets post-traitement","ReplicatedStorage/Shared/Theme","StarterGui/_UIKit","ReplicatedStorage/Assets/Materials","Workspace/_Thumbnails"],["chef"],
`1. Recherche sur internet des références visuelles : captures et miniatures de ${refs}, et des images « ${ART.style} » (ArtStation, Pinterest, page Roblox des jeux du top). Choisis 5 à 8 références et décris en 3 lignes au chef de projet le style retenu.
2. Utilise Roblox Studio pour régler Lighting (Technology Future, ClockTime, Brightness, Ambient, ColorShift), Atmosphere, Sky, Bloom, ColorCorrection, SunRays : ambiance « ${ART.mood} ».
3. Écris le ModuleScript ReplicatedStorage/Shared/Theme : palette en Color3 (${ART.palette}), couleurs de rareté ou d'équipe, polices Roblox, tailles de texte, rayons des coins, durées d'animation standard.
4. Construis dans StarterGui/_UIKit (désactivé) des composants d'interface de niveau professionnel : bouton principal, secondaire, icône, panneau, fenêtre avec titre, barre de progression, notification, onglets, case de prix en Robux. UICorner, UIStroke, UIGradient, ombres, états survol/appui animés. Regarde l'interface des jeux de référence pour le niveau de finition.
5. Crée les MaterialVariants du décor dans ReplicatedStorage/Assets/Materials.
6. Ensuite, contrôle tout le visuel du jeu en continu et envoie des corrections précises aux agents.
7. En fin de projet : scène de miniatures dans Workspace/_Thumbnails.`,
["Le jeu a une identité visuelle claire et cohérente partout","Aucune couleur ni police en dur dans le jeu","Les composants du UIKit sont utilisés par tous les écrans","Lisible et beau sur téléphone"]);
  add("gd","Game designer","Phase 1",["ReplicatedStorage/Shared/GameConfig"],["chef"],
`1. Joue ou regarde sur internet des vidéos de ${refs} et note comment ils rythment la progression et les récompenses.
2. Écris directement dans le ModuleScript ReplicatedStorage/Shared/GameConfig TOUTES les valeurs du jeu, commentées : vitesses, durées, prix, gains, probabilités, au moins 20 paliers de progression, raretés, récompenses quotidiennes, limites anti-abus.
3. Systèmes à chiffrer : ${LD.systems.join(" ; ")}.
4. Les 5 premières minutes doivent se passer ainsi : ${LD.first5}
5. Préviens les programmeurs et l'économie à chaque changement important.
6. Dès que le jeu tourne, joue des sessions de 15 minutes et ajuste GameConfig jusqu'à ce que la progression soit motivante sans être trop rapide.`,
["GameConfig contient tous les chiffres, rien n'est en dur ailleurs","Courbe de progression testée sur 1 h de jeu","Première récompense en moins de 30 secondes"]);
  // carte : un level designer par 2 zones
  chunk(LD.zones,2).forEach((z,i,arr)=>add("level"+(i+1),arr.length>1?`Level designer ${i+1}`:"Level designer","Phase 2 · après le DA",[`Workspace/Map/Zone${i+1}`],["da"],
`Tes zones : ${z.join(" ; ")}.
1. Regarde sur internet des captures et vidéos de la carte de ${refs} pour la lisibilité et la densité.
2. Utilise Roblox Studio pour faire d'abord le blockout en Parts (tailles réelles en studs ; un joueur marche à ~16 studs/s) et teste la circulation en mode Play.
3. Remplace le blockout par les modèles Blender des modélisateurs (dossier ReplicatedStorage/Assets/Models) ; demande-leur ce qui manque.
4. Utilise Terrain (outils de terrain de Studio) pour le sol, l'eau et le relief si ça colle à la DA.
5. Place SpawnLocation, zones interactives et PNJ avec des tags CollectionService convenus par message avec les programmeurs.
6. Repères visuels pour s'orienter, pas de zone vide ou plate sans intérêt, chemins évidents pour un nouveau joueur.
7. Performance : Anchored partout, CollisionFidelity simple, StreamingEnabled, pas de milliers de petites pièces.${multi&&i==0?`\n8. Construis aussi le décor de la place ${st.places[0][0]}.`:""}`,
["Zone belle sous tous les angles, dans la DA","Aucun endroit où l'on reste coincé ou tombe hors de la carte","60 images/seconde sur le téléphone de l'émulateur"]));
  // modèles : 3 par modélisateur
  chunk(models,3).forEach((list,i,arr)=>add("model"+(i+1),`Modélisateur 3D ${i+1} (Blender)`,"Phase 2 · après le DA",[`ReplicatedStorage/Assets/Models/Set${i+1}`],["da"],
`Tes modèles : ${list.join(" ; ")}.
Pour CHAQUE modèle :
1. Recherche sur internet 3 à 5 images de référence (« stylized low poly ${list[0].replace(/^décor : /,"")} », ArtStation, Sketchfab, et les objets équivalents dans ${refs}).
2. Utilise Blender pour le modéliser (via ton outil Blender ou un script Python bpy) : style ${ART.style}, silhouette lisible de loin, biseaux (Bevel) sur les arêtes visibles, pas de faces inutiles. Budget : quelques centaines à quelques milliers de triangles.
3. Utilise Blender pour le dépliage UV et les couleurs : couleurs du module Theme (palette ${ART.palette}), une texture 512 ou 1024 si nécessaire.
4. Utilise Blender pour régler l'échelle (un avatar Roblox ≈ 5 studs), appliquer les transformations, placer l'origine, nommer en anglais, puis exporter en FBX.
5. Utilise Roblox Studio pour l'importer (3D Importer), régler Anchored, CollisionFidelity, RenderFidelity, PrimaryPart, et le ranger dans ton dossier.
6. Préviens par message le level designer et le programmeur concerné.
Interdit : modèle généré par IA, modèle de la Toolbox, faux modèle en Parts.`,
["Chaque modèle a l'air fait par un pro, dans la DA","Bonne échelle à côté d'un avatar","Pas de trous, pas de faces à l'envers, collisions correctes"]));
  add("anim","Animateur","Phase 3 · après les modèles",["ReplicatedStorage/Assets/Animations"],["model1"],
`Animations à faire : ${(ANIMS[I.loop.k]||["attente","marche","action","victoire"]).join(" ; ")}.
1. Regarde sur internet des vidéos de ${refs} pour le timing et l'exagération des mouvements.
2. Utilise Blender pour rigger les créatures et objets animés (armature, poids), animer et exporter avec le modèle ; utilise l'Animation Editor de Roblox Studio pour les animations d'avatar R15.
3. Publie chaque animation, crée les objets Animation avec leur ID dans ton dossier, et donne les noms aux programmeurs.`,
["Animations fluides, avec anticipation et rebond","Aucune animation qui glisse ou traverse le sol","Boucles sans à-coup"]);
  add("vfx","Effets visuels (VFX)","Phase 3",["ReplicatedStorage/Assets/VFX"],["da"],
`1. Regarde sur internet des exemples d'effets Roblox de qualité (vidéos « Roblox VFX », DevForum) et les effets de ${refs}.
2. Utilise Roblox Studio (ParticleEmitter, Beam, Trail, Attachment, Highlight, PointLight) pour faire : récompense, gain d'argent, rareté (un effet par rareté), amélioration, apparition, disparition, et les effets propres à « ${L.name} ».
3. Couleurs du module Theme, textures de particules prises dans les ressources Roblox ou faites à la main, jamais générées par IA.
4. Chaque effet = un modèle prêt à cloner, avec une fonction Play dans un ModuleScript ReplicatedStorage/Assets/VFX/VFXPlayer.`,
["Chaque action importante a un effet","Effets beaux mais légers sur téléphone"]);
  add("sound","Sound designer","Phase 2",["SoundService","ReplicatedStorage/Assets/Sounds"],["da"],
`1. Utilise uniquement la bibliothèque audio de Roblox (Creator Store / Toolbox → Audio) : rien de généré, rien d'importé.
2. Trouve et compare au moins 3 options pour chaque son : ${LD.sfx.join(", ")}, chaque clic et validation de l'interface, notifications, et 2 à 3 musiques (mots-clés : « ${ART.music} » ; ambiance : « ${ART.amb} »). Garde le meilleur.
3. Utilise Roblox Studio pour créer chaque Sound (SoundId, volume, Looped, PlaybackSpeed) dans ton dossier, les SoundGroups (Music, SFX, UI, Ambience) dans SoundService, et un module SoundPlayer pour jouer un son par son nom.
4. Place les sons 3D d'ambiance dans la carte avec les level designers.
5. Mixe : la musique ne couvre jamais les effets importants.`,
["Chaque action a un son","Aucun son trop fort, coupé ou qui boucle mal","Réglage pour couper la musique"]);
  // code
  add("core","Programmeur noyau (données et réseau)","Phase 2 · démarre tôt",["ServerScriptService/Core","ReplicatedStorage/Remotes","ReplicatedStorage/Shared/Net"],["gd"],
`1. Lis la documentation officielle sur internet (create.roblox.com/docs) pour DataStoreService, MessagingService, RemoteEvents et les bonnes pratiques de sauvegarde.
2. Utilise Roblox Studio pour écrire : un DataService (profil par joueur : ${LD.save.join(" ; ")} ; chargement, sauvegarde automatique, BindToClose, session verrouillée pour éviter la perte ou la duplication de données, migrations de version) ; le dossier Remotes et un module Net avec limite de fréquence et validation des types.
3. Fournis aux autres programmeurs une interface simple (ex. DataService:Get(player), DataService:Update(player, fn)) et envoie-la par message.${multi?`\n4. Téléportation entre ${st.places.map(([n])=>n).join(" et ")} avec TeleportService (groupes, échecs, retour, données transmises).`:""}`,
["Aucune perte de données, même en quittant brutalement","Aucune erreur dans la fenêtre Output","Testé avec 2 joueurs en serveur local"]);
  chunk(LD.systems,2).forEach((sy,i)=>add("sys"+(i+1),`Programmeur gameplay ${i+1}`,"Phase 2 · dès que GameConfig et le noyau existent",[`ServerScriptService/Systems/${sy.map(x=>x.replace(/\(.*?\)/g,"").trim().split(/\s+/).slice(0,2).join("")).join("_").replace(/[^A-Za-z0-9_À-ÿ]/g,"")}`],["core","gd"],
`Tes systèmes : ${sy.join(" ; ")}.
1. Regarde sur internet comment ${refs} font ces systèmes (vidéos de gameplay, DevForum) pour viser le même niveau de finition.
2. Utilise Roblox Studio pour écrire chaque système en ModuleScript propre et commenté, côté serveur, avec les chiffres de GameConfig et le DataService du noyau.
3. Le serveur vérifie tout : distances, temps de recharge, argent, possession. Le client ne décide de rien.
4. Gère tous les cas limites : joueur qui quitte au milieu, deux joueurs en même temps sur le même objet, valeurs absentes, lenteur réseau.
5. Déclenche pour chaque action les retours (son, VFX, animation, notification) via les modules des autres agents.`,
["Système complet, sans erreur dans Output","Testé seul et à 2–4 joueurs","Impossible à tricher avec un exploit simple"]));
  chunk(LD.ui,3).forEach((sc,i,arr)=>add("ui"+(i+1),arr.length>1?`Programmeur interface ${i+1}`:"Programmeur interface","Phase 2 · dès que le UIKit existe",[`StarterGui/${i==0?"HUD et écrans":"Écrans"+(i+1)}`,`StarterPlayer/StarterPlayerScripts/UI${i+1}`],["da","core"],
`Tes écrans : ${sc.join(" ; ")}.
1. Regarde sur internet des captures de l'interface de ${refs} pour la disposition et le niveau de finition.
2. Utilise Roblox Studio pour construire chaque écran en clonant les composants de StarterGui/_UIKit, avec uniquement les couleurs et polices du module Theme : l'interface doit suivre la DA à 100 %.
3. Tailles en Scale, UIAspectRatioConstraint, zones sûres (ScreenInsets), boutons ≥ 60 px, testé sur 3 tailles d'écran dans l'émulateur.
4. Animations d'ouverture/fermeture avec TweenService, sons d'interface du SoundPlayer, chiffres animés quand ils changent.
5. Branche tout aux Remotes du noyau : le client affiche, le serveur décide.`,
["Beau, lisible et cohérent avec la DA sur téléphone et PC","Aucun texte coupé ni bouton qui déborde","Chaque bouton a un son et une animation"]));
  add("feel","Game feel (finitions)","Phase 3",["ReplicatedStorage/Shared/Feedback"],["vfx","sound","ui1"],
`1. Regarde sur internet des vidéos sur le « game feel / juice » et observe ${refs} : chaque action y est récompensée par du son, du mouvement et des effets.
2. Utilise Roblox Studio pour écrire le module Feedback : nombres qui s'envolent, secousse de caméra légère, flash, zoom de caméra, ralenti court, pop d'échelle (TweenService), avec les sons et VFX des autres agents.
3. Passe sur CHAQUE action du jeu et vérifie qu'elle a un retour satisfaisant ; sinon demande l'ajout à l'agent propriétaire ou fournis-lui l'appel Feedback à utiliser.`,
["Aucune action « muette »","Les retours restent agréables après 1 h de jeu"]);
  add("tuto","Tutoriel (premières minutes)","Phase 3",["StarterGui/Tutorial","StarterPlayer/StarterPlayerScripts/Tutorial"],["ui1","gd"],
`1. Regarde sur internet comment ${refs} accueillent un nouveau joueur.
2. Utilise Roblox Studio pour faire un tutoriel sans texte long : flèches 3D (Beam), surbrillance de l'objectif (Highlight), petites bulles, qui guident exactement ces 5 premières minutes : ${LD.first5}
3. Il ne se lance qu'à la première visite (donnée sauvegardée par le noyau) et se termine par une récompense.`,
["Un joueur qui ne lit rien comprend quoi faire en 30 secondes"]);
  if(NEEDS_SOCIAL.has(I.loop.k)) add("social","Fonctions sociales","Phase 3",["ServerScriptService/Systems/Social","StarterGui/Social"],["core","ui1"],
`Utilise Roblox Studio pour coder : classement du serveur (leaderstats) et classement global (OrderedDataStore, panneau dans le lobby), invitations d'amis (SocialService), bonus en jouant avec des amis${I.loop.k==="collect"||I.loop.k==="steal"?", et les échanges sécurisés entre joueurs (double confirmation, vérification serveur, journal anti-arnaque)":""}. Lis la documentation officielle sur internet pour chaque service.`,
["Échanges impossibles à arnaquer ou dupliquer","Classements à jour"]);
  add("eco","Économie et monétisation","Phase 3",["ServerScriptService/Systems/Monetization","StarterGui/Shop"],["gd","core","ui1"],
`1. Regarde sur internet la boutique de ${refs} (prix en Robux, présentation).
2. Utilise Roblox Studio pour coder : ${LD.money.join(" ; ")} ; UserOwnsGamePassAsync, PromptGamePassPurchase/PromptProductPurchase, ProcessReceipt (sauvegarde avant de confirmer, jamais de double crédit), récompenses gratuites (quotidienne, temps de jeu, groupe).
3. Construis l'écran Boutique avec le UIKit. Demande au chef de projet les IDs créés par le créateur dans le Creator Hub (IDs de test en attendant).
4. Objets aléatoires payants : probabilités affichées. Aucun avantage payant écrasant contre les autres.`,
["Achats testés en mode test, aucun double crédit","Le joueur gratuit s'amuse autant"]);
  add("loc","Localisation","Phase 4",["LocalizationService (tables de traduction)"],["ui1"],
`Utilise Roblox Studio pour créer les LocalizationTables du jeu en anglais (langue principale), français, espagnol et portugais du Brésil : tous les textes de l'interface, du tutoriel et des notifications. Vérifie dans l'émulateur (changement de langue) qu'aucun texte ne déborde.`,
["Toutes les phrases traduites, aucun texte en dur non traduit"]);
  add("qa1","Testeur gameplay","Phase 4 · dès qu'une version tourne",["ServerScriptService/Tests (désactivé avant sortie)"],["chef"],
`1. Utilise Roblox Studio (Play, Start local server à 2–4 joueurs) pour jouer chaque système : ${LD.systems.join(" ; ")}, et chaque écran.
2. Essaie de casser le jeu : cliquer partout très vite, quitter au mauvais moment, faire les choses dans le désordre, deux joueurs sur le même objet.
3. Chaque bug = un message court à l'agent propriétaire (étapes, attendu, obtenu, capture). Re-teste après correction.`,
["Zéro bug connu","La boucle complète testée de A à Z plusieurs fois"]);
  add("qa2","Testeur technique (performance et sécurité)","Phase 4",["rien (il ne modifie pas le jeu)"],["chef"],
`1. Utilise Roblox Studio : fenêtre Output (zéro erreur, zéro warning), MicroProfiler, statistiques de mémoire et de réseau, émulateur de téléphones bas de gamme.
2. Teste la sécurité : envoie de fausses valeurs aux RemoteEvents depuis la barre de commande, téléportation, vitesse modifiée.
3. Lis sur internet les bonnes pratiques anti-exploit Roblox (DevForum) et vérifie qu'elles sont appliquées.
4. Envoie chaque problème à l'agent propriétaire.`,
["60 images/s sur téléphone, temps de chargement court","Aucun exploit simple ne marche"]);
  add("launch","Lancement","Phase 5",["StarterGui/UpdateLog","ServerScriptService/Systems/Codes"],["da","eco"],
`1. Regarde sur internet les pages Roblox de ${refs} (titre, icône, miniatures, description).
2. Utilise Roblox Studio pour : le panneau « Nouveautés », le système de codes promo, et les captures de l'icône (512×512) et de 3 miniatures (1920×1080) dans la scène du DA.
3. Écris le titre (mot-clé principal dans les 3 premiers mots ; piste « ${I.title} ») et la description, prêts à coller dans le Creator Hub, et envoie-les au chef de projet.
4. ${seasonText()} Prépare l'événement de saison dans le jeu avec le DA et le game designer.`,
["Page du jeu prête","Événement de saison jouable"]);
  return R;
}
function agents(I){
  const R=roster(I),refs=I.loop.ex.map(g=>g.tn).join(", ");
  const team=R.map(a=>`- ${a.name} : ${a.owns.join(", ")}`).join("\n");
  return R.map(a=>({...a,prompt:
`Tu es l'agent « ${a.name} » d'une équipe de ${R.length} agents IA qui fabriquent ensemble, en même temps, un jeu Roblox complet dans le même projet Roblox Studio. Chaque agent fait une partie précise du jeu ; ensemble vous faites le jeu de A à Z.

RÈGLE N°1 : TU FAIS LE TRAVAIL DANS LE JEU.
Tu construis, codes, modélises et règles toi-même avec tes outils (Roblox Studio, Blender, internet, terminal). Tu ne rédiges PAS de plan ou de document « à faire » à la place du travail. Le seul texte hors du jeu : un compte rendu de 5 lignes au chef de projet à la fin de chaque étape.

NIVEAU DE QUALITÉ EXIGÉ
- Le jeu doit avoir le niveau des meilleurs jeux Roblox actuels (${refs}). Pas de prototype, pas de « placeholder » laissé dans la version finale.
- Avant de commencer, va regarder sur internet des exemples réels de ce que tu dois faire (vidéos de gameplay, captures des jeux de référence, documentation officielle create.roblox.com/docs, DevForum, références d'images). Inspire-toi du niveau, ne copie rien.
- Zéro bug : aucune erreur ni warning dans la fenêtre Output, tous les cas limites gérés, testé seul et à plusieurs, testé dans l'émulateur téléphone.
- Chaque action du joueur a un retour : son, animation, effet visuel, réaction de l'interface.
- Si quelque chose n'a pas le niveau, refais-le jusqu'à ce qu'il l'ait.

${brief(I)}

ORGANISATION DU JEU DANS STUDIO (chaque agent ne modifie QUE ce qu'il possède)
${team}
Besoin d'un changement chez un autre agent ? Envoie-lui un message court au lieu de le faire. Ce dont tu dépends n'existe pas encore ? Crée un remplaçant temporaire dans TON dossier, continue, et remplace-le dès que la vraie version arrive.

OUTILS IMPOSÉS
- Modèles 3D : uniquement faits dans Blender (ton outil Blender ou un script Python bpy), exportés en FBX, importés dans Studio. Jamais de modèle généré par IA ni de modèle de la Toolbox.
- Sons et musiques : uniquement la bibliothèque audio de Roblox. Rien de généré, rien d'importé.
- Interface : uniquement les composants StarterGui/_UIKit et le module Theme du DA.
- Code : Luau propre, commenté, logique importante côté serveur, chiffres dans GameConfig.

TA MISSION (${a.phase}${a.deps.length?` · dépend de : ${a.deps.map(d=>(R.find(x=>x.id===d)||{name:d}).name).join(", ")}`:""})
${a.mission}

C'EST FINI QUAND
${a.dod.map(x=>"- "+x).join("\n")}
- Testé en mode Play dans Studio, aucune erreur dans Output.

QUAND TU AS FINI UNE ÉTAPE
Envoie au chef de projet : ce qui est maintenant dans le jeu, où (chemin dans l'Explorer), et ce qui reste. Puis passe à l'étape suivante sans attendre.`}));
}
function teamWhy(I,R){const LD=LOOP_DESIGN[I.loop.k],models=(LOOP_OBJECTS[I.loop.k]||[]).length+THEME_ART[I.th.k].props.length;
  const c=k=>R.filter(a=>a.id.startsWith(k)).length;
  return `${c("model")} modélisateurs pour ${models} modèles (3 chacun) · ${c("sys")} programmeurs gameplay pour ${LD.systems.length} systèmes (2 chacun) · ${c("ui")} programmeur${c("ui")>1?"s":""} interface pour ${LD.ui.length} écrans · ${c("level")} level designer${c("level")>1?"s":""} pour ${LD.zones.length} zones · plus la direction, le son, l'animation, les effets, les finitions, le tutoriel${R.some(a=>a.id=="social")?", le social":""}, l'économie, la traduction, 2 testeurs et le lancement.`}
/* ---------- Ce que le créateur doit préparer ---------- */
const STRUCT={
 td:{places:[["Lobby","place de départ : choix des unités, invocations, groupe de joueurs"],["Partie","la carte où se jouent les vagues ; les joueurs y sont envoyés en groupe depuis le lobby"]],max:[12,4],why:"Les parties de tower defense se jouent à 1–4 joueurs alors que le lobby en réunit beaucoup plus : deux places séparées, reliées par TeleportService."},
 survive:{places:[["Lobby","place de départ : choix de la classe, formation des groupes, boutique"],["Partie","la carte de survie où le groupe est envoyé ensemble"]],max:[20,6],why:"Une partie de survie se joue en petit groupe du début à la fin : le lobby forme les groupes et les envoie ensemble dans la place Partie avec TeleportService."},
 rounds:{places:[["Jeu","une seule place : le lobby et les cartes sont dans la même place, le serveur gère les manches"]],max:[12],why:"Les manches s'enchaînent dans le même serveur, comme Murder Mystery 2 : une seule place suffit."},
 shooter:{places:[["Jeu","une seule place : lobby, champ de tir et cartes dans la même place"]],max:[16],why:"Un seul serveur gère le lobby et les matchs : plus simple, et les joueurs restent ensemble."},
 rp:{places:[["Ville","une seule grande place"]],max:[30],why:"Un roleplay a besoin de beaucoup de joueurs dans le même monde."},
 default:{places:[["Jeu","une seule place qui contient tout le jeu"]],max:[8],why:"Tout se passe dans le même monde : une seule place suffit, inutile d'en créer d'autres."}
};
const MAXP={steal:8,stat:12,collect:10,throwfeed:10,fashion:16,build:10,tycoon:8,arena:16,sport:12,obby:20,fish:12};
function structOf(k){const st=STRUCT[k]||{...STRUCT.default,max:[MAXP[k]||10]};return st}
function prepSteps(I){
  const k=I.loop.k,st=structOf(k),LD=LOOP_DESIGN[k],multi=st.places.length>1;
  const placesTxt=st.places.map(([n,r],i)=>`<b>${esc(n)}</b> (max ${st.max[i]??st.max[0]} joueurs) : ${esc(r)}`).join("<br>");
  return [
   ["Logiciels","Installe Roblox Studio et Blender","Roblox Studio (gratuit, depuis create.roblox.com) et Blender (gratuit, depuis blender.org). Installe aussi l'app Roblox sur ton téléphone pour tester."],
   ["Logiciels","Vérifie ton compte Roblox","Ajoute et vérifie ton adresse e-mail dans les paramètres Roblox : c'est nécessaire pour publier et gérer une expérience."],
   ["Expérience","Crée un groupe Roblox (conseillé)","Crée un groupe pour ton studio : l'expérience lui appartiendra, tu pourras ajouter des collaborateurs et donner une récompense aux membres. Le groupe coûte des Robux à créer : tu peux aussi publier depuis ton compte et transférer plus tard."],
   ["Expérience",`Crée l'expérience « ${I.title} »`,"Dans Roblox Studio : nouvelle place (Baseplate), puis Fichier → Publier sur Roblox. Laisse-la en privé pendant le développement."],
   ["Expérience",multi?`Crée ${st.places.length} places dans l'expérience`:"Garde une seule place",`${placesTxt}<br><span class="src">${esc(st.why)}${multi?" Pour ajouter une place : dans Studio, fenêtre Asset Manager → Places → clic droit → Ajouter une place, ou dans le Creator Hub → ton expérience → Places. Note l'ID de chaque place (PlaceId) pour le programmeur serveur.":""}</span>`],
   ["Expérience","Règle le nombre de joueurs par serveur",`Creator Hub → ton expérience → Places → ${multi?"chaque place":"ta place"} → Max players : ${st.places.map(([n],i)=>`${n} = ${st.max[i]??st.max[0]}`).join(", ")}.`],
   ["Réglages","Active l'accès aux services API dans Studio","Studio → Paramètres du jeu (Game Settings) → Sécurité → active « Enable Studio Access to API Services ». Sinon la sauvegarde (DataStore) ne marche pas pendant les tests."],
   ["Réglages",multi?"Autorise la téléportation entre les places":"Choisis les appareils",multi?"Les places d'une même expérience peuvent se téléporter entre elles avec TeleportService, mais les téléportations ne marchent pas dans Studio : il faudra tester sur un serveur publié.":"Paramètres du jeu → Basic Info → coche Téléphone, Tablette, Ordinateur (et Console si tu le veux)."],
   ["Réglages","Active la collaboration si tu n'es pas seul","Fichier → Collaborer (Team Create) pour travailler à plusieurs sur la même place, puis invite les autres personnes."],
   ["Monétisation","Crée les game passes et produits",`Creator Hub → ton expérience → Monétisation : crée ${LD.money.slice(0,3).join(", ")}. Laisse-les « hors vente » au début. Note chaque ID et donne-les au programmeur serveur et à l'agent Économie.`],
   ["Agents","Donne Roblox Studio et Blender à tes agents","Dans ton app d'agents, vérifie que chaque agent a accès à l'outil Roblox Studio (la place ouverte) et que les modélisateurs ont accès à Blender. Sans ça, ils ne peuvent pas construire dans le jeu."],
   ["Agents","Lance les agents dans l'ordre des phases","Crée un agent par prompt : le chef de projet d'abord (il crée la structure de l'Explorer), puis le DA et le game designer, puis tous les autres. Ils se coordonnent entre eux par messages."],
   ["Avant la sortie","Remplis le questionnaire de maturité","Creator Hub → ton expérience → Questionnaire (Maturity & Compliance). Roblox le demande avant qu'une expérience soit publique."],
   ["Avant la sortie","Icône, miniatures et page du jeu","Importe l'icône (512×512) et les miniatures (1920×1080) préparées avec le DA, puis colle le titre et la description de l'agent Lancement."],
   ["Avant la sortie","Teste sur ton téléphone puis passe en public","Joue sur le serveur publié depuis ton téléphone avec un ami, vérifie la sauvegarde et les achats en mode test, puis passe l'expérience en public."]
  ];
}
function prepHTML(I){
  const key="labo-prep-"+I.title,done=store.get(key)||[],steps=prepSteps(I),st=structOf(I.loop.k);
  let lastG="";
  return `<div class="card" id="prepCard"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline"><h3>Ce que tu dois préparer avant de lancer les agents</h3><span class="src" id="prepCount">${done.length}/${steps.length} fait</span></div>
   <div class="note" style="margin:0"><b>Structure du jeu :</b> ${st.places.length} place${st.places.length>1?"s":""} — ${st.places.map(([n])=>esc(n)).join(" + ")}. ${esc(st.why)}</div>
   <div class="grid" style="gap:4px">${steps.map(([g,t,d],i)=>{const h=g!==lastG?`<div class="stamp" style="margin-top:8px">${esc(g)}</div>`:"";lastG=g;
     return `${h}<label class="prep" for="prep${i}" style="display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:start;padding:8px 10px;border:1px solid var(--line);border-radius:8px;cursor:pointer"><input type="checkbox" id="prep${i}" data-prep="${i}" ${done.includes(i)?"checked":""} style="margin-top:3px;accent-color:var(--accent)"><span><b>${esc(t)}</b><br><span class="src" style="font-size:13px">${d}</span></span></label>`}).join("")}</div></div>`;
}
function wirePrep(I){const key="labo-prep-"+I.title,n=prepSteps(I).length;
  document.querySelectorAll("[data-prep]").forEach(c=>c.onchange=()=>{const d=[...document.querySelectorAll("[data-prep]:checked")].map(x=>+x.dataset.prep);store.set(key,d);$("#prepCount").textContent=`${d.length}/${n} fait`})}
function renderPlan(){
  const el=$("#planOut");const I=currentChosen();
  if(!I){el.innerHTML=`<div class="note">Aucune idée choisie pour l'instant. Va dans <a href="#idees">Idées de jeux</a> ou <a href="#mon-idee">Mon idée</a> et appuie sur « Choisir ».</div>`;return}
  const AG=agents(I);PLAN=AG;
  el.innerHTML=`<div class="idea"><div class="top"><div class="grid" style="gap:6px;flex:1;min-width:220px"><span class="stamp">Idée choisie · ${esc(gname(I.genre))} · ${esc(LOOPS[I.loop.k].name)} · ${esc(I.T.label)}</span>
    <div class="title">${esc(I.title)}</div><p class="pitch">${esc(pitchOf(I))}</p>
    <div class="src">${projectSize(I.loop.k)}</div></div>${ring(I.score,"potentiel")}</div>${origHTML(I)}</div>
   ${prepHTML(I)}
   <div class="card"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline"><h3>Cette idée demande ${AG.length} agents</h3><span class="chip">calculé selon l'idée</span></div>
    <p class="src" style="margin:0">${esc(teamWhy(I,AG))}</p>
    <p class="src" style="margin:0">Chaque agent <b>construit directement dans le jeu</b> avec Roblox Studio (et Blender pour la 3D) et ne touche qu'à sa partie de l'Explorer. Ils se coordonnent par messages. Aucun ne doit écrire de document à la place du travail.</p>
    <div class="tablebox"><table><thead><tr><th>#</th><th>Agent</th><th>Ce qu'il possède dans Studio</th><th class="hide-sm">Quand</th></tr></thead><tbody>
    ${AG.map((a,i)=>`<tr><td class="n">${i+1}</td><td><b>${esc(a.name)}</b></td><td class="src" style="font-size:13px">${a.owns.map(esc).join("<br>")}</td><td class="hide-sm src">${esc(a.phase)}</td></tr>`).join("")}
    </tbody></table></div>
    <ol class="list"><li>Dans ton app, crée un agent par ligne du tableau et colle son prompt (bouton « Copier le prompt »). Chaque prompt contient tout le brief du jeu et la liste de l'équipe.</li>
    <li>Lance le chef de projet en premier : il crée la structure de l'Explorer et envoie le départ à chacun. Ensuite le DA, le game designer et le programmeur noyau, puis tous les autres en même temps.</li>
    <li>Tu peux ajouter autant d'agents que tu veux avec « Ajouter un agent » en bas.</li></ol>
    <div class="controls"><button class="primary" id="copyAll">Copier tous les prompts</button><button id="copyBrief">Copier le brief seul</button><span class="src" id="planMsg" role="status"></span></div></div>
   <details class="card"><summary><b>Le brief commun</b> (inclus dans chaque prompt)</summary><pre style="white-space:pre-wrap;font:13px/1.5 var(--mono);margin:0">${esc(brief(I))}</pre></details>
   ${AG.map((a,i)=>`<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:start">
      <div><span class="stamp">${esc(a.phase)}</span><h3>Agent ${i+1} · ${esc(a.name)}</h3><p class="src" style="margin:2px 0 0">Possède : ${a.owns.map(esc).join(" · ")}</p></div>
      <div class="controls"><button data-copy="${i}">Copier le prompt</button></div></div>
      <details><summary class="src">Voir le prompt</summary><pre style="white-space:pre-wrap;font:13px/1.5 var(--mono);margin:8px 0 0">${esc(a.prompt)}</pre></details></div>`).join("")}
   <div class="card"><h3>Ajouter un agent</h3><p class="src" style="margin:0">Besoin d'un rôle en plus (animateur, scénariste, traducteur…) ? Écris-le ici et le site prépare son prompt avec le brief.</p>
    <div class="controls"><label for="extraRole">Rôle <input type="text" id="extraRole" placeholder="ex. animateur des personnages"></label><label for="extraTask" style="flex:1;min-width:220px">Ce qu'il doit faire <input type="text" id="extraTask" style="width:100%" placeholder="ex. les animations de marche, d'attaque et de victoire"></label><button id="extraGo">Créer le prompt</button></div>
    <div id="extraOut"></div></div>`;
  wirePrep(I);
  const msg=t=>{$("#planMsg").textContent=t};
  const copy=async(txt,m)=>{try{await navigator.clipboard.writeText(txt);msg(m)}catch{msg("Le navigateur a bloqué la copie : ouvre « Voir le prompt » et sélectionne le texte.")}};
  $("#copyAll").onclick=()=>copy(AG.map((a,i)=>`===== AGENT ${i+1} · ${a.name} (${a.phase}) =====\n\n${a.prompt}`).join("\n\n\n"),"Les "+AG.length+" prompts sont copiés.");
  $("#copyBrief").onclick=()=>copy(brief(I),"Brief copié.");
  el.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>{const a=AG[+b.dataset.copy];copy(a.prompt,`Prompt « ${a.name} » copié.`);b.textContent="Copié ✓";setTimeout(()=>b.textContent="Copier le prompt",1800)});
  $("#extraGo").onclick=()=>{const r=$("#extraRole").value.trim(),t=$("#extraTask").value.trim();if(!r){$("#extraOut").innerHTML=`<p class="src">Écris d'abord le rôle.</p>`;return}
    const slug=r.replace(/[^A-Za-zÀ-ÿ0-9]+/g," ").trim().split(" ").map(w=>w[0].toUpperCase()+w.slice(1)).join("").replace(/[^A-Za-z0-9]/g,"")||"Extra";
    const base=agents(I)[0].prompt;const tpl=base.slice(base.indexOf("RÈGLE N°1"));
    const p=`Tu es l'agent « ${r} » d'une équipe d'agents IA qui fabriquent ensemble un jeu Roblox, en même temps, dans le même projet Roblox Studio. Tu possèdes le dossier ${t&&/blender|mod[eè]l|anim/i.test(r+t)?"ReplicatedStorage/Assets/"+slug:"ReplicatedStorage/Features/"+slug} (et seulement lui).

`+tpl.replace(/TA MISSION \([^)]*\)\n[\s\S]*?\n\nQUAND TU AS FINI/,`TA MISSION\n${t||"Fais tout ce qui relève de ton rôle, directement dans le jeu."}\nFais-le directement dans Roblox Studio${/mod[eè]l|3d|anim|blender/i.test(r+t)?" et dans Blender":""}, en respectant la DA (module Theme) et les outils imposés.\n\nQUAND TU AS FINI`);
    $("#extraOut").innerHTML=`<div class="controls" style="margin-top:8px"><button id="extraCopy">Copier ce prompt</button></div><pre style="white-space:pre-wrap;font:13px/1.5 var(--mono)">${esc(p)}</pre>`;
    $("#extraCopy").onclick=()=>copy(p,"Prompt copié.")};
}
let PLAN=[];

/* ---------- Branchements ---------- */
document.getElementById("ideaOut").addEventListener("click",e=>{
  const inf=e.target.closest("[data-info]"),ch=e.target.closest("[data-choose]");
  if(inf){const i=+inf.dataset.info,box=document.getElementById("info-"+i);if(box.innerHTML){box.innerHTML="";inf.textContent="Info"}else{box.innerHTML=infoHTML(CURRENT[i]);inf.textContent="Masquer"}}
  if(ch)chooseIdea(CURRENT[+ch.dataset.choose]);
});
window.addEventListener("hashchange",()=>{if(location.hash==="#plan")renderPlan()});
window.LABO_AFTER_LOAD=()=>{IDF=null;setupForm();if(location.hash==="#plan")renderPlan()};
