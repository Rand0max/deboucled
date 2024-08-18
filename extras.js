
///////////////////////////////////////////////////////////////////////////////////////
// EXTRAS
///////////////////////////////////////////////////////////////////////////////////////

/*
function buildCardForum(mainTitle, rightTitle, contentId, contentHtml, cardId) {
    const cardForum = document.createElement('div');
    cardForum.className = 'card card-jv-forum card-forum-margin';
    const id = cardId ? `id="${cardId}"` : '';
    cardForum.innerHTML = `<div ${id} class="card-header">${mainTitle}<span class="deboucled-card-header-right">${rightTitle}</span></div>
<div class="card-body">
<div class="scrollable">
<div class="scrollable-wrapper">
<div class="scrollable-content bloc-info-forum" id="${contentId}">${contentHtml}
</div></div></div></div>`;
    return cardForum;
}
*/

function buildSponsor() {
    const layoutContentAside = document.querySelector('div.layout__contentAside');
    if (layoutContentAside) {
        const sponsorDiv = document.createElement('div');
        sponsorDiv.innerHTML = `Sponsorisé par <a href="https://jvarchive.com" target="_blank" title="JvArchive">JvArchive</a>`;
        sponsorDiv.className = 'deboucled-sponsor';
        layoutContentAside.appendChild(sponsorDiv);
    }

    /*
    const forumRightCol = document.querySelector('div#forum-right-col');
    if (forumRightCol && !decensuredActive) {
        const decensuredLink = `<a href="${decensuredUrl}" target="_blank"><b>Décensured</b> <span class="deboucled-sponsoring-decensured-logo"></span></a>`;
        const decensuredCardHtml = `<div class="deboucled-sponsoring"><div style="font-weight: 800;">Marre des bans et des 410 intempestifs ?</div><div>Découvrez ${decensuredLink} le script anti-censure !</div></div>`;
        const decensuredCard = buildCardForum('Déboucled présente', '', 'deboucled-sponsoring-decensured', decensuredCardHtml, 'card-header-decensured');
        forumRightCol.appendChild(decensuredCard);
    }
    */
}

function buildSupport() {
    const layoutContentAside = document.querySelector('div.layout__contentAside');
    if (!layoutContentAside) return;

    const supportLogo = '<span class="deboucled-support-logo"></span>';
    const supportDiv = document.createElement('div');
    supportDiv.className = 'deboucled-support';
    supportDiv.innerHTML = `Aider Déboucled ${supportLogo}`;
    supportDiv.title = 'Faire un don';
    layoutContentAside.appendChild(supportDiv);
    // supportDiv.onclick = () => window.open(`https://commerce.coinbase.com/checkout/8ea5e4cc-cc0b-432f-852f-5cc4e30458b5`, '_blank');
    supportDiv.onclick = () => window.open(`https://www.buymeacoffee.com/jvcdeboucled`, '_blank');
}

function displaySecret() {
    const dateNow = new Date();
    const firstOfApril = new Date(dateNow.getFullYear(), 3, 1);
    if (!dateIsToday(firstOfApril)) return;

    const secretDisplayed = store.get(storage_secret_displayed, storage_secret_displayed_default);
    if (secretDisplayed) return;

    const topics = document.querySelector('.conteneur-topic-pagi');
    const wrapper = document.querySelector('#forum-main-col');
    const blocFormulaire = document.querySelector('#bloc-formulaire-forum');
    const prePagi = document.querySelector('.bloc-pre-pagi-forum');

    if (!topics || !wrapper || !blocFormulaire || !prePagi) return;

    const msg = 'POISSON D\'AVRIL :)\n\n- Déboucled';
    topics.style.display = 'none';
    blocFormulaire.style.display = 'none';
    prePagi.style.display = 'none';

    let forbidden = document.createElement('div');
    forbidden.setAttribute('class', 'deboucled-forbidden deboucled-svg-forbidden-red');
    forbidden.innerHTML = '<img class="img-erreur img-fluid text-center" src="/img/erreurs/e410.png" alt="ERREUR 410">';
    forbidden.onclick = function () {
        alert(msg);
        topics.style.display = 'table';
        blocFormulaire.style.display = 'block';
        forbidden.style.display = 'none';
        prePagi.style.display = 'block';
    };
    wrapper.appendChild(forbidden);
    console.log(msg);

    alert('Suite à des manquements répétés à la charte du site, vous avez été banni définitivement par la modération de jeuxvideo.com.\n\nPour toute réclamation, merci de vous adresser au support à l\'adresse suivante : paix@jeuxvideo.com.');
    store.set(storage_secret_displayed, true);
}

function displayAnnouncement() {
    const announcementDisplayed = store.get(storage_announcement_displayed, storage_announcement_displayed_default);
    if (announcementDisplayed) return;
    store.set(storage_announcement_displayed, true);

    const supportButton = document.querySelector('.deboucled-support');
    if (!supportButton) return;
    supportButton.classList.add('blinking');

    // eslint-disable-next-line no-undef
    Swal.fire({
        title: '<strong>Déboucled a besoin de vous !<strong>',
        html: `<p>Après plus de deux ans de développement et d'améliorations de l'outil, nous faisons humblement appel à votre aide.</p><p><b>Pour fonctionner, Déboucled a besoin d'une infrastructure couteuse, d'investissement personnel et de beaucoup de temps.</b></p><p><i>Avec votre soutien, nous pourrons continuer.<i/></p>
        <img src="https://image.noelshack.com/fichiers/2022/22/7/1654433573-cavillax.png" alt="paz" width="100" height="75"></img>`,
        icon: 'info',
        showDenyButton: true,
        confirmButtonText: 'Je souhaite aider',
        denyButtonText: 'Non merci',
        footer: '<a href="mailto:rand0max@protonmail.com">Nous contacter</a>',
        customClass: {
            confirmButton: 'deboucled-bold'
        },
    }).then((result) => {
        if (result.isConfirmed) {
            window.open(`https://www.buymeacoffee.com/jvcdeboucled`, '_blank').focus();
        }
        // else if (result.isDenied) {
        //     window.open('https://youtu.be/KkxZfUlNlDo', '_blank').focus();
        // }
    });
}

function buildExtras() {
    buildSupport();
    buildSponsor();
}

function allowMobileZoom() {
    let viewportMeta = document.getElementById('meta-viewport');
    if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }
}