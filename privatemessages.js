
///////////////////////////////////////////////////////////////////////////////////////
// PRIVATE MESSAGES PAGE
///////////////////////////////////////////////////////////////////////////////////////

function findPrivateMessageDefaultParams(doc) {
    if (!doc) return null;
    return [...doc.querySelectorAll('#b-reception > form > input[type=hidden]')]
        .map(fs => ({ name: fs.getAttribute('name'), value: fs.getAttribute('value') }));
}

async function sendPrivateMessagesToSpam(messageIds, onMpPage) {
    const url = 'https://www.jeuxvideo.com/messages-prives/boite-reception.php';
    let mpDoc = onMpPage ? document : await fetchHtml(url);
    let mpFsElements = findPrivateMessageDefaultParams(mpDoc);
    if (!mpFsElements) return;

    var params = new URLSearchParams();
    mpFsElements.forEach(fs => { params.append(fs.name, fs.value); });
    params.append('conv_move', '666');
    messageIds.forEach(m => { params.append('conv_select[]', m) });

    await fetch(url, { method: 'POST', body: params })
        .then(function (response) {
            if (!response.ok) throw Error(response.statusText);
        }).catch(function (err) {
            console.error(err);
        });
}

async function getPrivateMessageAuthor(messageId, hash) {
    const url = 'https://www.jeuxvideo.com/messages-prives/ajax/ajax_mp_get_participants.php';

    var params = new URLSearchParams();
    params.append('idc', messageId);
    params.append('h', hash);

    const resDoc = await fetch(url, { method: 'POST', body: params })
        .then(function (response) {
            if (!response.ok) throw Error(response.statusText);
            return response.text();
        }).then(function (r) {
            const resObj = JSON.parse(r);
            return domParser.parseFromString(resObj.html, 'text/html');
        }).catch(function (err) {
            console.error(err);
        });
    if (!resDoc) return null;
    const authorElem = resDoc.body.querySelector('ul > li > span');
    if (!authorElem) return null;
    return authorElem.textContent.trim();
}

