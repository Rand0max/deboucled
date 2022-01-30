
///////////////////////////////////////////////////////////////////////////////////////
// ANTI-BOUCLES
///////////////////////////////////////////////////////////////////////////////////////

function addPreBoucle(id, title, type, enabled, entities) {
    const preBoucle =
    {
        id: id,
        title: title,
        enabled: enabled,
        type: type,
        entities: entities
    };
    preBoucleArray.push(preBoucle);
}

function initPreBoucles() {
    addPreBoucle('boucledauthors', 'Pseudos boucled', entityAuthor, true,
        ['vinz', 'tacos', 'aneryl', 'flubus', 'kinahe', 'cacadetruire', 'pazeurabsolu', 'antoineforum', 'regimeducamp', 'jaxtaylor', 'procaine', 'antigwer', 'ademonstre', 'abbath', 'bobbob', 'croustipeau', 'cigarette', 'cigarrette', 'deratiseur', 'descogentil', 'draco-choc', 'erlinghaland', 'grifforzer', 'gutkaiser', 'hommecoussinet', 'huiledecoude', 'hyiga', 'jirenlechove', 'jvc-censure', 'jyren', 'kaguya', 'kane', 'danmartin', 'kaitokid', 'kiwayjohansson', 'krimson', 'ptitcieux', 'stopcensure', 'galacticwars', 'cimerrisitas', 'supernominateur', 'wohaha', 'zeroavenir', 'windowsbot', 'ylliade', 'mirainikki', 'leao', 'oael', 'surk', 'zemmourfinito', 'labelconfort', 'xinoz', 'zinzinabbath', 'rifson', 'garfield', 'qwertyofficial', 'vcxn', 'kallyuga', '[raven-_]', 'cub*t*mp', 'tub*dut*mp', 'vulvedutemp', 'pubdutemp', 'cubeduclan', 'cubedurang', 'cubedutime', 'clandutube', 'boucleurchtarbe', 'chouffomoting', 'pleinsdennuis', 'discord-gg-jvc', 'tc1873blanco', 'johny-wu', 'toyaf', 'troglonaute', 'jvxn', 'jvcxn', 'jvcartxna', 'bhlc13h18', 'puissancedekhey', 'micah-bell', 'kmselection', 'arrowheads', 'freepop', 'lionseducteur', 'poechips', 'princessebean', 'stopbanent', 'espiruto', 'cubarobusto', 'storev2', 'maikolinge', 'sanarik', 'encorebanni', 'gilbert733513', 'lydens', 'lionseul', 'lionseducteur', 'yarienapres4', 'timident', 'lionbanni', 'liondoux', 'lionancestral', 'cubemalgache', 'charle*auvet', 'nastyanass', 'op_tiffany', 'avortax3000']);

    addPreBoucle('bots', 'BOTS', entityAuthor, false,
        ['tontonfouilleur', 'squeezie-issou', '2__marches', 'anatoli_diatlov', 'soutien-rpc', 'lovemaze', 'leo2005', '1m54maisgrand', 'moussecerise', 'marduweb', 'pinnochiotte', 'kallyuga', 'khalidfouhami_', 'passion-gaming', '2marches_', '2marches', 'deux-marche', 'dokurorider', 'discord-gg-jvc', 'leao', 'oael', 'singemechant', 'jenaimarreptnsh', 'vinz', 'merci-macron99', 'poechips', 'avortax3000']);

    addPreBoucle('kj', 'Kikoo-Japs', entityAuthor, false,
        ['kj', 'kikoojap', 'trap', 'feet', 'waifu', 'kawai', '_crucifist01_', '_rsaaidesoutien', '-pazifion-', '[aleatoire]', '[arnak]', '[nft]', '[pink]panther', '[raven-_]', 'aaaarumi', 'aaargh_0knuckle', 'akambi', 'albatarrrrr', 'aleatoire423', 'animexpert_01', 'aniviathefrozen', 'asnium', 'assnium', 'asniumbandant', 'ass2trefle', 'azerlax', 'bakjou', 'bbclove', 'beckycringeintp', 'botanica', 'bousedekheyette', 'cage-i', 'celestinhoiii', 'charlesbuk', 'chatdutieks', 'cheuns', 'chucklaplante', 'chunchunmaru', 'chxrlotte', 'dankie', 'deadwapanese', 'deratisubuleryl', 'dokurorider', 'dqasdqdsqsdv', 'draco-choc', 'e-n-a', 'ecrevisse6', 'el_citrone', 'elilalilalulu', 'emptydudes', 'erikawaii', 'esclave_ankha', 'euhpile', 'evabien', 'femboy', 'fiondekyoko', 'fragiluxur', 'fullapesinge', 'furumia', 'gallys7', 'gamonstrebanni', 'gawr_gura', 'germanqueen', 'gio849', 'gockwach', 'goiemique', 'gommeblanc', 'gommebianc', 'goreprincess', 'grifforzer', 'guiguifdp', 'haruko_', 'heimtathurs', 'hollowness', 'hunterjahimees', 'hyacinthos', 'iamnokhey', 'icefairy', 'incel2sur10ette', 'inostranet', 'izumi_sagiri', 'jailedroibordel', 'jean_yahya', 'jeunessehonneur', 'jiva-chan', 'johanneslekhey', 'jteclaquelcul', 'jus_2_beat', 'jyren', 'kai-kod', 'kane', 'kawashimaurara', 'kesshouban', 'khaaal', 'kikoojapfangeux', 'kikoojapsordide', 'kiyoe', 'klaosuen', 'komisan', 'labynocle', 'laffey', 'lalena', 'lastingchild', 'le*nettoyeur', 'lenticulaire', 'lighthalzen', 'lisabp', 'lizslennus', 'lorkhaj89', 'lostwar', 'louisenadjeda', 'luna-blu', 'lysae', 'maeligg', 'maneirei', 'maneiret', 'margie_pkmn', 'marreduban', 'melkhor-dono', 'meowni', 'meragi', 'millefi', 'minatohiraishi', 'minseo', 'misakino_kukuru', 'missmonochrome', 'mister_swing', 'miuyaaa', 'mxthy', 'nancy*tomoe', 'nettoyeur2gland', 'nyamikyoto', 'nysaee', 'otokodarashi', 'ouaiskiffkiff', 'parars', 'pasteque_bannie', 'pikal2', 'pink-and-cute', 'pollitorico', 'pollorico', 'pomer', 'potichienchien', 'porteduforum', 'pougo', 'princessebean', 'raie-menthalo', 'ranze', 'ranzette', 'rapasducuck', 'raven-50', 'reacriz', 'rimurutempest-', 'rinesa', 'riokanol', 'ronisiaa', 'sahary', 'sashimimaruu', 'sinfulweeb', 'shillzificator', 'shintamaru', 'slimeti2', 'snuffyherisson', 'solio', 'soup71_', 'sruoxo', 'steinhausen', 'steinhorst', 'steinherz', 'superoksuper', 'supertemmies', 'teslakite', 'thehatkid', 'tobiichi', 'toyaf', 'tropfandetoi', 'twice-the-love', 'uwo', 'violeteverdeen', 'viiviiiix', 'vivearl', 'vivrayman3', 'waifupeach', 'wainwright', 'wepper', 'whitepantyhose', 'xeenay', 'yameyakuna', 'yhria', 'ylliade', 'yofie', 'yojong', 'yoshi_v', 'yoshiyosh_', 'yumiaaaa', 'zerotwo-']);

    addPreBoucle('insane', 'Zinzins', entityAuthor, false,
        ['vincenfreeman', 'aneryl', 'flubus', 'leao', 'oael', 'vinz', 'vcxn', 'tacos', 'kinahe', 'lesyeuxduforum', 'cigarette', 'cigarrette', 'deratiseur', 'windowsbot', 'arenyl', 'zemouroide', 'jefaisunlive', 'cub*t*mp', 'tub*dut*mp', 'vulvedutemp', 'pubdutemp', 'cubeduclan', 'cubedurang', 'cubedutime', 'clandutube', 'boucleurchtarbe', 'stonegiant', 'cacadetruire', 'pazeurabsolu', 'antoineforum', 'jaxtaylor', 'procaine', 'antigwer', 'ademonstre', 'croustipeau', 'draco-choc', 'grifforzer', 'hommecoussinet', 'kiwayjohansson', 'surk', 'zeroavenir', 'huiledecoude', 'aklaros', 'britneysperm', 'avortax3000']);


    addPreBoucle('popularboucles', 'Boucles connues', entitySubject, true,
        ['ces photos putain', 'yannick*tour eiffel', 'metisseur22cm', 'midsommar', 'eau*pasteque', 'celestin tu', 'l\'échéance est tombée', 'ai-je l\'air sympathique', 'pour avoir une copine en', 'no jump', 'john cena*mort', 'john cena*victime', 'par le corps masculin', 'dicaprio au lidl', '2 sauces interdites', 'allemand fou detruit son clavier', 'ma caissiere', 'traduisez en anglais', 'sauce sonic', 'seth gueko', 'gros gamos allemand', 'eau blanche', 'sss sache que', 'genre de mec', 'dwayne johnson', 'charles auvet', 'charle auvet', 'now cum', 'let\'s fucking go', 'boule blanche dans la mozarella', 'crocodile chelou', 'forumeur le plus eclatax', 'galet de poche', 'kebab breton', 'kebeb breton', 'des chances font du bruits et foutent le bordel', 'femmes vulgaires au lit', 'rockeuse dans l\'âme', 'pris une audi a1', 'fortune d\'arthur', 'renault sort son', 'japonaise*cave*93', 'embauché chez microsoft', 'chié durant l\'accouchement', 'reddit entier sur un mmo', 'rizantrasse', 'chinois dans un wok', 'ans de spam sur le 18-25', 'gamecube est la pire console', 'famille bourgeoise est incroyable', '300 jeux switch', 'je suis web dev', 'lara croft en legging', 'm\'avez vous déjà vu', 'jdg*youtube m\'ennuie', 'annonce son nouveau suv', 'hommes*qui font des métiers de bureau', 'si tu me trompes je te pardonne', '2m08', 'ancien complotiste', 'ami antivax est mort', 'disent*boucle*topics', 'volé un topic', 'do you know pomper l\'eau', 'cloudfare*antoineforum', 'cloudflare*antoineforum', 'action*antoineforum', 'antoineforum*ruine', 'dextre*antoineforum', 'frère atteint de trisomie', 'khey*cuve de poulets', 'mais j’ai menti sur mon job', 'évolution*style vestimentaire', 'meufs*haute savoie', 'hanouna et tpmp explosent de rire', 'honte*voile', 'sarah fraisou*nue']);

    addPreBoucle('covid19', 'Covid19', entitySubject, false,
        ['covid*', 'corona*', 'virus', 'gestes barriere', 'geste barriere', '*vaccin*', '*vax*', 'variant*', 'pfizer', 'moderna', 'sanitaire', 'dose*', '*confinement*', 'reconfine*', '*pass', 'vizio', 'schwab', 'veran', 'castex', 'pcr', 'antigenique', 'thrombose*', 'oracle', 'omicron', 'cas contact', 'hospitalisations', 'taux d\'incidence', 'myocardite*', 'couvre*feu', 'wuhan', 'quarantaine', 'raoult', 'pass vaccinal', 'neocov']);

    addPreBoucle('politic', 'Politique', entitySubject, false,
        ['*zemmour*', 'le z', 'du z', 'pro z', 'pro-z', 'z0zz', 'zozz', 'knafo', 'philippot', 'philipot', 'le pen', 'lepen', 'macron', 'cnews', 'asselineau', 'melenchon', 'lfi', 'france insoumise', 'rn', 'fn', 'rassemblement national', 'front national', 'republique en marche', 'la reconquete', 'fillon', 'veran', 'lrem', 'messiha', 'pecresse', 'xavier bertrand', 'yannick jadot', 'hidalgo', 'bruno lemaire', 'bruno le maire', 'castex', 'darmanin', 'sarkozy', 'sarko', 'taubira', 'ornellas', 'tatiana ventose', 'afghan*', 'ciotti', 'greg toussaint', 'livre noir', 'naulleau', 'rochedy', 'taliban*', 'thais', 'stanislas rigault', 'stanislas', 'generation z', 'corbiere', 'nathalie arthaud', 'odoul', 'collard']);

    addPreBoucle('deviant', 'Déviances', entitySubject, false,
        ['feet*', 'trap*', 'kj', 'adf', 'papa du forum', 'blacked', 'cuck', 'reine fatima', 'reine popo', 'shemale*', 'domina', 'fetichiste', 'fetichisme', 'mym', 'onlyfan', 'onlyfans', 'sissy*', 'trans', 'transexuel', 'transsexuel', 'transexuelle', 'transsexuelle', 'lgbt*', 'm2f', 'f2m', 'asmr', 'trav', 'travelo', 'femdom', 'cage de chastete', 'rimjob', 'chaturbate', 'salazar', 'sugar daddy', 'woodman', 'waifu', 'moneyslave', 'bbc', 'plug anal', 'edging', 'femboy*', 'desu', 'desu~', ':desu:', 'twink*', 'grindr', 'scat', 'scato', 'uro']);

    addPreBoucle('socials', 'Réseaux sociaux', entitySubject, false,
        ['tinder', 'twitter', 'facebook', 'tik*tok', 'adopte un mec', 'meetic', 'badoo', 'okcupid', 'bumble', 'happn', 'insta', 'instagram', 'snapchat', 'mym', 'onlyfan', 'onlyfans', 'grindr']);

    addPreBoucle('youtube', 'Youtube', entitySubject, false,
        ['youtube', 'feldup', 'norman', 'cyprien', 'natoo', 'kemar', 'jdg', 'joueur du grenier', 'amixem', 'squeezie', 'rire jaune', 'kevin tran', 'michou', 'mcfly', 'carlito', 'inoxtag', 'seblafrite', 'joyca', 'julien chieze', 'kyan khojandi', 'lena situations', 'charlie danger', 'florianonair', 'bench', 'bigflo', 'corda', 'fastgoodcuisine', 'julia', 'otaku', 'papacito', 'stephane edouard', 'nikocado', 'logan paul', 'aline*dessine']);

    addPreBoucle('kiddy', 'Immature', entitySubject, false,
        ['reacprout*', 'prout', 'caca', 'cacaprout', 'pipi', 'chibrax', 'post ou', 'postoo', 'pose toucan', 'chibre']);

    addPreBoucle('hatred', 'Haineux', entitySubject, false,
        ['facho*', 'chofs', 'chofa*', 'qlf', 'paz', 'pazification', 'pazifie', 's2s', 'gwer*', 'raciste*', 'hagar', 'hagra', '🐊', '🐷', 'bassem', 'sadek', 'les porcs', 'hitler', 'nazi*', 'mussolini', 'staline', 'negre*', 'bougnoul*', 'youtre*']);

    addPreBoucle('girls', 'Femmes', entitySubject, false,
        ['meuf', 'fille', 'femme', '*/10', '*/20', 'cul', 'sein*', 'boob*', 'bzez', '95e', 'kheyette*', 'colombienne', 'emma roberts', 'estelle redpill', 'lena situations', 'charlie danger', 'natoo', 'tatiana ventose', 'vedovelli', 'abella danger', 'agathe auprou*', 'amel bent', 'amouranth', 'ana de armas', 'copine', 'crush', 'cuck*', 'cunni*', 'dua lipa', 'fiak', 'gaelle', 'incel*', 'julia', 'levrette', 'milf*', 'nude*', 'porno', 'simp', 'simps', 'vagin', 'pinkgeek', 'aline*dessine']);

    addPreBoucle('rap', 'Rap', entitySubject, false,
        ['rap', 'rappeur*', 'rappeuse*', 'maes', 'lacrim', 'orelsan', 'ninho', 'ziak', 'gambi', 'gazo', 'kalash', 'niska', 'rohff', 'booba', 'b2o', 'kaaris', 'pnl', 'qlf', 'larse', 'vald', 'mister you', 'eminem', 'wiz khalifa', 'drake', 'xxxtentacion', 'nba youngboy', 'rick ross', 'future', 'travis scott', 'tyga', 'kid cudi', 'pop smoke', 'run the jewels', 'nas', 'tupac', '2pac', 'cardi b', 'kendrick lamar', 'lil wayne', 'nicki minaj', 'jul', 'freeze corleone', 'damso', 'the weekend', 'lil uzi', 'fianso', 'kery james']);

    addPreBoucle('porn', 'Pornographie', entitySubject, false,
        ['porn*', 'p0rn*', 'pron', 'blacked', 'mym', 'onlyfan', 'onlyfans', 'rimjob', 'chaturbate', 'abigail mac', 'addie andrews', 'agatha vega', 'aidra fox', 'alex clark', 'alex grey', 'alexas morgan', 'alina lopez', 'amber moore', 'anissa kate', 'aria sky', 'ariana marie', 'august ames', 'autumn falls', 'bailey mattingly', 'bella rolland', 'blake blossom', 'blake eden', 'bonnie kinz', 'bree daniels', 'brett rossi', 'brittanya razavi', 'celeste', 'dani daniels', 'darcie dolce', 'dillion harper', 'ella hughes', 'elsa jean', 'emily addison', 'emily willis', 'emma mae', 'eva lovia', 'foxy di', 'gabbie carter', 'gianna dior', 'hayden winters', 'hyley winters', 'janice griffith', 'jenna jameson', 'jia lissa', 'josephine jackson', 'kayla kayden', 'kayley gunner', 'keisha grey', 'kendra sunderland', 'kenna james', 'kenzie anne', 'kiera winters', 'lacy lennon', 'lana rhoades', 'leah gotti', 'lena paul', 'lexi belle', 'lily ivy', 'lily love', 'little caprice', 'liya silver', 'lola myluv', 'lucy li', 'luxury girl', 'madi meadows', 'madison ivy', 'malena morgan', 'megan salinas', 'mia malkova', 'mia melano', 'michaela isizzu', 'molly jane', 'nadya nabakova', 'nancy ace', 'natalia starr', 'nicole aniston', 'octokuro', 'peta jensen', 'red fox', 'riley anne', 'riley reid', 'ryan ryans', 'sabrina maree', 'samantha saint', 'scarlett hampton', 'serena becker', 'shae summers', 'simonn', 'skye blue', 'sofi ryan', 'sophia leone', 'stella cox', 'sunny leone', 'sybil a', 'tasha reign', 'tiffany thompson', 'tiny teen', 'tommie jo', 'tori black', 'traci lords', 'tru kait', 'victoria lynn', 'viola bailey', 'whitney westgate', 'woodman', 'bbc', 'valentina nappi', 'jynx maze', 'angela white']);

    addPreBoucle('religion', 'Religion', entitySubject, false,
        ['allah', 'jesus', 'christ*', 'juif*', 'chretien*', 'musulman*', 'islam*', 'judaisme', 'muslim*', 'burka', 'burqa', 'priere', 'dieu', 'religion', 'dhimmi']);

    addPreBoucle('crypto', 'Cryptomonnaies', entitySubject, false,
        ['*crypto*', 'blockchain', 'mineur', 'mining', 'minage', 'nft', 'wallet', 'satoshi', 'bitcoin', 'btc', 'cardano', 'shitcoin', 'ethereum', 'monero', 'libra', 'coinbase', 'eth', 'ripple', 'litecoin', 'tether', 'eos', 'binance', 'tezos', 'to the moon', 'to ze moon', 'bat', 'dogecoin', 'zynecoin', 'kcs', 'fee', 'fees', 'all in', 'kucoin', 'refill', 'bullrun', 'shiba inu']);

    loadPreBouclesStatuses();
}

function isEntityInPreboucles(entityType, entity) {
    let enabledPreboucles = preBoucleArray.filter(pb => pb.enabled && pb.type === entityType).flatMap(pb => pb.entities);
    return enabledPreboucles.includes(entity.toLowerCase());
}

function makeVinzSubjectPure(str) {
    // normalize boucles string and make them as "pure" as possible (also improve performances)
    str = normalizeValue(str).trim();
    str = str.normalizeCompatibility(); // Vinz petit malin tu croyais pouvoir m'échapper ?
    str = replaceNumbersSimilarToCharacters(str);
    str = removeRepeatingCharacters(str);
    return str;
}

function initVinzBoucles() {
    vinzBoucleArray = ['ces photos putain', '"Célestin tu-" "Ferme-là"', 'Yannick, 19 ans, se jette du haut de la Tour Eiffel', '"J\'appelle Metisseur22cm a la barre"', 'Si on rajoute 10% d\'eau à une pastèque qui en contient 90%...', '[DILEMME] 100 000 000 000 000€ mais...', 'Il est bien Midsommar ?', 'AYA CETTE HALLUCINATION AUDITIVE bordel', '(PHOTO) Je me suis gréfé un zizi métallique', '"I call Metisseur22cm a la bar"', '[DILEMME] 100 00000 000 000 000 000 000 000€ à condition...', '"Célestin tu-" "Shut up"', 'Yaniq, dix9 ans, se jette du haut de la Tour Eiffel', 'Is it good MIDSOMMAR ??', 'Si on RAJUSTE dix% d\'O in a PASTÉK qui en CONTI11 quatrevingdix%...', 'But if we put 10% de WATER à une PASTQUE qui en CONTI1 90%...', '[DILEMME] 100 000 000 000 000€ sauf...', 'La tristesse de ces IMAGES bordel', 'Yanique, se suicide haut Tour Eifel'];

    vinzBoucleMessageArray = ['ouvrez vos paupières', 'ouvrez vos gros cons', 'Il tire des lasers', 'je peux m\'autosucer', 'Metisseur22cm à la barre', 'Tu habites dans cette villa', 'vous engagez de les yeux que ne faire pour le regarder malcolm', 'Célestin tu', 'Ferme-la', 'Yannick', 'moi au moins j\'ai une famille', 'film d\'horreur cliché de jumpscares', 'La pastèque se transformerait', 'DO YOU KNOW POMPER L’EAU', 'YOU GOT TO POMPER L’EAU'];

    vinzBoucleArray.forEach((val, index) => {
        vinzBoucleArray[index] = makeVinzSubjectPure(val);
    });

    vinzBoucleMessageArray.forEach((val, index) => {
        vinzBoucleMessageArray[index] = normalizeValue(val);
    });
}

function initShadowent() {
    /*
    const preShadowent = ['U3RvbmVHaWFudA==', 'QW5lcnls', 'Rmx1YnVz', 'bGVhbw==', 'dmlueg==', 'dGFjb3M=', 'a2luYWhl', 'TGVzWWV1eER1Rm9ydW0=', 'Y2lnYXJldHRl', 'd2luZG93c2JvdA==', 'YXJlbnls', 'emVtb3Vyb2lkZQ==', 'amVmYWlzdW5saXZl', 'dHViZWR1dGVtcA==', 'Y3ViZWR1dGVtcA==', 'Y3ViZWR1Y2xhbg==', 'Y3ViZWR1dGFtcA=='];
    preShadowent.forEach((s) => shadowent.push(window.atob(s).trim().toLowerCase()));
    */
    //console.log('shadowent : %o', shadowent);
}

