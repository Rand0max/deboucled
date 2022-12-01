
///////////////////////////////////////////////////////////////////////////////////////
// ANTI-BOUCLES
///////////////////////////////////////////////////////////////////////////////////////

function loadPreboucleArrayCache(entityType) {
    if (entityType === entitySubject) {
        if (!preBoucleSubjectEnabledArray?.length) {
            preBoucleSubjectEnabledArray = preBoucleArray.filter(pb => pb.enabled && pb.type === entityType).flatMap(pb => pb.entities);
        }
    }
    else if (entityType === entityAuthor) {
        if (!preBoucleAuthorEnabledArray?.length) {
            preBoucleAuthorEnabledArray = preBoucleArray.filter(pb => pb.enabled && pb.type === entityType).flatMap(pb => pb.entities);
        }
    }
}

function loadPreBoucleRegexCache() {
    preBoucleArray.forEach(pb => { pb.regex = buildEntityRegex(pb.entities, pb.type === entitySubject); });
}

function isEntityInPreboucles(entityType, entity) {
    const entityLower = entity.toLowerCase();
    const entities = [entityLower, `${entityLower}*`, `*${entityLower}`, `*${entityLower}*`];
    if (entityType === entitySubject) return entities.some(e => preBoucleSubjectEnabledArray.includes(e));
    else if (entityType === entityAuthor) return entities.some(e => preBoucleAuthorEnabledArray.includes(e));
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
    vinzBoucleArray = ['ces photos putain', '"célestin tu-" "ferme-là"', 'yannick, 19 ans, se jette du haut de la tour eiffel', '"j\'appelle metisseur22cm a la barre"', 'si on rajoute 10% d\'eau à une pastèque qui en contient 90%...', '[dilemme] 100 000 000 000 000€ mais...', 'il est bien midsommar ?', 'aya cette hallucination auditive bordel', '(photo) je me suis gréfé un zizi métallique', '"i call metisseur22cm a la bar"', '[dilemme] 100 00000 000 000 000 000 000 000€ à condition...', '"célestin tu-" "shut up"', 'yaniq, dix9 ans, se jette du haut de la tour eiffel', 'is it good midsommar ??', 'si on rajuste dix% d\'o in a pasték qui en conti11 quatrevingdix%...', 'but if we put 10% de water à une pastque qui en conti1 90%...', '[dilemme] 100 000 000 000 000€ sauf...', 'la tristesse de ces images bordel', 'yanique, se suicide haut tour eifel', 'qui s\'en souvient de tomtom et nana', 'le pire restaurant de paris'];

    vinzBoucleMessageArray = ['ouvrez vos paupières', 'ouvrez vos gros cons', 'il tire des lasers', 'je peux m\'autosucer', 'metisseur22cm à la barre', 'tu habites dans cette villa', 'vous engagez de les yeux que ne faire pour le regarder malcolm', 'célestin tu', 'ferme-la', 'yannick', 'moi au moins j\'ai une famille', 'film d\'horreur cliché de jumpscares', 'la pastèque se transformerait', 'do you know pomper l’eau', 'you got to pomper l’eau', 'https://youtu.be/pcdx0wffhiy', 'la belle époque ptn :bave: les bd "j\'aime lire"', 'oh bordel, allez voir les commentaires, ya un commentaire qui a mis un timelapse des moment clés de la vidéo et bordel ya rien qui va dans ce resto'];

    vinzBoucleArray.forEach((val, index) => {
        vinzBoucleArray[index] = makeVinzSubjectPure(val);
    });

    vinzBoucleMessageArray.forEach((val, index) => {
        vinzBoucleMessageArray[index] = normalizeValue(val);
    });
}

/*
function initShadowent() {
const preShadowent = ['U3RvbmVHaWFudA==', 'QW5lcnls', 'Rmx1YnVz', 'bGVhbw==', 'dmlueg==', 'dGFjb3M=', 'a2luYWhl', 'TGVzWWV1eER1Rm9ydW0=', 'Y2lnYXJldHRl', 'd2luZG93c2JvdA==', 'YXJlbnls', 'emVtb3Vyb2lkZQ==', 'amVmYWlzdW5saXZl', 'dHViZWR1dGVtcA==', 'Y3ViZWR1dGVtcA==', 'Y3ViZWR1Y2xhbg==', 'Y3ViZWR1dGFtcA=='];
preShadowent.forEach((s) => shadowent.push(window.atob(s).trim().toLowerCase()));
//console.log('shadowent : %o', shadowent);
}
*/

