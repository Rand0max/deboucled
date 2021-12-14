
///////////////////////////////////////////////////////////////////////////////////////
// ANTI-BOUCLES
///////////////////////////////////////////////////////////////////////////////////////

function initPreBoucles() {
    const popularBoucles =
    {
        id: 'popularboucles',
        title: 'Boucles connues',
        enabled: false,
        type: entitySubject,
        entities: ['ces photos putain', 'yannick*tour eiffel', 'metisseur22cm', 'midsommar', 'eau*pasteque', 'celestin tu', 'l\'échéance est tombée', 'ai-je l\'air sympathique', 'pour avoir une copine en', 'no jump', 'john cena est mort', 'par le corps masculin', 'dicaprio au lidl', '2 sauces interdites', 'allemand fou detruit son clavier', 'ma caissiere', 'traduisez en anglais', 'sauce sonic', 'seth gueko', 'gros gamos allemand', 'eau blanche', '*ssache que', 'genre de mec plait', 'dwayne johnson', 'charles auvet', 'now cum', 'let\'s fucking go', 'boule blanche dans la mozarella', 'crocodile chelou', 'forumeur le plus eclatax', 'galet de poche', 'kebab breton']
    };
    const covid19 =
    {
        id: 'covid19',
        title: 'Covid19',
        enabled: false,
        type: entitySubject,
        entities: ['covid*', 'corona*', 'virus', 'gestes barriere', 'geste barriere', '*vaccin*', '*vax*', 'variant*', 'pfizer', 'moderna', 'sanitaire', 'dose*', '*confinement*', '*pass', 'vizio', 'schwab', 'veran', 'pcr', 'antigenique', 'thrombose*', 'oracle', 'omicron', 'cas contact', 'hospitalisations', 'taux d\'incidence', 'myocardite*']
    };
    const politic =
    {
        id: 'politic',
        title: 'Politique',
        enabled: false,
        type: entitySubject,
        entities: ['*zemmour*', 'le z', 'du z', 'pro z', 'pro-z', 'z0zz', 'zozz', 'knafo', 'philippot', 'le pen', 'lepen', 'macron', 'cnews', 'asselineau', 'melenchon', 'lfi', 'france insoumise', 'rn', 'fn', 'rassemblement national', 'front national', 'republique en marche', 'la reconquete', 'fillon', 'veran', 'lrem', 'messiha', 'pecresse', 'xavier bertrand', 'yannick jadot', 'hidalgo', 'bruno lemaire', 'bruno le maire', 'castex', 'darmanin', 'sarkozy', 'sarko', 'taubira', 'ornellas', 'tatiana ventose', 'afghan*', 'ciotti', 'greg toussaint', 'livre noir', 'naulleau', 'rochedy', 'taliban*', 'thais']
    };
    const deviant =
    {
        id: 'deviant',
        title: 'Déviances',
        enabled: false,
        type: entitySubject,
        entities: ['feet*', 'trap*', 'kj', 'adf', 'papa du forum', 'blacked', 'cuck', 'reine fatima', 'shemale*', 'domina', 'fetichiste', 'fetichisme', 'mym', 'onlyfan', 'onlyfans', 'sissy', 'trans', 'transexuel', 'transexuelle', 'lgbt*', 'm2f', 'f2m', 'asmr', 'trav', 'travelo', 'femdom', 'cage de chastete', 'rimjob', 'chaturbate']
    };
    const socials =
    {
        id: 'socials',
        title: 'Réseaux sociaux',
        enabled: false,
        type: entitySubject,
        entities: ['tinder', 'twitter', 'facebook', 'tik*tok', 'adopte un mec', 'meetic', 'badoo', 'okcupid', 'bumble', 'happn', 'insta', 'instagram', 'snapchat', 'mym', 'onlyfan', 'onlyfans']
    };
    const youtube =
    {
        id: 'youtube',
        title: 'Youtube',
        enabled: false,
        type: entitySubject,
        entities: ['youtube', 'feldup', 'norman', 'cyprien', 'natoo', 'kemar', 'jdg', 'joueur du grenier', 'amixem', 'squeezie', 'rire jaune', 'kevin tran', 'michou', 'mcfly', 'carlito', 'inoxtag', 'seblafrite', 'joyca', 'julien chieze', 'kyan khojandi', 'lena situations', 'charlie danger', 'florianonair', 'bench', 'bigflo', 'corda', 'fastgoodcuisine', 'julia', 'otaku', 'papacito', 'stephane edouard']
    };
    const kiddy =
    {
        id: 'kiddy',
        title: 'Immature',
        enabled: false,
        type: entitySubject,
        entities: ['reacprout*', 'prout', 'caca', 'cacaprout', 'pipi', 'chibrax', 'post ou', 'postoo', 'pose toucan']
    };
    const hatred =
    {
        id: 'hatred',
        title: 'Haineux',
        enabled: false,
        type: entitySubject,
        entities: ['facho*', 'chofs', 'chofa*', 'qlf', 'paz', 'pazification', 'pazifie', 's2s', 'gwer*', 'raciste*', 'hagar', 'hagra', '🐊', 'bassem', 'sadek']
    };
    const girls =
    {
        id: 'girls',
        title: 'Femmes',
        enabled: false,
        type: entitySubject,
        entities: ['meuf', 'fille', 'femme', '*/10', '*/20', 'qlf', 'cul', 'sein*', 'boob*', 'bzez', '95e', 'kheyette*', 'colombienne', 'emma roberts', 'estelle redpill', 'lena situations', 'charlie danger', 'natoo', 'tatiana ventose', 'vedovelli', 'abella danger', 'agathe auprou*', 'amel bent', 'amouranth', 'ana de armas', 'copine', 'crush', 'cuck*', 'cunni*', 'dua lipa', 'fiak', 'gaelle', 'incel*', 'julia', 'levrette', 'milf*', 'nude*', 'porno', 'simp*', 'vagin']
    };
    const religion =
    {
        id: 'religion',
        title: 'Religion',
        enabled: false,
        type: entitySubject,
        entities: ['allah', 'jesus', 'christ*', 'juif*', 'chretien*', 'musulman*', 'islam*', 'judaisme', 'muslim*', 'burka', 'burqa', 'priere']
    };

    const boucledAuthors =
    {
        id: 'boucledauthors',
        title: 'Pseudos boucled',
        enabled: false,
        type: entityAuthor,
        entities: ['vinz', 'tacos', 'aneryl', 'flubus', 'kinahe', 'cacadetruire', 'pazeurabsolu', 'antoineforum', 'regimeducamp', 'jaxtaylor', 'procaine', 'antigwer', 'ademonstre', 'abbath', 'bobbob', 'croustipeau', 'cigarette', 'cigarrette', 'deratiseur', 'descogentil', 'erlinghaland', 'grifforzer', 'gutkaiser', 'hommecoussinet', 'huiledecoude', 'hyiga', 'jirenlechove', 'jvc-censure', 'kaguya', 'danmartin', 'kaitokid', 'kiwayjohansson', 'krimson', 'ptitcieux', 'stopcensure', 'supernominateur', 'wohaha', 'zeroavenir', 'windowsbot', 'ylliade', 'mirainikki', 'leao', 'oael', 'surk', 'zemmourfinito', 'labelconfort', 'xinoz', 'zinzinabbath', 'rifson']
    };

    preBoucleArray.push(popularBoucles);
    preBoucleArray.push(boucledAuthors);
    preBoucleArray.push(covid19);
    preBoucleArray.push(politic);
    preBoucleArray.push(deviant);
    preBoucleArray.push(socials);
    preBoucleArray.push(youtube);
    preBoucleArray.push(kiddy);
    preBoucleArray.push(hatred);
    preBoucleArray.push(girls);
    preBoucleArray.push(religion);

    loadPreBouclesStatuses();
}

function makeVinzSubjectPure(str) {
    // normalize boucles string and make them as "pure" as possible (also improve performances)
    str = normalizeValue(str).trim();
    str = replaceNumbersSimilarToCharacters(str);
    str = removeRepeatingCharacters(str);
    return str;
}

function initVinzBoucles() {
    vinzBoucleArray = ['ces photos putain', '"Célestin tu-" "Ferme-là"', 'Yannick, 19 ans, se jette du haut de la Tour Eiffel', '"J\'appelle Metisseur22cm a la barre"', 'Si on rajoute 10% d\'eau à une pastèque qui en contient 90%...', '[DILEMME] 100 000 000 000 000€ mais...', 'Il est bien Midsommar ?', 'AYA CETTE HALLUCINATION AUDITIVE bordel'];

    vinzBoucleArray.forEach((val, index) => {
        vinzBoucleArray[index] = makeVinzSubjectPure(val);
    });
}

